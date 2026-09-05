import { expect } from '@playwright/test';
import * as path from 'path';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { ChaosDashboardPage } from '../../../pages/chaos-dashboard.page';

type ConcurrentStockRaceTestData = {
  book: {
    id: number;
    title: string;
    stock: number;
  };
  buyerOne: {
    firstName: string;
    lastName: string;
    creditCard: string;
  };
  buyerTwo: {
    firstName: string;
    lastName: string;
    creditCard: string;
  };
  expected: {
    successMessage: string;
    conflictStatusCode: number;
    conflictErrorMessage: string;
  };
};

const testDataPath = path.join(__dirname, '../../../test-data/ui/Checkout/Test_007_ConcurrentStockRaceCondition.json');
const TestData = require(testDataPath) as ConcurrentStockRaceTestData;

test.describe('Concurrent Stock Race Condition & Chaos Dashboard Resilience', () => {

  test('TC-CONC-001: Concurrent buyers competing for final stock unit (stock = 1) results in exactly one 200 OK and one 409 Conflict @smoke @regression @chaos', async ({
    catalogPage,
    signUpPage,
    commonFunctions,
    page,
    apiUtil,
    chaosDashboardPage
  }) => {
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const timestamp = Date.now();
    const userA = `racer_a_${timestamp}`;
    const userB = `racer_b_${timestamp}`;
    const password = 'Password123!';
    let cookieA = '';
    let cookieB = '';

    await test.step('Prepare Clean Test State & Initialize Single Stock Unit', async () => {
      // 1. Reset baseline data
      await apiUtil.makeRequest({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/test/reset`,
        logMessage: 'Resetting test database to baseline'
      });

      // 2. Set target book stock count to exactly 1
      const stockRes = await apiUtil.makeRequest<{ success: boolean; bookId: string; stock: number }>({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/test/books/${TestData.book.id}/stock`,
        data: { stock: TestData.book.stock },
        logMessage: `Setting Book ${TestData.book.id} stock count to ${TestData.book.stock}`
      });

      const isStockSet = await commonFunctions.compareTwoValues(stockRes.stock, 1, 'Verifying stock is set to exactly 1');
      expect(isStockSet).toBeTruthy();
    });

    await test.step('Register and Authenticate Two Concurrent Buyers', async () => {
      // Register Buyer A
      await apiUtil.makeRequest({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/register`,
        data: { username: userA, password, fullName: `${TestData.buyerOne.firstName} ${TestData.buyerOne.lastName}` },
        logMessage: 'Registering Buyer A'
      });

      // Login Buyer A and extract session cookie
      const loginResA = await apiUtil.makeRequest<any>({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/login`,
        data: { username: userA, password },
        logMessage: 'Authenticating Buyer A',
        responseType: 'full'
      });
      const rawCookieA = loginResA.headers?.['set-cookie']?.[0] || '';
      cookieA = rawCookieA.split(';')[0];

      // Register Buyer B
      await apiUtil.makeRequest({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/register`,
        data: { username: userB, password, fullName: `${TestData.buyerTwo.firstName} ${TestData.buyerTwo.lastName}` },
        logMessage: 'Registering Buyer B'
      });

      // Login Buyer B and extract session cookie
      const loginResB = await apiUtil.makeRequest<any>({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/login`,
        data: { username: userB, password },
        logMessage: 'Authenticating Buyer B',
        responseType: 'full'
      });
      const rawCookieB = loginResB.headers?.['set-cookie']?.[0] || '';
      cookieB = rawCookieB.split(';')[0];

      expect(cookieA).toBeTruthy();
      expect(cookieB).toBeTruthy();
    });

    await test.step('Stage Final Stock Unit in Both Buyers Carts', async () => {
      // Buyer A adds Book #1 to Cart
      await apiUtil.makeRequest({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/cart`,
        data: { bookId: String(TestData.book.id) },
        headers: { Cookie: cookieA },
        logMessage: 'Buyer A adding last stock book to cart'
      });

      // Buyer B adds Book #1 to Cart
      await apiUtil.makeRequest({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/cart`,
        data: { bookId: String(TestData.book.id) },
        headers: { Cookie: cookieB },
        logMessage: 'Buyer B adding last stock book to cart'
      });
    });

    await test.step('Execute Parallel Checkout Requests (Race Condition)', async () => {
      const checkoutPromiseA = apiUtil.makeRequest<any>({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/checkout/process`,
        data: {
          firstName: TestData.buyerOne.firstName,
          lastName: TestData.buyerOne.lastName,
          creditCard: TestData.buyerOne.creditCard
        },
        headers: { Cookie: cookieA },
        responseType: 'full',
        logMessage: 'Buyer A initiating concurrent checkout'
      });

      const checkoutPromiseB = apiUtil.makeRequest<any>({
        method: 'POST',
        url: `${envConfig.apiBaseUrl}/api/checkout/process`,
        data: {
          firstName: TestData.buyerTwo.firstName,
          lastName: TestData.buyerTwo.lastName,
          creditCard: TestData.buyerTwo.creditCard
        },
        headers: { Cookie: cookieB },
        responseType: 'full',
        logMessage: 'Buyer B initiating concurrent checkout'
      });

      const [resA, resB] = await Promise.all([checkoutPromiseA, checkoutPromiseB]);

      const statuses = [resA.status, resB.status];
      const has200 = statuses.includes(200);
      const has409 = statuses.includes(409);

      const isSingleWinner = await commonFunctions.compareTwoValues(has200, true, 'Verifying exactly one request succeeded with 200');
      const isConflictDetected = await commonFunctions.compareTwoValues(has409, true, 'Verifying competing request rejected with 409 Conflict');

      expect(isSingleWinner).toBeTruthy();
      expect(isConflictDetected).toBeTruthy();
    });

    await test.step('Verify Final Inventory Stock Depleted Without Negative Overselling', async () => {
      const bookRes = await apiUtil.makeRequest<{ stock: number }>({
        method: 'GET',
        url: `${envConfig.apiBaseUrl}/api/books/${TestData.book.id}`,
        logMessage: 'Fetching updated inventory stock for Book 1'
      });

      const isStockZero = await commonFunctions.compareTwoValues(bookRes.stock, 0, 'Asserting stock count is exactly 0');
      expect(isStockZero).toBeTruthy();
    });

    await test.step('Navigate to Interactive Chaos Dashboard and Verify Live Controls', async () => {
      await chaosDashboardPage.navigateToDashboard(envConfig.baseUrl);
      const isVisible = await chaosDashboardPage.isDashboardVisible();
      expect(isVisible).toBeTruthy();

      await expect.poll(async () => await chaosDashboardPage.getStatusBadgeText(), {
        message: 'Expected Chaos Dashboard status badge to show Live Engine Active',
        timeout: 10000,
        intervals: [500, 1000]
      }).toContain('Live Engine Active');

      // Select High Contention preset and apply
      await chaosDashboardPage.selectPreset('high-contention');
      await chaosDashboardPage.applyChaosConfig();

      // Reset to baseline defaults
      await chaosDashboardPage.resetToDefaults();
    });
  });

});

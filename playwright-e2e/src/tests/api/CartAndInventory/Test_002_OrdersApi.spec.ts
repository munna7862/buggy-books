import { test, expect } from '@playwright/test';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { envConfig } from '../../../config/env.config';
import { CommonFunctions } from '../../../utils/common.util';

const commonUtil = new CommonFunctions();

type OrdersApiTestData = {
  checkoutDetails: {
    firstName: string;
    lastName: string;
    cardNumber: string;
  };
  bookId: string;
};

const testDataPath = path.join(__dirname, '../../../test-data/api/CartAndInventory/Test_002_OrdersApi.json');
const TestData = require(testDataPath) as OrdersApiTestData;

function uniqueUsername(prefix: string = 'api_orders_user'): string {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

test.describe('Orders API Endpoint', () => {

  test('API_ORD_01: Authenticate user, complete checkout via API, and verify GET /api/orders history response', async ({ request }) => {

    const username = uniqueUsername();
    const password = 'Password123!';
    const apiBase = envConfig.apiBaseUrl;

    let isOrdersValid = false;

    await test.step('Register new user session via API', async () => {
      const regRes = await request.post(`${apiBase}/api/register`, {
        data: { username, password, fullName: 'API Orders User' }
      });
      expect(regRes.status()).toBe(201);
    });

    await test.step('Add book to cart and process checkout via API', async () => {
      const addRes = await request.post(`${apiBase}/api/cart`, {
        headers: { 'x-bypass-csrf': 'true' },
        data: { bookId: TestData.bookId }
      });
      expect(addRes.status()).toBe(200);

      const checkoutRes = await request.post(`${apiBase}/api/checkout/process`, {
        headers: { 'x-bypass-csrf': 'true' },
        data: TestData.checkoutDetails
      });
      expect(checkoutRes.status()).toBe(200);
    });

    await test.step('Fetch GET /api/orders and verify orders list payload', async () => {
      const ordersRes = await request.get(`${apiBase}/api/orders`);
      const status = ordersRes.status();
      const orders = await ordersRes.json();

      const isStatusOk = status === 200;
      const isArray = Array.isArray(orders);
      const hasOrder = isArray && orders.length > 0;

      const isValidPayload = isStatusOk && isArray && hasOrder;

      isOrdersValid = await commonUtil.compareTwoValues(
        isValidPayload,
        true,
        'Verifying GET /api/orders returns 200 OK and non-empty array of placed orders'
      );
    });

    expect(isOrdersValid).toBeTruthy();
  });

});

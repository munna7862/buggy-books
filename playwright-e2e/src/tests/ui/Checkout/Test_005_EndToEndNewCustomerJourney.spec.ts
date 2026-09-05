import { expect } from '@playwright/test';
import * as path from 'path';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

type EndToEndJourneyTestData = {
  user: {
    fullName: string;
    password: string;
  };
  search: {
    searchTerm: string;
    bookId: number;
  };
  payment: {
    firstName: string;
    lastName: string;
    cardNumber: string;
  };
  expected: {
    addToCartMessage: string;
    paymentSuccessMessage: string;
  };
};

const testDataPath = path.join(__dirname, '../../../test-data/ui/Checkout/Test_005_EndToEndNewCustomerJourney.json');
const TestData = require(testDataPath) as EndToEndJourneyTestData;

import { randomBytes } from 'crypto';

function uniqueUsername(prefix: string = 'e2e_customer'): string {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('End-to-End User Journey', () => {

  test('Testcase 1: Complete New Customer E2E Journey from Registration to Checkout @smoke @regression', async ({ signUpPage, catalogPage, bookDetailPage, commonFunctions, page, networkInterceptor }) => {
    // networkInterceptor fixture automatically logs API calls
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const dynamicUsername = uniqueUsername();
    let isRegistered = false;
    let isSearchSuccessful = false;
    let isDetailVerified = false;
    let isCartVerified = false;
    let isPaymentSuccessful = false;
    let isLogoutSuccessful = false;

    await test.step('Step 1: Register New Customer Account', async () => {
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.clickNavigateLink('Sign Up');
      isRegistered = await signUpPage.registerNewUser(
        TestData.user.fullName,
        dynamicUsername,
        TestData.user.password,
        TestData.user.password
      );
      const isRegNavigated = await commonFunctions.compareTwoValues(isRegistered, true, "Verifying new user registered and logged in successfully");
      expect(isRegNavigated).toBeTruthy();
    });

    await test.step('Step 2: Search for Book in Catalog', async () => {
      await catalogPage.clickNavigateLink('Catalog');
      await catalogPage.searchBooks(TestData.search.searchTerm);
      const resultText = await catalogPage.getResultCountText();
      const hasResults = resultText.length > 0 && !resultText.includes('0 items');
      isSearchSuccessful = await commonFunctions.compareTwoValues(hasResults, true, `Verifying catalog search results for '${TestData.search.searchTerm}'`);
    });

    await test.step('Step 3: Inspect Book Details', async () => {
      await catalogPage.clickBookTitle(TestData.search.bookId);
      const bookTitle = await bookDetailPage.getBookTitle();
      const bookPrice = await bookDetailPage.getBookPrice();
      const isTitleValid = bookTitle.length > 0;
      const isPriceValid = bookPrice.length > 0;
      isDetailVerified = await commonFunctions.compareTwoValues(isTitleValid && isPriceValid, true, "Verifying book detail title and price are displayed");
    });

    await test.step('Step 4: Add Book to Cart from Detail Page', async () => {
      const responsePromise = page.waitForResponse(res => res.url().includes('/api/cart') && res.status() === 200);
      await bookDetailPage.clickAddToCart();
      await responsePromise;
      await catalogPage.waitForCartStatusMessage(TestData.expected.addToCartMessage);
    });

    await test.step('Step 5: Review Cart Items and Total', async () => {
      await cartPage.openCart();
      const cartItemText = await cartPage.getCartItemText();
      const cartTotalText = await cartPage.getCartTotalText();
      const hasCartItems = cartItemText.length > 0;
      const hasCartTotal = cartTotalText.length > 0;
      isCartVerified = await commonFunctions.compareTwoValues(hasCartItems && hasCartTotal, true, "Verifying cart contains item and order total");
    });

    await test.step('Step 6: Complete Checkout Process', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.completePaymentSuccessfully(
        TestData.payment.firstName,
        TestData.payment.lastName,
        TestData.payment.cardNumber,
        TestData.expected.paymentSuccessMessage
      );
      isPaymentSuccessful = true;
    });

    await test.step('Step 7: Verify Order Completion & Logout', async () => {
      await catalogPage.clickLogout();
      const isLoginLinkVisible = await catalogPage.isLoginVisible();
      isLogoutSuccessful = await commonFunctions.compareTwoValues(isLoginLinkVisible, true, "Verifying user logged out successfully after completing order");
    });

    // Consolidated hard assertion enforcing complete end-to-end success
    expect(isRegistered && isSearchSuccessful && isDetailVerified && isCartVerified && isPaymentSuccessful && isLogoutSuccessful).toBeTruthy();
  });

});

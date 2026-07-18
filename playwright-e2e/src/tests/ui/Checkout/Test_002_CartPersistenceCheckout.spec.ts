import { expect } from '@playwright/test';
import * as path from 'path';
import { test } from '../../../core/base/base.fixture';
import { envConfig, getLoginCredentials } from '../../../config/env.config';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

type CartPersistenceCheckoutTestData = {
  book: {
    id: number;
  };
  payment: {
    firstName: string;
    lastName: string;
    invalidCardNumber: string;
    validCardNumber: string;
    retryAttempts: number;
  };
  expected: {
    addToCartMessage: string;
    bookPrice: string;
    cartTotal: string;
    checkoutTotal: string;
    paymentSuccessMessage: string;
  };
};

const testDataPath = path.join(__dirname, '../../../test-data/ui/Checkout/Test_002_CartPersistenceCheckout.json');
const TestData = require(testDataPath) as CartPersistenceCheckoutTestData;

test.describe('Cart Persistence Checkout', () => {

  test('Testcase 1: Complete checkout after cart persists across logout and login', async ({ signUpPage, catalogPage, commonFunctions, page, networkInterceptor }) => {
    // networkInterceptor fixture automatically captures network logs (no direct usage needed)
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const { userName, password } = getLoginCredentials();

    await test.step('Navigate to Book Catalog', async () => {
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
    });

    await test.step('Login with Existing User', async () => {
      await catalogPage.clickNavigateLink("Login");
      const isLogin = await signUpPage.login(userName, password);
      const isNavigated = await commonFunctions.compareTwoValues(isLogin, true, "Verifying if user logged in successfully");
      expect(isNavigated).toBeTruthy();
    });

    await test.step('Prepare Empty Cart', async () => {
      await cartPage.openCart();
      await cartPage.clearAllItemsIfPresent();
      await catalogPage.clickNavigateLink("Catalog");
    });

    await test.step('Add Book to Cart', async () => {
      await catalogPage.addBookToCart(TestData.book.id);
      await catalogPage.waitForCartStatusMessage(TestData.expected.addToCartMessage);
    });

    await test.step('Review Cart Before Logout', async () => {
      await cartPage.openCart();
      expect(await cartPage.getCartItemText()).toContain(TestData.expected.bookPrice);
      expect(await cartPage.getCartTotalText()).toContain(TestData.expected.cartTotal);
    });

    await test.step('Logout', async () => {
      await catalogPage.clickLogout();
      const isLogout = await commonFunctions.compareTwoValues(await catalogPage.isLoginVisible(), true, "Verifying if user logged out successfully");
      expect(isLogout).toBeTruthy();
    });

    await test.step('Login Again with Existing User', async () => {
      const isLogin = await signUpPage.login(userName, password);
      const isNavigated = await commonFunctions.compareTwoValues(isLogin, true, "Verifying if user logged in successfully again");
      expect(isNavigated).toBeTruthy();
    });

    await test.step('Verify Cart Persists After Login', async () => {
      await cartPage.openCart();
      expect(await cartPage.getCartItemText()).toContain(TestData.expected.bookPrice);
      expect(await cartPage.getCartTotalText()).toContain(TestData.expected.cartTotal);
    });

    await test.step('Proceed to Checkout', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.waitForOrderTotalAmount(TestData.expected.checkoutTotal);
    });

    await test.step('Complete Payment After Correcting Card Number', async () => {
      await checkoutPage.completePaymentAfterInvalidCardRetry(
        TestData.payment.firstName,
        TestData.payment.lastName,
        TestData.payment.invalidCardNumber,
        TestData.payment.validCardNumber,
        TestData.expected.paymentSuccessMessage,
        TestData.payment.retryAttempts
      );
    });

    await test.step('Logout', async () => {
      await catalogPage.clickLogout();
      const isLogout = await commonFunctions.compareTwoValues(await catalogPage.isLoginVisible(), true, "Verifying if user logged out successfully");
      expect(isLogout).toBeTruthy();
    });
  });

});

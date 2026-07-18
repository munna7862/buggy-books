import { expect } from '@playwright/test';
import * as path from 'path';
import { test } from '../../../core/base/base.fixture';
import { envConfig, getLoginCredentials } from '../../../config/env.config';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

type CompleteBookPurchaseTestData = {
  book: {
    id: number;
  };
  payment: {
    firstName: string;
    lastName: string;
    cardNumber: string;
  };
  expected: {
    addToCartMessage: string;
    bookPrice: string;
    cartTotal: string;
    checkoutTotal: string;
    paymentSuccessMessage: string;
  };
};

const testDataPath = path.join(__dirname, '../../../test-data/ui/Checkout/Test_001_CompleteBookPurchase.json');
const TestData = require(testDataPath) as CompleteBookPurchaseTestData;

test.describe('Complete Book Purchase', () => {

  test('Testcase 1: Complete book purchase successfully', async ({ signUpPage, catalogPage, commonFunctions, page, networkInterceptor }) => {
    // networkInterceptor fixture automatically captures network logs (no direct usage needed)
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await test.step('Navigate to Book Catalog', async () => {
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
    });

    await test.step('Login with Existing User', async () => {
      await catalogPage.clickNavigateLink("Login");
      const { userName, password } = getLoginCredentials();
      const isLogin = await signUpPage.login(userName, password);
      const isNavigated = await commonFunctions.compareTwoValues(isLogin, true, "Verifying if user logged in successfully");
      expect(isNavigated).toBeTruthy();
    });

    await test.step('Prepare Empty Cart', async () => {
      await cartPage.openCart();
      await cartPage.clearAllItemsIfPresent();
      await catalogPage.clickNavigateLink("Catalog");
    });

    await test.step('Add First Book to Cart', async () => {
      await catalogPage.addBookToCart(TestData.book.id);
      await catalogPage.waitForCartStatusMessage(TestData.expected.addToCartMessage);
    });

    await test.step('Review Cart', async () => {
      await cartPage.openCart();
      expect(await cartPage.getCartItemText()).toContain(TestData.expected.bookPrice);
      expect(await cartPage.getCartTotalText()).toContain(TestData.expected.cartTotal);
    });

    await test.step('Proceed to Checkout', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.waitForOrderTotalAmount(TestData.expected.checkoutTotal);
    });

    await test.step('Complete Payment', async () => {
      await checkoutPage.completePaymentSuccessfully(TestData.payment.firstName, TestData.payment.lastName, TestData.payment.cardNumber, TestData.expected.paymentSuccessMessage);
    });

    await test.step('Logout', async () => {
      await catalogPage.clickLogout();
      const isLogout = await commonFunctions.compareTwoValues(await catalogPage.isLoginVisible(), true, "Verifying if user logged out successfully");
      expect(isLogout).toBeTruthy();
    });
  });

});

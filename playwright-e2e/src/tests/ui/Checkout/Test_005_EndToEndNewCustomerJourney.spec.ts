import * as path from 'path';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { randomBytes } from 'crypto';

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

function uniqueUsername(prefix: string = 'e2e_customer'): string {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('End-to-End User Journey', () => {

  test('Testcase 1: Complete New Customer E2E Journey from Registration to Checkout @smoke @regression', async ({ signUpPage, catalogPage, bookDetailPage, commonFunctions, page }) => {
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const dynamicUsername = uniqueUsername();

    await test.step('Step 1: Register New Customer Account', async () => {
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.clickNavigateLink('Sign Up');
      const isRegistered = await signUpPage.registerNewUser(
        TestData.user.fullName,
        dynamicUsername,
        TestData.user.password,
        TestData.user.password
      );
      await commonFunctions.verifyValue(isRegistered, true, "Verifying new user registered and logged in successfully");
    });

    await test.step('Step 2: Search for Book in Catalog', async () => {
      await catalogPage.clickNavigateLink('Catalog');
      await catalogPage.searchBooks(TestData.search.searchTerm);
      const resultText = await catalogPage.getResultCountText();
      const hasResults = resultText.length > 0 && !resultText.includes('0 items');
      await commonFunctions.verifyCondition(hasResults, `Verifying catalog search results for '${TestData.search.searchTerm}'`);
    });

    await test.step('Step 3: Inspect Book Details', async () => {
      await catalogPage.clickBookTitle(TestData.search.bookId);
      const bookTitle = await bookDetailPage.getBookTitle();
      const bookPrice = await bookDetailPage.getBookPrice();
      const isTitleValid = bookTitle.length > 0;
      const isPriceValid = bookPrice.length > 0;
      await commonFunctions.verifyCondition(isTitleValid && isPriceValid, "Verifying book detail title and price are displayed");
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
      await commonFunctions.verifyCondition(hasCartItems && hasCartTotal, "Verifying cart contains item and order total");
    });

    await test.step('Step 6: Complete Checkout Process', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.completePaymentSuccessfully(
        TestData.payment.firstName,
        TestData.payment.lastName,
        TestData.payment.cardNumber,
        TestData.expected.paymentSuccessMessage
      );
    });

    await test.step('Step 7: Verify Order Completion & Logout', async () => {
      await catalogPage.clickLogout();
      const isLoginLinkVisible = await catalogPage.isLoginVisible();
      await commonFunctions.verifyValue(isLoginLinkVisible, true, "Verifying user logged out successfully after completing order");
    });
  });

});

import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Checkout/Test_003_CartAndCheckoutValidation.json';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Cart Management and Checkout Validation', () => {

  test('UI_CART_02: Remove Item from Cart @regression', async ({ signUpPage, catalogPage, cartPage, commonFunctions, page, networkInterceptor }) => {
    await page.goto(envConfig.baseUrl);
    const testUser = TestData.USER_A_PREFIX + commonFunctions.generateRandomString(5);

    let isInitialCountValid = false;
    let isCountReduced = false;
    let isTotalUpdated = false;

    await test.step('Register dynamic user and navigate to catalog', async () => {
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
    });

    await test.step('Add two items to cart', async () => {
      await catalogPage.addBookToCart(1);
      await catalogPage.addBookToCart(2);
    });

    await test.step('Navigate to cart and verify initial state', async () => {
      await cartPage.openCart();
      const initialCount = await cartPage.getCartItemsCount();
      isInitialCountValid = await commonFunctions.compareTwoValues(initialCount, 2, "Verifying initial cart item count");
    });

    await test.step('Remove first item and verify item removal and total price update', async () => {
      const initialTotal = await cartPage.getCartTotalAmount();
      await cartPage.removeFirstCartItem();

      const remainingCount = await cartPage.getCartItemsCount();
      isCountReduced = await commonFunctions.compareTwoValues(remainingCount, 1, "Verifying cart item count after removal");

      const remainingTotal = await cartPage.getCartTotalAmount();
      isTotalUpdated = await commonFunctions.compareTwoValues(remainingTotal < initialTotal && remainingTotal > 0, true, "Verifying total price updated after item removal");
    });

    expect(isInitialCountValid && isCountReduced && isTotalUpdated).toBeTruthy();
  });

  test('UI_CART_03: User Cart Isolation @regression', async ({ signUpPage, catalogPage, cartPage, commonFunctions, page, networkInterceptor }) => {
    const userA = TestData.USER_A_PREFIX + commonFunctions.generateRandomString(5);
    const userB = TestData.USER_B_PREFIX + commonFunctions.generateRandomString(5);

    let isUserACartPopulated = false;
    let isUserBCartEmpty = false;

    await test.step('Register User A, navigate to catalog, and add item to cart', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${userA}`, userA, TestData.PASSWORD, TestData.PASSWORD);

      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
      await catalogPage.addBookToCart(1);

      await cartPage.openCart();
      const userACount = await cartPage.getCartItemsCount();
      isUserACartPopulated = await commonFunctions.compareTwoValues(userACount, 1, "Verifying User A cart contains added item");
    });

    await test.step('Logout User A', async () => {
      await catalogPage.clickLogout();
    });

    await test.step('Register User B and verify User B cart is isolated and empty', async () => {
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${userB}`, userB, TestData.PASSWORD, TestData.PASSWORD);

      await cartPage.openCart();
      const isEmpty = await cartPage.isCartEmpty();
      isUserBCartEmpty = await commonFunctions.compareTwoValues(isEmpty, true, "Verifying User B cart is completely empty");
    });

    expect(isUserACartPopulated && isUserBCartEmpty).toBeTruthy();
  });

  test('UI_CHECK_01: Checkout Form Validation @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page, networkInterceptor }) => {
    await page.goto(envConfig.baseUrl);
    const testUser = TestData.USER_A_PREFIX + commonFunctions.generateRandomString(5);

    let isFirstNameErrValid = false;
    let isLastNameErrValid = false;
    let isAddressErrValid = false;
    let isCityErrValid = false;

    await test.step('Register dynamic user, navigate to catalog, add item to cart and proceed to checkout', async () => {
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);

      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
      await catalogPage.addBookToCart(1);

      await cartPage.openCart();
      await cartPage.proceedToCheckout();
    });

    await test.step('Attempt to proceed to next step with empty fields and verify inline errors', async () => {
      await checkoutPage.clickNextStepWithoutValidationWait();
      const errors = await checkoutPage.getFieldErrors();

      isFirstNameErrValid = await commonFunctions.compareTwoValues(errors.includes(TestData.FIRST_NAME_ERR), true, "Verifying First Name required error");
      isLastNameErrValid = await commonFunctions.compareTwoValues(errors.includes(TestData.LAST_NAME_ERR), true, "Verifying Last Name required error");
      isAddressErrValid = await commonFunctions.compareTwoValues(errors.includes(TestData.ADDRESS_ERR), true, "Verifying Address length error");
      isCityErrValid = await commonFunctions.compareTwoValues(errors.includes(TestData.CITY_ERR), true, "Verifying City required error");
    });

    expect(isFirstNameErrValid && isLastNameErrValid && isAddressErrValid && isCityErrValid).toBeTruthy();
  });

});

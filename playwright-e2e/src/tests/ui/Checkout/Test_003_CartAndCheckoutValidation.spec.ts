import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Checkout/Test_003_CartAndCheckoutValidation.json';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Cart Management and Checkout Validation', () => {

  test('UI_CART_02: Remove Item from Cart @regression', async ({ signUpPage, catalogPage, cartPage, commonFunctions, page }) => {
    await page.goto(envConfig.baseUrl);
    const testUser = TestData.USER_A_PREFIX + commonFunctions.generateRandomString(5);

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
      await commonFunctions.verifyValue(initialCount, 2, "Verifying initial cart item count");
    });

    await test.step('Remove first item and verify item removal and total price update', async () => {
      const initialTotal = await cartPage.getCartTotalAmount();
      await cartPage.removeFirstCartItem();

      const remainingCount = await cartPage.getCartItemsCount();
      await commonFunctions.verifyValue(remainingCount, 1, "Verifying cart item count after removal");

      const remainingTotal = await cartPage.getCartTotalAmount();
      await commonFunctions.verifyCondition(
        remainingTotal < initialTotal && remainingTotal > 0,
        "Verifying total price updated after item removal"
      );
    });
  });

  test('UI_CART_03: User Cart Isolation @regression', async ({ signUpPage, catalogPage, cartPage, commonFunctions, page }) => {
    const userA = TestData.USER_A_PREFIX + commonFunctions.generateRandomString(5);
    const userB = TestData.USER_B_PREFIX + commonFunctions.generateRandomString(5);

    await test.step('Register User A, navigate to catalog, and add item to cart', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${userA}`, userA, TestData.PASSWORD, TestData.PASSWORD);

      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
      await catalogPage.addBookToCart(1);

      await cartPage.openCart();
      const userACount = await cartPage.getCartItemsCount();
      await commonFunctions.verifyValue(userACount, 1, "Verifying User A cart contains added item");
    });

    await test.step('Logout User A', async () => {
      await catalogPage.clickLogout();
    });

    await test.step('Register User B and verify User B cart is isolated and empty', async () => {
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${userB}`, userB, TestData.PASSWORD, TestData.PASSWORD);

      await cartPage.openCart();
      const isEmpty = await cartPage.isCartEmpty();
      await commonFunctions.verifyValue(isEmpty, true, "Verifying User B cart is completely empty");
    });
  });

  test('UI_CHECK_01: Checkout Form Validation @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page }) => {
    await page.goto(envConfig.baseUrl);
    const testUser = TestData.USER_A_PREFIX + commonFunctions.generateRandomString(5);

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

      await commonFunctions.verifyCondition(errors.includes(TestData.FIRST_NAME_ERR), "Verifying First Name required error");
      await commonFunctions.verifyCondition(errors.includes(TestData.LAST_NAME_ERR), "Verifying Last Name required error");
      await commonFunctions.verifyCondition(errors.includes(TestData.ADDRESS_ERR), "Verifying Address length error");
      await commonFunctions.verifyCondition(errors.includes(TestData.CITY_ERR), "Verifying City required error");
    });
  });

});

import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Checkout/Test_004_CheckoutWizardValidation.json';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Multi-Step Checkout Wizard', () => {

  test('UI_WIZ_01: Stepper Transition Validation @smoke @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isStep1Active = false;
    let isStep1Visible = false;
    let isStep2Active = false;
    let isShippingHidden = false;
    let isPaymentVisible = false;

    await test.step('Register user, add book to cart, and navigate to checkout', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);

      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
      await catalogPage.addBookToCart(1);

      await cartPage.openCart();
      await cartPage.proceedToCheckout();
    });

    await test.step('Verify initial Step 1 state', async () => {
      isStep1Active = await commonFunctions.compareTwoValues(await checkoutPage.isStepIndicatorActive(1), true, "Verifying Step 1 indicator is active");
      isStep1Visible = await commonFunctions.compareTwoValues(await checkoutPage.isShippingStepVisible(), true, "Verifying Shipping step content is visible");
    });

    await test.step('Complete Step 1 shipping details and click Next Step', async () => {
      await checkoutPage.enterFirstName(TestData.SHIPPING.firstName);
      await checkoutPage.enterLastName(TestData.SHIPPING.lastName);
      await checkoutPage.enterShippingAddress(TestData.SHIPPING.address);
      await checkoutPage.enterCity(TestData.SHIPPING.city);
      await checkoutPage.clickNextStepWithoutValidationWait();
    });

    await test.step('Verify transition to Step 2', async () => {
      isStep2Active = await commonFunctions.compareTwoValues(await checkoutPage.isStepIndicatorActive(2), true, "Verifying Step 2 indicator is active");
      isShippingHidden = await commonFunctions.compareTwoValues(await checkoutPage.isShippingStepVisible(), false, "Verifying Shipping step content is hidden");
      isPaymentVisible = await commonFunctions.compareTwoValues(await checkoutPage.isPaymentStepVisible(), true, "Verifying Payment step content is visible");
    });

    expect(isStep1Active && isStep1Visible && isStep2Active && isShippingHidden && isPaymentVisible).toBeTruthy();
  });

  test('UI_WIZ_02: Validation Messaging Validation @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isFnErrValid = false;
    let isLnErrValid = false;
    let isAddrErrValid = false;
    let isCityErrValid = false;
    let isCcErrValid = false;
    let isExpErrValid = false;
    let isCvvErrValid = false;

    await test.step('Register user, add book to cart, and navigate to checkout', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);

      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
      await catalogPage.addBookToCart(1);

      await cartPage.openCart();
      await cartPage.proceedToCheckout();
    });

    await test.step('Submit blank fields on Step 1 and verify inline error messages', async () => {
      await checkoutPage.clickNextStepWithoutValidationWait();
      const errorsStep1 = await checkoutPage.getFieldErrors();

      isFnErrValid = await commonFunctions.compareTwoValues(errorsStep1.includes(TestData.ERRORS.firstName), true, "Verifying First Name required error on Step 1");
      isLnErrValid = await commonFunctions.compareTwoValues(errorsStep1.includes(TestData.ERRORS.lastName), true, "Verifying Last Name required error on Step 1");
      isAddrErrValid = await commonFunctions.compareTwoValues(errorsStep1.includes(TestData.ERRORS.address), true, "Verifying Address required error on Step 1");
      isCityErrValid = await commonFunctions.compareTwoValues(errorsStep1.includes(TestData.ERRORS.city), true, "Verifying City required error on Step 1");
    });

    await test.step('Fill valid shipping details and advance to Step 2', async () => {
      await checkoutPage.enterFirstName(TestData.SHIPPING.firstName);
      await checkoutPage.enterLastName(TestData.SHIPPING.lastName);
      await checkoutPage.enterShippingAddress(TestData.SHIPPING.address);
      await checkoutPage.enterCity(TestData.SHIPPING.city);
      await checkoutPage.clickNextStepWithoutValidationWait();
    });

    await test.step('Submit invalid inputs on Step 2 and verify payment inline error messages', async () => {
      await checkoutPage.enterCardNumber(TestData.INVALID_PAYMENT.creditCard);
      await checkoutPage.enterExpiry(TestData.INVALID_PAYMENT.expiry);
      await checkoutPage.enterCvv(TestData.INVALID_PAYMENT.cvv);
      await checkoutPage.clickNextStepWithoutValidationWait();

      const errorsStep2 = await checkoutPage.getFieldErrors();
      isCcErrValid = await commonFunctions.compareTwoValues(errorsStep2.includes(TestData.ERRORS.creditCard), true, "Verifying Credit Card 16-digit error on Step 2");
      isExpErrValid = await commonFunctions.compareTwoValues(errorsStep2.includes(TestData.ERRORS.expiry), true, "Verifying Expiry MM/YY format error on Step 2");
      isCvvErrValid = await commonFunctions.compareTwoValues(errorsStep2.includes(TestData.ERRORS.cvv), true, "Verifying CVV 3-digit error on Step 2");
    });

    expect(isFnErrValid && isLnErrValid && isAddrErrValid && isCityErrValid && isCcErrValid && isExpErrValid && isCvvErrValid).toBeTruthy();
  });

  test('UI_WIZ_03: Wizard Back Step History preservation @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isReturnedToStep1 = false;
    let isBackToStep2 = false;
    let isCcPreserved = false;
    let isExpPreserved = false;
    let isCvvPreserved = false;

    await test.step('Register user, add book to cart, and navigate to checkout', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);

      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
      await catalogPage.addBookToCart(1);

      await cartPage.openCart();
      await cartPage.proceedToCheckout();
    });

    await test.step('Fill Step 1 shipping details and advance to Step 2', async () => {
      await checkoutPage.enterFirstName(TestData.SHIPPING.firstName);
      await checkoutPage.enterLastName(TestData.SHIPPING.lastName);
      await checkoutPage.enterShippingAddress(TestData.SHIPPING.address);
      await checkoutPage.enterCity(TestData.SHIPPING.city);
      await checkoutPage.clickNextStepWithoutValidationWait();
    });

    await test.step('Fill Step 2 card inputs and click Back', async () => {
      await checkoutPage.enterCardNumber(TestData.VALID_PAYMENT.creditCard);
      await checkoutPage.enterExpiry(TestData.VALID_PAYMENT.expiry);
      await checkoutPage.enterCvv(TestData.VALID_PAYMENT.cvv);
      await checkoutPage.clickBackStep();

      isReturnedToStep1 = await commonFunctions.compareTwoValues(await checkoutPage.isShippingStepVisible(), true, "Verifying returning to Step 1 after clicking Back");
    });

    await test.step('Click Next Step to return to Step 2 and verify preserved inputs', async () => {
      await checkoutPage.clickNextStepWithoutValidationWait();
      isBackToStep2 = await commonFunctions.compareTwoValues(await checkoutPage.isPaymentStepVisible(), true, "Verifying returning to Step 2 after clicking Next");

      const cardVal = await checkoutPage.getCardNumberInputValue();
      const expVal = await checkoutPage.getExpiryInputValue();
      const cvvVal = await checkoutPage.getCvvInputValue();

      isCcPreserved = await commonFunctions.compareTwoValues(cardVal, TestData.VALID_PAYMENT.creditCard, "Verifying preserved credit card number");
      isExpPreserved = await commonFunctions.compareTwoValues(expVal, TestData.VALID_PAYMENT.expiry, "Verifying preserved expiry date");
      isCvvPreserved = await commonFunctions.compareTwoValues(cvvVal, TestData.VALID_PAYMENT.cvv, "Verifying preserved CVV");
    });

    expect(isReturnedToStep1 && isBackToStep2 && isCcPreserved && isExpPreserved && isCvvPreserved).toBeTruthy();
  });

  test('UI_WIZ_04: Dirty Navigation Alert Dialog @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isMsgDismissValid = false;
    let isStayedOnCheckout = false;
    let isValuePreserved = false;
    let isMsgAcceptValid = false;
    let isNavigatedToCatalog = false;

    await test.step('Register user, add book to cart, and navigate to checkout', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);

      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.getBooksCount();
      await catalogPage.addBookToCart(1);

      await cartPage.openCart();
      await cartPage.proceedToCheckout();
    });

    await test.step('Type input on Step 1, click navbar link, and DISMISS confirm dialog', async () => {
      await checkoutPage.enterFirstName(TestData.SHIPPING.firstName);

      let capturedDialogMsg = '';
      page.once('dialog', async dialog => {
        capturedDialogMsg = dialog.message();
        await dialog.dismiss();
      });

      await catalogPage.clickNavigateLink("Catalog");
      await page.waitForTimeout(500);

      isMsgDismissValid = await commonFunctions.compareTwoValues(capturedDialogMsg, TestData.DIRTY_DIALOG_MSG, "Verifying dirty navigation confirm dialog message on dismiss");
      isStayedOnCheckout = await commonFunctions.compareTwoValues(page.url().includes('/checkout'), true, "Verifying navigation blocked when dialog is dismissed");
      const currentFirstName = await checkoutPage.getFirstNameInputValue();
      isValuePreserved = await commonFunctions.compareTwoValues(currentFirstName, TestData.SHIPPING.firstName, "Verifying input value preserved after dialog dismiss");
    });

    await test.step('Click navbar link again and ACCEPT confirm dialog to navigate', async () => {
      let capturedDialogMsg = '';
      page.once('dialog', async dialog => {
        capturedDialogMsg = dialog.message();
        await dialog.accept();
      });

      await catalogPage.clickNavigateLink("Catalog");
      await page.waitForTimeout(1000);

      isMsgAcceptValid = await commonFunctions.compareTwoValues(capturedDialogMsg, TestData.DIRTY_DIALOG_MSG, "Verifying dirty navigation confirm dialog message on accept");
      isNavigatedToCatalog = await commonFunctions.compareTwoValues(!page.url().includes('/checkout'), true, "Verifying navigated away from checkout when dialog accepted");
    });

    expect(isMsgDismissValid && isStayedOnCheckout && isValuePreserved && isMsgAcceptValid && isNavigatedToCatalog).toBeTruthy();
  });

});

import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Checkout/Test_004_CheckoutWizardValidation.json';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Multi-Step Checkout Wizard', () => {

  test('UI_WIZ_01: Stepper Transition Validation @smoke @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

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
      await commonFunctions.verifyValue(await checkoutPage.isStepIndicatorActive(1), true, "Verifying Step 1 indicator is active");
      await commonFunctions.verifyValue(await checkoutPage.isShippingStepVisible(), true, "Verifying Shipping step content is visible");
    });

    await test.step('Complete Step 1 shipping details and click Next Step', async () => {
      await checkoutPage.enterFirstName(TestData.SHIPPING.firstName);
      await checkoutPage.enterLastName(TestData.SHIPPING.lastName);
      await checkoutPage.enterShippingAddress(TestData.SHIPPING.address);
      await checkoutPage.enterCity(TestData.SHIPPING.city);
      await checkoutPage.clickNextStepWithoutValidationWait();
    });

    await test.step('Verify transition to Step 2', async () => {
      await commonFunctions.verifyValue(await checkoutPage.isStepIndicatorActive(2), true, "Verifying Step 2 indicator is active");
      await commonFunctions.verifyValue(await checkoutPage.isShippingStepVisible(), false, "Verifying Shipping step content is hidden");
      await commonFunctions.verifyValue(await checkoutPage.isPaymentStepVisible(), true, "Verifying Payment step content is visible");
    });
  });

  test('UI_WIZ_02: Validation Messaging Validation @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

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

      await commonFunctions.verifyCondition(errorsStep1.includes(TestData.ERRORS.firstName), "Verifying First Name required error on Step 1");
      await commonFunctions.verifyCondition(errorsStep1.includes(TestData.ERRORS.lastName), "Verifying Last Name required error on Step 1");
      await commonFunctions.verifyCondition(errorsStep1.includes(TestData.ERRORS.address), "Verifying Address required error on Step 1");
      await commonFunctions.verifyCondition(errorsStep1.includes(TestData.ERRORS.city), "Verifying City required error on Step 1");
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
      await commonFunctions.verifyCondition(errorsStep2.includes(TestData.ERRORS.creditCard), "Verifying Credit Card 16-digit error on Step 2");
      await commonFunctions.verifyCondition(errorsStep2.includes(TestData.ERRORS.expiry), "Verifying Expiry MM/YY format error on Step 2");
      await commonFunctions.verifyCondition(errorsStep2.includes(TestData.ERRORS.cvv), "Verifying CVV 3-digit error on Step 2");
    });
  });

  test('UI_WIZ_03: Wizard Back Step History preservation @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

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

      await commonFunctions.verifyValue(await checkoutPage.isShippingStepVisible(), true, "Verifying returning to Step 1 after clicking Back");
    });

    await test.step('Click Next Step to return to Step 2 and verify preserved inputs', async () => {
      await checkoutPage.clickNextStepWithoutValidationWait();
      await commonFunctions.verifyValue(await checkoutPage.isPaymentStepVisible(), true, "Verifying returning to Step 2 after clicking Next");

      const cardVal = await checkoutPage.getCardNumberInputValue();
      const expVal = await checkoutPage.getExpiryInputValue();
      const cvvVal = await checkoutPage.getCvvInputValue();

      await commonFunctions.verifyValue(cardVal, TestData.VALID_PAYMENT.creditCard, "Verifying preserved credit card number");
      await commonFunctions.verifyValue(expVal, TestData.VALID_PAYMENT.expiry, "Verifying preserved expiry date");
      await commonFunctions.verifyValue(cvvVal, TestData.VALID_PAYMENT.cvv, "Verifying preserved CVV");
    });
  });

  test('UI_WIZ_04: Dirty Navigation Alert Dialog @regression', async ({ signUpPage, catalogPage, cartPage, checkoutPage, commonFunctions, page }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

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
      const dialogPromise = new Promise<void>(resolve => {
        page.once('dialog', async dialog => {
          capturedDialogMsg = dialog.message();
          await dialog.dismiss();
          resolve();
        });
      });

      await catalogPage.clickNavigateLink("Catalog");
      await dialogPromise;

      await commonFunctions.verifyValue(capturedDialogMsg, TestData.DIRTY_DIALOG_MSG, "Verifying dirty navigation confirm dialog message on dismiss");
      await commonFunctions.verifyCondition(page.url().includes('/checkout'), "Verifying navigation blocked when dialog is dismissed");
      const currentFirstName = await checkoutPage.getFirstNameInputValue();
      await commonFunctions.verifyValue(currentFirstName, TestData.SHIPPING.firstName, "Verifying input value preserved after dialog dismiss");
    });

    await test.step('Click navbar link again and ACCEPT confirm dialog to navigate', async () => {
      let capturedDialogMsg = '';
      const dialogPromise = new Promise<void>(resolve => {
        page.once('dialog', async dialog => {
          capturedDialogMsg = dialog.message();
          await dialog.accept();
          resolve();
        });
      });

      await catalogPage.clickNavigateLink("Catalog");
      await dialogPromise;
      await page.waitForURL(url => !url.toString().includes('/checkout'), { timeout: 5000 });

      await commonFunctions.verifyValue(capturedDialogMsg, TestData.DIRTY_DIALOG_MSG, "Verifying dirty navigation confirm dialog message on accept");
      await commonFunctions.verifyCondition(!page.url().includes('/checkout'), "Verifying navigated away from checkout when dialog accepted");
    });
  });

});

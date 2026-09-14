import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/UserManagement/Test_001_RegisterUser.json';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Register New User', () => {
  let username: string, fullName: string;
  test('Testcase 1: Register New User @smoke @regression', async ({ signUpPage, commonFunctions, page }) => {
    username = TestData.USER_NAME + commonFunctions.generateRandomString(5);
    fullName = TestData.FULL_NAME + commonFunctions.generateRandomString(5);
    await page.goto(envConfig.baseUrl);

    await test.step('Navigate to SignUp Page', async () => {
      await signUpPage.clickSignUp();
    });

    await test.step('Perform SignUp', async () => {
      const isRegistered = await signUpPage.registerNewUser(fullName, username, TestData.PASSWORD, TestData.PASSWORD);
      await commonFunctions.verifyValue(isRegistered, true, "Verifying if user registered successfully");
    });
  });

  test('Testcase 2: Login With Registered User and Logout @smoke @regression', async ({ signUpPage, catalogPage, commonFunctions, page }) => {
    await page.goto(envConfig.baseUrl);

    const loginUsername = TestData.USER_NAME + commonFunctions.generateRandomString(5);
    const loginFullName = TestData.FULL_NAME + commonFunctions.generateRandomString(5);
    await test.step('Register User for Login Test', async () => {
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(loginFullName, loginUsername, TestData.PASSWORD, TestData.PASSWORD);
      await catalogPage.clickLogout();
    });

    await test.step('Perform Login', async () => {
      await catalogPage.clickNavigateLink("Login");
      const isLogin = await signUpPage.login(loginUsername, TestData.PASSWORD);
      await commonFunctions.verifyValue(isLogin, true, "Verifying if user logged in successfully");
    });

    await test.step('Logout', async () => {
      await catalogPage.clickLogout();
      await commonFunctions.verifyValue(await catalogPage.isLoginVisible(), true, "Verifying if user logged out successfully");
    });
  });

  test('Testcase 3: Password Strength Indicator @regression', async ({ signUpPage, commonFunctions, page }) => {
    await page.goto(envConfig.baseUrl);

    await test.step('Navigate to SignUp Page', async () => {
      await signUpPage.clickSignUp();
    });

    await test.step('Type simple password and verify weak label', async () => {
      await signUpPage.enterPassword('123');
      const strengthText = await signUpPage.getPwdStrengthText();
      await commonFunctions.verifyValue(strengthText, 'Weak', 'Verifying if password strength is Weak');
    });

    await test.step('Type complex password and verify strong label', async () => {
      await signUpPage.enterPassword('ComplexPass123!');
      const strengthText = await signUpPage.getPwdStrengthText();
      await commonFunctions.verifyValue(strengthText, 'Strong', 'Verifying if password strength is Strong');
    });
  });

});

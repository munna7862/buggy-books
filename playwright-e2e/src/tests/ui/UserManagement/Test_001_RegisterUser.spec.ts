import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/UserManagement/Test_001_RegisterUser.json';

test.describe('Register New User', () => {
  let username: string, fullName: string;
  test('Testcase 1: Register New User', async ({ signUpPage, commonFunctions, page, networkInterceptor }) => {
    // networkInterceptor fixture automatically captures network logs (no direct usage needed)
    username = TestData.USER_NAME + commonFunctions.generateRandomString(5);
    fullName = TestData.FULL_NAME + commonFunctions.generateRandomString(5);
    await page.goto(envConfig.baseUrl);

    await test.step('Navigate to SignUp Page', async () => {
      await signUpPage.clickSignUp();
    });

    await test.step('Perform SignUp', async () => {
      const isRegistered = await signUpPage.registerNewUser(fullName, username, TestData.PASSWORD, TestData.PASSWORD);
      let isNavigated = await commonFunctions.compareTwoValues(isRegistered, true, "Verifying if user registered successfully");
      expect(isNavigated).toBeTruthy();
    });
    await page.waitForTimeout(2000); // Wait for a few seconds to ensure all network requests are captured
  });

  test('Testcase 2: Login With Registered User and Logout', async ({ signUpPage, catalogPage, commonFunctions, page, networkInterceptor }) => {
    // networkInterceptor fixture automatically captures network logs (no direct usage needed)
    await page.goto(envConfig.baseUrl);

    if (!username) {
      username = TestData.USER_NAME + commonFunctions.generateRandomString(5);
      fullName = TestData.FULL_NAME + commonFunctions.generateRandomString(5);
      await test.step('Register User for Login Test', async () => {
        await signUpPage.clickSignUp();
        await signUpPage.registerNewUser(fullName, username, TestData.PASSWORD, TestData.PASSWORD);
        await page.waitForTimeout(1000);
        await catalogPage.clickLogout();
      });
    }

    await test.step('Perform Login', async () => {
      await catalogPage.clickNavigateLink("Login");
      const isLogin = await signUpPage.login(username, TestData.PASSWORD);
      let isNavigated = await commonFunctions.compareTwoValues(isLogin, true, "Verifying if user logged in successfully");
      expect(isNavigated).toBeTruthy();
    });

    await test.step('Logout', async () => {
      await catalogPage.clickLogout();
      const isLogout = await commonFunctions.compareTwoValues(await catalogPage.isLoginVisible(), true, "Verifying if user logged out successfully");
      expect(isLogout).toBeTruthy();
    });
    await page.waitForTimeout(2000); // Wait for a few seconds to ensure all network requests are captured
  });

  test('Testcase 3: Password Strength Indicator', async ({ signUpPage, commonFunctions, page, networkInterceptor }) => {
    // networkInterceptor fixture automatically captures network logs (no direct usage needed)
    await page.goto(envConfig.baseUrl);

    await test.step('Navigate to SignUp Page', async () => {
      await signUpPage.clickSignUp();
    });

    await test.step('Type simple password and verify weak label', async () => {
      await signUpPage.enterPassword('123');
      const strengthText = await signUpPage.getPwdStrengthText();
      let isWeak = await commonFunctions.compareTwoValues(strengthText, 'Weak', 'Verifying if password strength is Weak');
      expect(isWeak).toBeTruthy();
    });

    await test.step('Type complex password and verify strong label', async () => {
      await signUpPage.enterPassword('ComplexPass123!');
      const strengthText = await signUpPage.getPwdStrengthText();
      let isStrong = await commonFunctions.compareTwoValues(strengthText, 'Strong', 'Verifying if password strength is Strong');
      expect(isStrong).toBeTruthy();
    });
    await page.waitForTimeout(2000); // Wait for a few seconds to ensure all network requests are captured
  });

});



import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig, getLoginCredentials } from '../../../config/env.config';
import { CatalogPage } from '../../../pages/catalog.page';
import { AuthUtility } from '../../../utils/auth.util';

test.describe('Login With Existing User', () => {

  test('Testcase 1: Login With Existing User', async ({ signUpPage, catalogPage, commonFunctions, page, context, networkInterceptor }) => {
    // networkInterceptor fixture automatically captures network logs (no direct usage needed)
    await page.goto(envConfig.baseUrl);

    await test.step('Perform Login', async () => {
      await catalogPage.clickNavigateLink("Login");
      const { userName, password } = getLoginCredentials();
      const isLogin = await signUpPage.login(userName, password);
      let isNavigated = await commonFunctions.compareTwoValues(isLogin, true, "Verifying if user logged in successfully");
      expect(isNavigated).toBeTruthy();
    });

    // Save authentication state for reuse in next test (BEFORE logout)
    await test.step('Save Authentication State', async () => {
      await AuthUtility.saveAuthState(context);
    });

    await test.step('Logout', async () => {
      await catalogPage.clickLogout();
      const isLogout = await commonFunctions.compareTwoValues(await catalogPage.isLoginVisible(), true, "Verifying if user logged out successfully");
      expect(isLogout).toBeTruthy();
    });
    await page.waitForTimeout(2000); // Wait for a few seconds to ensure all network requests are captured
  });

  test('Testcase 2: Login Using Saved Session Storage', async ({ browser, signUpPage, catalogPage, commonFunctions, networkInterceptor }) => {
    // Create a new context with the saved storage state
    const { context, page } = await AuthUtility.createContextWithSavedAuth(browser);
    
    try {
      await page.goto(envConfig.baseUrl);

      await test.step('Verify Logged In Without Re-entering Credentials', async () => {
        await page.waitForLoadState('networkidle');
        // Verify that the logout button is visible (user is logged in)
        await page.locator("//button[text()='Logout']").waitFor({ state: 'visible', timeout: 5000 });
        const isLoggedIn = await page.locator("//button[text()='Logout']").isVisible();
        let isVerified = await commonFunctions.compareTwoValues(isLoggedIn, true, "Verifying if user is logged in using saved session");
        expect(isVerified).toBeTruthy();
      });

      const catalogPageWithNewContext = new CatalogPage(page);
      await test.step('Perform Logout', async () => {
        await catalogPageWithNewContext.clickLogout();
        const isLogout = await commonFunctions.compareTwoValues(await catalogPageWithNewContext.isLoginVisible(), true, "Verifying if user logged out successfully");
        expect(isLogout).toBeTruthy();
      });
      await page.waitForTimeout(2000); // Wait for a few seconds to ensure all network requests are captured
    } finally {
      // Cleanup
      await context?.close();
    }
  });

});


import { test } from '../../../core/base/base.fixture';
import { envConfig, getLoginCredentials } from '../../../config/env.config';
import { CatalogPage } from '../../../pages/catalog.page';
import { AuthUtility } from '../../../utils/auth.util';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe.serial('Login With Existing User', () => {

  test('Testcase 1: Login With Existing User @smoke @regression', async ({ signUpPage, catalogPage, commonFunctions, page, context }) => {
    await page.goto(envConfig.baseUrl);

    await test.step('Perform Login', async () => {
      await catalogPage.clickNavigateLink("Login");
      const { userName, password } = getLoginCredentials();
      const isLogin = await signUpPage.login(userName, password);
      await commonFunctions.verifyValue(isLogin, true, "Verifying if user logged in successfully");
    });

    // Save authentication state for reuse in next test (BEFORE logout)
    await test.step('Save Authentication State', async () => {
      await AuthUtility.saveAuthState(context);
    });

    await test.step('Logout', async () => {
      await catalogPage.clickLogout();
      await commonFunctions.verifyValue(await catalogPage.isLoginVisible(), true, "Verifying if user logged out successfully");
    });
  });

  test('Testcase 2: Login Using Saved Session Storage @smoke @regression', async ({ browser, commonFunctions }) => {
    // Create a new context with the saved storage state
    const { context, page } = await AuthUtility.createContextWithSavedAuth(browser);
    
    try {
      await page.goto(envConfig.baseUrl);

      const catalogPageWithNewContext = new CatalogPage(page);
      await test.step('Verify Logged In Without Re-entering Credentials', async () => {
        await page.waitForLoadState('domcontentloaded');
        const isLoggedIn = await catalogPageWithNewContext.isLogoutVisible();
        await commonFunctions.verifyValue(isLoggedIn, true, "Verifying if user is logged in using saved session");
      });
      await test.step('Perform Logout', async () => {
        await catalogPageWithNewContext.clickLogout();
        await commonFunctions.verifyValue(await catalogPageWithNewContext.isLoginVisible(), true, "Verifying if user logged out successfully");
      });
    } finally {
      // Cleanup
      await context?.close();
    }
  });

  test('Testcase 3: Login Validation Errors @regression', async ({ signUpPage, catalogPage, commonFunctions, page }) => {
    await page.goto(envConfig.baseUrl);

    await test.step('Attempt Login with Wrong Password', async () => {
      await catalogPage.clickNavigateLink("Login");
      const { userName } = getLoginCredentials();
      await signUpPage.loginWithInvalidCredentials(userName, "wrongPassword123@");
    });

    await test.step('Verify Error Message', async () => {
      const errorText = await signUpPage.getErrorBannerText();
      await commonFunctions.verifyValue(errorText, "Unauthorized: Invalid credentials", "Verifying if error message is correct");
    });
  });

});

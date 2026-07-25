import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Refresh/Test_006_JwtRefreshValidation.json';

test.describe('JWT Expiration & Silent Refresh UI Suite', () => {

  test('UI_REF_01: Transparent Client Request Retry', async ({ signUpPage, profilePage, commonFunctions, page, request }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isProfileOpened = false;
    let isUserStillLoggedIn = false;

    try {
      await test.step('Register user and navigate to home page', async () => {
        await page.goto(envConfig.baseUrl);
        await signUpPage.clickSignUp();
        await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
      });

      await test.step('Inject jwtExpirySeconds: 2 via chaos API config', async () => {
        const configRes = await request.post(`${envConfig.apiBaseUrl}/api/test/config`, {
          data: { jwtExpirySeconds: 2 }
        });
        expect(configRes.status()).toBe(200);
      });

      await test.step('Wait 3 seconds for access token to expire', async () => {
        await new Promise(r => setTimeout(r, 3000));
      });

      await test.step('Trigger protected UI action (open profile page)', async () => {
        await profilePage.openProfile();
      });

      await test.step('Verify action completed successfully via silent token refresh', async () => {
        const avatarSrc = await profilePage.getAvatarPreviewSrc();
        isProfileOpened = await commonFunctions.compareTwoValues(Boolean(avatarSrc), true, "Verifying profile page opened successfully post silent token refresh");

        const pageUrl = page.url();
        isUserStillLoggedIn = await commonFunctions.compareTwoValues(pageUrl.includes('/profile'), true, "Verifying user is retained on profile page without logout");
      });
    } finally {
      await test.step('Reset jwtExpirySeconds to 900', async () => {
        await request.post(`${envConfig.apiBaseUrl}/api/test/config`, {
          data: { jwtExpirySeconds: 900 }
        });
      });
    }

    expect(isProfileOpened && isUserStillLoggedIn).toBeTruthy();
  });

  test('UI_REF_02: Session Expiry Redirection', async ({ signUpPage, profilePage, commonFunctions, page, context }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isRedirectedToLogin = false;

    await test.step('Register user and navigate to home page', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
    });

    await test.step('Clear all authentication cookies from browser context', async () => {
      await context.clearCookies();
    });

    await test.step('Attempt protected UI action (open profile page via navbar)', async () => {
      await profilePage.openProfile();
    });

    await test.step('Verify user is redirected to /login page', async () => {
      await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10000 });
      const currentUrl = page.url();
      isRedirectedToLogin = await commonFunctions.compareTwoValues(currentUrl.includes('/login'), true, "Verifying unauthenticated access redirects user to /login page");
    });

    expect(isRedirectedToLogin).toBeTruthy();
  });

});

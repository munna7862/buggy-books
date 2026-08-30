import { expect } from '@playwright/test';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import { ProfilePage } from '../../../pages/profile.page';

type ProfileSummaryTestData = {
  user: {
    fullName: string;
    password: string;
  };
};

const testDataPath = path.join(__dirname, '../../../test-data/ui/Profile/Test_006_ProfileSummaryAndOrderHistory.json');
const TestData = require(testDataPath) as ProfileSummaryTestData;

function uniqueUsername(prefix: string = 'profile_user'): string {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

test.describe('Profile Summary and Order History', () => {

  test('UI_PROF_01: Verify user account profile summary and avatar preview render correctly @smoke @regression', async ({ signUpPage, catalogPage, commonFunctions, page, networkInterceptor }) => {
    const profilePage = new ProfilePage(page);
    const username = uniqueUsername();

    let isProfileSummaryValid = false;

    await test.step('Register new account and navigate to Profile', async () => {
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.clickNavigateLink('Sign Up');
      await signUpPage.registerNewUser(TestData.user.fullName, username, TestData.user.password, TestData.user.password);
      await profilePage.openProfile();
    });

    await test.step('Verify profile summary contains account full name, username, and avatar preview', async () => {
      const profileInfoText = await profilePage.getProfileInfoText();
      const avatarSrc = await profilePage.getAvatarPreviewSrc();

      const nameMatch = profileInfoText.includes(TestData.user.fullName);
      const usernameMatch = profileInfoText.includes(username);
      const avatarValid = avatarSrc.length > 0;

      const isVerified = nameMatch && usernameMatch && avatarValid;

      isProfileSummaryValid = await commonFunctions.compareTwoValues(
        isVerified,
        true,
        'Verifying profile page renders registered full name, username, and avatar preview'
      );
    });

    expect(isProfileSummaryValid).toBeTruthy();
  });

});

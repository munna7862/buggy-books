import { expect } from '@playwright/test';
import * as path from 'path';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Profile/Test_005_ProfilePictureUpload.json';

const validPngPath = path.join(__dirname, '../../../test-data/ui/Profile/valid_avatar.png');
const invalidFilePath = path.join(__dirname, '../../../test-data/ui/Profile/invalid_file.txt');
const largeImagePath = path.join(__dirname, '../../../test-data/ui/Profile/large_image.png');

test.describe('Profile Picture Upload', () => {

  test('UI_UPL_01: Valid Profile Picture Upload', async ({ signUpPage, profilePage, commonFunctions, page, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isSrcUpdated = false;
    let isSuccessMsgValid = false;

    await test.step('Register user and navigate to profile page', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
      await profilePage.openProfile();
    });

    await test.step('Upload valid PNG image under 2MB', async () => {
      await profilePage.uploadAvatar(validPngPath);
    });

    await test.step('Verify preview src updated and success message rendered', async () => {
      const src = await profilePage.getAvatarPreviewSrc();
      isSrcUpdated = await commonFunctions.compareTwoValues(src.includes('/uploads/'), true, "Verifying avatar preview image src points to uploads path");

      const successMsg = await profilePage.getSuccessMessageText();
      isSuccessMsgValid = await commonFunctions.compareTwoValues(successMsg, TestData.SUCCESS_MSG, "Verifying avatar upload success status message");
    });

    expect(isSrcUpdated && isSuccessMsgValid).toBeTruthy();
  });

  test('UI_UPL_02: File Extension Filter Validation', async ({ signUpPage, profilePage, commonFunctions, page, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isErrorMsgValid = false;

    await test.step('Register user and navigate to profile page', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
      await profilePage.openProfile();
    });

    await test.step('Upload invalid extension file (document.txt)', async () => {
      await profilePage.uploadAvatar(invalidFilePath);
    });

    await test.step('Verify 400 error message rendered for invalid extension', async () => {
      const errorMsg = await profilePage.getErrorMessageText();
      isErrorMsgValid = await commonFunctions.compareTwoValues(errorMsg.includes(TestData.INVALID_EXT_ERR), true, "Verifying file extension filter 400 error message");
    });

    expect(isErrorMsgValid).toBeTruthy();
  });

  test('UI_UPL_03: File Size Limit Validation', async ({ signUpPage, profilePage, commonFunctions, page, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isSizeErrorMsgValid = false;

    await test.step('Register user and navigate to profile page', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
      await profilePage.openProfile();
    });

    await test.step('Upload image file exceeding 2MB limit (2.5MB)', async () => {
      await profilePage.uploadAvatar(largeImagePath);
    });

    await test.step('Verify 400 error message rendered for file size limit', async () => {
      const errorMsg = await profilePage.getErrorMessageText();
      isSizeErrorMsgValid = await commonFunctions.compareTwoValues(errorMsg.includes(TestData.LARGE_SIZE_ERR), true, "Verifying file size limit 400 error message");
    });

    expect(isSizeErrorMsgValid).toBeTruthy();
  });

  test('UI_UPL_04: Upload Chaos Failure Recovery', async ({ signUpPage, profilePage, commonFunctions, page, request, networkInterceptor }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isChaosErrorValid = false;

    try {
      await test.step('Configure uploadFailureRate: 1.0 via API request', async () => {
        const configRes = await request.post(`${envConfig.apiBaseUrl}/api/test/config`, {
          data: { uploadFailureRate: 1.0 }
        });
        expect(configRes.status()).toBe(200);
      });

      await test.step('Register user and navigate to profile page', async () => {
        await page.goto(envConfig.baseUrl);
        await signUpPage.clickSignUp();
        await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
        await profilePage.openProfile();
      });

      await test.step('Upload valid image file during active chaos', async () => {
        await profilePage.uploadAvatar(validPngPath);
      });

      await test.step('Verify 500 status code and error banner display', async () => {
        const errorMsg = await profilePage.getErrorMessageText();
        isChaosErrorValid = await commonFunctions.compareTwoValues(errorMsg.includes(TestData.CHAOS_FAILURE_ERR), true, "Verifying upload chaos 500 error message");
      });
    } finally {
      await test.step('Reset chaos configuration to normal', async () => {
        await request.post(`${envConfig.apiBaseUrl}/api/test/config`, {
          data: { uploadFailureRate: 0 }
        });
      });
    }

    expect(isChaosErrorValid).toBeTruthy();
  });

});

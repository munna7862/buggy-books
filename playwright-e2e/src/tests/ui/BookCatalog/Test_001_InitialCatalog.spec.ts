import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/BookCatalog/Test_001_InitialCatalog.json';

test.describe('Initial Catalog', () => {

  test('Testcase: Verify Books Count in pagination', async ({ catalogPage, commonFunctions, page, networkInterceptor }) => {
    // networkInterceptor fixture automatically captures network logs (no direct usage needed)
    await page.goto(envConfig.baseUrl);
    await test.step('Verify Books Count in Catalog Page', async () => {
      let isBooksCountCorrect = await commonFunctions.compareTwoValues(await catalogPage.getBooksCount(), TestData.FIRST_PAGE_BOOKS_COUNT, "Verifying if Books count in Catalog page is correct");
      expect(isBooksCountCorrect).toBeTruthy();
    });

    await test.step('Verify Next Page Navigation', async () => {
      await catalogPage.clickPaginationButton(2);
      let isBooksCountCorrect = await commonFunctions.compareTwoValues(await catalogPage.getBooksCount(), TestData.SECOND_PAGE_BOOKS_COUNT, "Verifying if Books count in Catalog page is correct");
      expect(isBooksCountCorrect).toBeTruthy();
    });

    await test.step('Verify Previous Page Navigation', async () => {
      await catalogPage.clickPaginationButton(1);
      let isBooksCountCorrect = await commonFunctions.compareTwoValues(await catalogPage.getBooksCount(), TestData.FIRST_PAGE_BOOKS_COUNT, "Verifying if Books count in Catalog page is correct");
      expect(isBooksCountCorrect).toBeTruthy();
    });

    await page.waitForTimeout(2000); // Wait for a few seconds to ensure all network requests are captured
  });

});


import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/BookCatalog/Test_001_InitialCatalog.json';

test.describe('Initial Catalog', () => {

  test('Verify Books Count in pagination @smoke @regression', async ({ catalogPage, commonFunctions, page }) => {
    await page.goto(envConfig.baseUrl);
    await test.step('Verify Books Count in Catalog Page', async () => {
      await commonFunctions.verifyValue(await catalogPage.getBooksCount(), TestData.FIRST_PAGE_BOOKS_COUNT, "Verifying if Books count in Catalog page is correct");
    });

    await test.step('Verify Next Page Navigation', async () => {
      await catalogPage.clickPaginationButton(2);
      await commonFunctions.verifyValue(await catalogPage.getBooksCount(), TestData.SECOND_PAGE_BOOKS_COUNT, "Verifying if Books count in Catalog page is correct");
    });

    await test.step('Verify Previous Page Navigation', async () => {
      await catalogPage.clickPaginationButton(1);
      await commonFunctions.verifyValue(await catalogPage.getBooksCount(), TestData.FIRST_PAGE_BOOKS_COUNT, "Verifying if Books count in Catalog page is correct");
    });
  });

});

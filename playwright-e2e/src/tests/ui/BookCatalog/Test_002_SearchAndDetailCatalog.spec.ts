import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/BookCatalog/Test_002_SearchAndDetailCatalog.json';

test.describe('Book Catalog Search and Detail View', () => {

  test('UI_CAT_03: Search Filtering @regression', async ({ catalogPage, commonFunctions }) => {
    await catalogPage.navigateToCatalog(envConfig.baseUrl);
    await catalogPage.getBooksCount();

    await test.step('Perform search query for matching book', async () => {
      await catalogPage.searchBooks(TestData.SEARCH_QUERY);
    });

    await test.step('Verify matching book is displayed in catalog', async () => {
      const booksCount = await catalogPage.getDisplayedBooksCount();
      await commonFunctions.verifyValue(booksCount, TestData.EXPECTED_SEARCH_COUNT, "Verifying search results books count");

      const resultCountText = await catalogPage.getResultCountText();
      await commonFunctions.verifyCondition(resultCountText.includes(TestData.SEARCH_QUERY), "Verifying result count text contains search query");

      const firstTitle = await catalogPage.getFirstBookTitle();
      await commonFunctions.verifyValue(firstTitle, TestData.EXPECTED_MATCHING_TITLE, "Verifying search result book title");
    });

    await test.step('Verify clear search resets catalog view', async () => {
      await catalogPage.clearSearch();
      const booksCountAfterClear = await catalogPage.getBooksCount();
      await commonFunctions.verifyValue(booksCountAfterClear, 8, "Verifying catalog count after search clear");
    });
  });

  test('UI_CAT_04: Search - No Results @regression', async ({ catalogPage, commonFunctions }) => {
    await catalogPage.navigateToCatalog(envConfig.baseUrl);
    await catalogPage.getBooksCount();

    await test.step('Perform search query for non-existent book', async () => {
      await catalogPage.searchBooks(TestData.GIBBERISH_QUERY);
    });

    await test.step('Verify zero books and no results message displayed', async () => {
      const booksCount = await catalogPage.getDisplayedBooksCount();
      await commonFunctions.verifyValue(booksCount, 0, "Verifying zero books displayed for gibberish search");

      const emptyMessage = await catalogPage.getEmptyStateText();
      await commonFunctions.verifyCondition(emptyMessage.includes(TestData.EXPECTED_EMPTY_MESSAGE_SUBSTRING), "Verifying empty state message text");
    });
  });

  test('UI_CAT_05: Book Detail View @smoke @regression', async ({ catalogPage, bookDetailPage, commonFunctions, page }) => {
    await catalogPage.navigateToCatalog(envConfig.baseUrl);
    await catalogPage.getBooksCount();

    await test.step('Navigate to book detail page by clicking book title', async () => {
      await catalogPage.clickBookTitle(TestData.TARGET_BOOK_ID);
      const currentUrl = page.url();
      const expectedPattern = new RegExp(`/books/${TestData.TARGET_BOOK_ID}$`);
      await commonFunctions.verifyCondition(expectedPattern.test(currentUrl), "Verifying book detail URL");
    });

    await test.step('Verify book detail fields match expected data', async () => {
      const title = await bookDetailPage.getBookTitle();
      await commonFunctions.verifyValue(title, TestData.TARGET_BOOK_TITLE, "Verifying book detail title");

      const author = await bookDetailPage.getBookAuthor();
      await commonFunctions.verifyValue(author, TestData.TARGET_BOOK_AUTHOR, "Verifying book detail author");

      const price = await bookDetailPage.getBookPrice();
      await commonFunctions.verifyValue(price, TestData.TARGET_BOOK_PRICE, "Verifying book detail price");

      const description = await bookDetailPage.getBookDescription();
      await commonFunctions.verifyValue(description, TestData.TARGET_BOOK_DESCRIPTION, "Verifying book detail description");
    });

    await test.step('Verify back link navigates back to catalog', async () => {
      await bookDetailPage.clickBackToCatalog();
      const currentUrl = page.url();
      const currentPath = new URL(currentUrl).pathname;
      const isAtCatalog = (currentPath === '/' || currentPath === '') && currentUrl.startsWith(envConfig.baseUrl.replace(/\/$/, ''));
      await commonFunctions.verifyCondition(isAtCatalog, "Verifying back to catalog URL");
    });
  });

});

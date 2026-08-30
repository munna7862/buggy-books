import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/BookCatalog/Test_002_SearchAndDetailCatalog.json';

test.describe('Book Catalog Search and Detail View', () => {

  test('UI_CAT_03: Search Filtering @regression', async ({ catalogPage, commonFunctions, page, networkInterceptor }) => {
    await catalogPage.navigateToCatalog(envConfig.baseUrl);
    await catalogPage.getBooksCount();

    let isCountValid = false;
    let isResultCountValid = false;
    let isTitleValid = false;
    let isResetValid = false;

    await test.step('Perform search query for matching book', async () => {
      await catalogPage.searchBooks(TestData.SEARCH_QUERY);
    });

    await test.step('Verify matching book is displayed in catalog', async () => {
      const booksCount = await catalogPage.getDisplayedBooksCount();
      isCountValid = await commonFunctions.compareTwoValues(booksCount, TestData.EXPECTED_SEARCH_COUNT, "Verifying search results books count");

      const resultCountText = await catalogPage.getResultCountText();
      isResultCountValid = await commonFunctions.compareTwoValues(resultCountText.includes(TestData.SEARCH_QUERY), true, "Verifying result count text contains search query");

      const firstTitle = await catalogPage.getFirstBookTitle();
      isTitleValid = await commonFunctions.compareTwoValues(firstTitle, TestData.EXPECTED_MATCHING_TITLE, "Verifying search result book title");
    });

    await test.step('Verify clear search resets catalog view', async () => {
      await catalogPage.clearSearch();
      const booksCountAfterClear = await catalogPage.getBooksCount();
      isResetValid = await commonFunctions.compareTwoValues(booksCountAfterClear, 8, "Verifying catalog count after search clear");
    });


    expect(isCountValid && isResultCountValid && isTitleValid && isResetValid).toBeTruthy();
  });

  test('UI_CAT_04: Search - No Results @regression', async ({ catalogPage, commonFunctions, page, networkInterceptor }) => {
    await catalogPage.navigateToCatalog(envConfig.baseUrl);
    await catalogPage.getBooksCount();

    let isCountZero = false;
    let isEmptyMessageValid = false;

    await test.step('Perform search query for non-existent book', async () => {
      await catalogPage.searchBooks(TestData.GIBBERISH_QUERY);
    });

    await test.step('Verify zero books and no results message displayed', async () => {
      const booksCount = await catalogPage.getDisplayedBooksCount();
      isCountZero = await commonFunctions.compareTwoValues(booksCount, 0, "Verifying zero books displayed for gibberish search");

      const emptyMessage = await catalogPage.getEmptyStateText();
      isEmptyMessageValid = await commonFunctions.compareTwoValues(emptyMessage.includes(TestData.EXPECTED_EMPTY_MESSAGE_SUBSTRING), true, "Verifying empty state message text");
    });

    expect(isCountZero && isEmptyMessageValid).toBeTruthy();
  });

  test('UI_CAT_05: Book Detail View @smoke @regression', async ({ catalogPage, bookDetailPage, commonFunctions, page, networkInterceptor }) => {
    await catalogPage.navigateToCatalog(envConfig.baseUrl);
    await catalogPage.getBooksCount();

    let isUrlCorrect = false;
    let isTitleCorrect = false;
    let isAuthorCorrect = false;
    let isPriceCorrect = false;
    let isDescCorrect = false;
    let isBackNavCorrect = false;

    await test.step('Navigate to book detail page by clicking book title', async () => {
      await catalogPage.clickBookTitle(TestData.TARGET_BOOK_ID);
      const currentUrl = page.url();
      const expectedPattern = new RegExp(`/books/${TestData.TARGET_BOOK_ID}$`);
      isUrlCorrect = await commonFunctions.compareTwoValues(expectedPattern.test(currentUrl), true, "Verifying book detail URL");
    });

    await test.step('Verify book detail fields match expected data', async () => {
      const title = await bookDetailPage.getBookTitle();
      isTitleCorrect = await commonFunctions.compareTwoValues(title, TestData.TARGET_BOOK_TITLE, "Verifying book detail title");

      const author = await bookDetailPage.getBookAuthor();
      isAuthorCorrect = await commonFunctions.compareTwoValues(author, TestData.TARGET_BOOK_AUTHOR, "Verifying book detail author");

      const price = await bookDetailPage.getBookPrice();
      isPriceCorrect = await commonFunctions.compareTwoValues(price, TestData.TARGET_BOOK_PRICE, "Verifying book detail price");

      const description = await bookDetailPage.getBookDescription();
      isDescCorrect = await commonFunctions.compareTwoValues(description, TestData.TARGET_BOOK_DESCRIPTION, "Verifying book detail description");
    });

    await test.step('Verify back link navigates back to catalog', async () => {
      await bookDetailPage.clickBackToCatalog();
      const currentUrl = page.url();
      const currentPath = new URL(currentUrl).pathname;
      const isAtCatalog = (currentPath === '/' || currentPath === '') && currentUrl.startsWith(envConfig.baseUrl.replace(/\/$/, ''));
      isBackNavCorrect = await commonFunctions.compareTwoValues(isAtCatalog, true, "Verifying back to catalog URL");
    });

    expect(isUrlCorrect && isTitleCorrect && isAuthorCorrect && isPriceCorrect && isDescCorrect && isBackNavCorrect).toBeTruthy();
  });

});

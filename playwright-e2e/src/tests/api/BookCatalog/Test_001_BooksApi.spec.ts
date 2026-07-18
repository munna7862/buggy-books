import { test, expect } from '@playwright/test';
import { envConfig } from '../../../config/env.config';
import apiUtil from '../../../utils/api.util';
import { CommonFunctions } from '../../../utils/common.util';
import testData from '../../../test-data/api/Test_001_BooksApi.json';

const commonUtil = new CommonFunctions();
const BOOKS_URL = `${envConfig.apiBaseUrl}/api/books`;

async function validateBookContract(book: any) {
  await commonUtil.compareTwoValues(typeof book, 'object', 'Book entry is an object');
  await commonUtil.compareTwoValues(book !== null, true, 'Book entry is not null');
  await commonUtil.compareTwoValues(typeof book?.id, 'string', 'Book id is a string');
  await commonUtil.compareTwoValues(typeof book?.title, 'string', 'Book title is a string');
  await commonUtil.compareTwoValues(typeof book?.author, 'string', 'Book author is a string');
  await commonUtil.compareTwoValues(typeof book?.price, 'number', 'Book price is a number');
  await commonUtil.compareTwoValues(typeof book?.genre, 'string', 'Book genre is a string');
  await commonUtil.compareTwoValues(typeof book?.description, 'string', 'Book description is a string');
  await commonUtil.compareTwoValues(typeof book?.image, 'string', 'Book image is a string');
  return (
    typeof book?.id === 'string' &&
    typeof book?.title === 'string' &&
    typeof book?.author === 'string' &&
    typeof book?.price === 'number' &&
    typeof book?.genre === 'string' &&
    typeof book?.description === 'string' &&
    typeof book?.image === 'string'
  );
}

test.describe('Books API - List and Security', () => {
  let header: any;

  test.beforeAll(async () => {
    header = { 'Content-Type': 'application/json' };
  });

  test('Testcase 1: GET /api/books?page=1&limit=8 - should return a paged book list with valid contract for page 1', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: `${BOOKS_URL}?page=${testData.defaultPagination.page}&limit=${testData.defaultPagination.limit}`,
      headers: header,
      logMessage: 'Get paged books list',
      responseType: 'full',
    });

    await commonUtil.compareTwoValues(response.status, 200, 'Response status');
    await commonUtil.compareTwoValues(Array.isArray(response.data?.books), true, 'Books property is an array');
    await commonUtil.compareTwoValues(typeof response.data?.total, 'number', 'Total count is numeric');
    await commonUtil.compareTwoValues(typeof response.data?.page, 'number', 'Page is numeric');
    await commonUtil.compareTwoValues(typeof response.data?.totalPages, 'number', 'Total pages is numeric');
    await commonUtil.compareTwoValues(typeof response.data?.limit, 'number', 'Limit is numeric');
    await commonUtil.compareTwoValues(response.data?.page, testData.defaultPagination.page, `Returned page is ${testData.defaultPagination.page}`);
    await commonUtil.compareTwoValues(response.data?.limit, testData.defaultPagination.limit, `Returned limit is ${testData.defaultPagination.limit}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data?.books)).toBeTruthy();
    expect(typeof response.data?.total).toBe('number');
    expect(typeof response.data?.page).toBe('number');
    expect(typeof response.data?.totalPages).toBe('number');
    expect(typeof response.data?.limit).toBe('number');
    expect(response.data?.page).toBe(testData.defaultPagination.page);
    expect(response.data?.limit).toBe(testData.defaultPagination.limit);

    const books = response.data?.books ?? [];
    await commonUtil.compareTwoValues(books.length > 0, true, `Books array contains ${books.length} entries`);
    expect(books.length).toBeGreaterThan(0);

    const firstBook = books[0];
    await commonUtil.compareTwoValues(await validateBookContract(firstBook), true, 'First book payload matches contract');
    expect(await validateBookContract(firstBook)).toBeTruthy();
    for (const book of books) {
      await commonUtil.compareTwoValues(await validateBookContract(book), true, `Book id ${book?.id} has expected contract`);
      expect(await validateBookContract(book)).toBeTruthy();
    }
  });

  test('Testcase 2: GET /api/books?page=2&limit=8 - should return a paged book list with valid contract for page 2', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: `${BOOKS_URL}?page=${testData.page2Pagination.page}&limit=${testData.page2Pagination.limit}`,
      headers: header,
      logMessage: 'Get books for page 2',
      responseType: 'full',
    });

    await commonUtil.compareTwoValues(response.status, 200, 'Response status');
    await commonUtil.compareTwoValues(Array.isArray(response.data?.books), true, 'Books property is an array');
    await commonUtil.compareTwoValues(typeof response.data?.total, 'number', 'Total count is numeric');
    await commonUtil.compareTwoValues(typeof response.data?.page, 'number', 'Page is numeric');
    await commonUtil.compareTwoValues(typeof response.data?.totalPages, 'number', 'Total pages is numeric');
    await commonUtil.compareTwoValues(typeof response.data?.limit, 'number', 'Limit is numeric');
    await commonUtil.compareTwoValues(response.data?.page, testData.page2Pagination.page, `Returned page is ${testData.page2Pagination.page}`);
    await commonUtil.compareTwoValues(response.data?.limit, testData.page2Pagination.limit, `Returned limit is ${testData.page2Pagination.limit}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data?.books)).toBeTruthy();
    expect(typeof response.data?.total).toBe('number');
    expect(typeof response.data?.page).toBe('number');
    expect(typeof response.data?.totalPages).toBe('number');
    expect(typeof response.data?.limit).toBe('number');
    expect(response.data?.page).toBe(testData.page2Pagination.page);
    expect(response.data?.limit).toBe(testData.page2Pagination.limit);

    const books = response.data?.books ?? [];
    await commonUtil.compareTwoValues(books.length > 0, true, `Books array contains ${books.length} entries`);
    expect(books.length).toBeGreaterThan(0);

    const firstBook = books[0];
    await commonUtil.compareTwoValues(await validateBookContract(firstBook), true, 'First book payload matches contract');
    expect(await validateBookContract(firstBook)).toBeTruthy();
    for (const book of books) {
      await commonUtil.compareTwoValues(await validateBookContract(book), true, `Book id ${book?.id} has expected contract`);
      expect(await validateBookContract(book)).toBeTruthy();
    }
  });

  // Parameterized Pagination & Boundary Testing
  const paginationScenarios = testData.paginationScenarios;

  for (const scenario of paginationScenarios) {
    test(`Testcase 3: Pagination: ${scenario.description} (page=${scenario.page}, limit=${scenario.limit})`, async () => {
      const response = await apiUtil.makeRequest({
        method: 'GET',
        url: `${BOOKS_URL}?page=${scenario.page}&limit=${scenario.limit}`,
        headers: header,
        logMessage: `Get paged books list for ${scenario.description}`,
        responseType: 'full'
      });
      await commonUtil.compareTwoValues(response.status, 200, `Status code should be 200 for ${scenario.description}`);
      await commonUtil.compareTwoValues(response.data.page, scenario.page, `Response page should be ${scenario.page} for ${scenario.description}`);
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(scenario.page);

      if (scenario.page > response.data.totalPages) {
        await commonUtil.compareTwoValues(response.data.books.length, 0, `Books array should be empty for out-of-bounds page ${scenario.page}`);
        expect(response.data.books).toHaveLength(0); // Should return empty array for out-of-bounds
      } else {
        await commonUtil.compareTwoValues(response.data.books.length <= scenario.limit, true, `Books array length should be less than or equal to limit ${scenario.limit}`);
        expect(response.data.books.length).toBeLessThanOrEqual(scenario.limit);
      }
    });
  }

  // Data Integrity - No Duplicates across pages
  test('Testcase 4: Data Integrity: Page 1 last item should not be Page 2 first item', async () => {
    const page1 = await apiUtil.makeRequest({ method: 'GET', url: `${BOOKS_URL}?page=1&limit=5`, headers: header, logMessage: 'Get books for page 1', responseType: 'full' });
    const page2 = await apiUtil.makeRequest({ method: 'GET', url: `${BOOKS_URL}?page=2&limit=5`, headers: header, logMessage: 'Get books for page 2', responseType: 'full' });

    const lastItemP1 = page1.data.books[page1.data.books.length - 1].id;
    await commonUtil.logMessage('INFO', `Last item on page 1 ID: ${lastItemP1}`);
    const firstItemP2 = page2.data.books[0].id;
    await commonUtil.logMessage('INFO', `First item on page 2 ID: ${firstItemP2}`);

    expect(lastItemP1).not.toBe(firstItemP2);
  });

  // Negative Testing - Invalid Query Parameters
  const negativeScenarios = testData.negativeScenarios;

  for (const neg of negativeScenarios) {
    test(`Testcase 5: Negative: ${neg.description}`, async () => {
      const response = await apiUtil.makeRequest({
        method: 'GET',
        url: `${BOOKS_URL}?${neg.query}`,
        headers: header,
        responseType: 'full',
        logMessage: `Get books with invalid parameters: ${neg.description}`
      });

      // Depending on API design, this should be 400 Bad Request or default to 200 with fallback values
      await commonUtil.compareTwoValues(testData.allowedInvalidParameterStatus.includes(response.status), true, `Status code should be ${testData.allowedInvalidParameterStatus.join(' or ')} for invalid parameters: ${neg.description}`);
      expect(testData.allowedInvalidParameterStatus).toContain(response.status);
    });
  }

  // Security - Unauthorized Access (If applicable)
  test('Testcase 6: Security: Request without Content-Type header should be handled', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: BOOKS_URL,
      headers: {}, // Empty headers
      responseType: 'full',
      logMessage: 'Get books without Content-Type header'
    });
    // Most GET APIs tolerate missing headers, but good to check for 415 if required
    await commonUtil.compareTwoValues(response.status, 200, 'Status code should be 200 when Content-Type header is missing');
    expect(response.status).toBe(200);
  });

  // 5. Default Parameters
  test('Testcase 7: Defaults: Verify API works without query parameters', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: BOOKS_URL,
      headers: header,
      logMessage: 'Should give all books',
      responseType: 'full'
    });
    await commonUtil.compareTwoValues(response.status, 200, 'Status code should be 200 when no query parameters are provided');
    await commonUtil.compareTwoValues(response.data.length, testData.expectedAllBooksCount, `should provide all books count ${testData.expectedAllBooksCount}`);
    await commonUtil.compareTwoValues(Array.isArray(response.data), true, 'Response should be an array');
    expect(response.status).toBe(200);
    expect(response.data.length).toBe(testData.expectedAllBooksCount);
    expect(Array.isArray(response.data)).toBeTruthy();
  });
});

import { test, expect } from '../../../core/base/base.fixture';
import type { Book, PaginatedBooks } from '@buggybooks/types';
import { CommonFunctions } from '../../../utils/common.util';
import testData from '../../../test-data/api/BookCatalog/Test_001_BooksApi.json';

const commonUtil = new CommonFunctions();

async function validateBookContract(book: Book | Record<string, unknown>) {
  await commonUtil.compareTwoValues(typeof book, 'object', 'Book entry is an object');
  await commonUtil.compareTwoValues(book !== null, true, 'Book entry is not null');
  await commonUtil.compareTwoValues(typeof (book as Book)?.id, 'string', 'Book id is a string');
  await commonUtil.compareTwoValues(typeof (book as Book)?.title, 'string', 'Book title is a string');
  await commonUtil.compareTwoValues(typeof (book as Book)?.author, 'string', 'Book author is a string');
  await commonUtil.compareTwoValues(typeof (book as Book)?.price, 'number', 'Book price is a number');
  await commonUtil.compareTwoValues(typeof (book as Book)?.genre, 'string', 'Book genre is a string');
  await commonUtil.compareTwoValues(typeof (book as Book)?.description, 'string', 'Book description is a string');
  await commonUtil.compareTwoValues(typeof (book as Book)?.image, 'string', 'Book image is a string');
  return (
    typeof (book as Book)?.id === 'string' &&
    typeof (book as Book)?.title === 'string' &&
    typeof (book as Book)?.author === 'string' &&
    typeof (book as Book)?.price === 'number' &&
    typeof (book as Book)?.genre === 'string' &&
    typeof (book as Book)?.description === 'string' &&
    typeof (book as Book)?.image === 'string'
  );
}

test.describe('Books API - List and Security', () => {

  test('Testcase 1: GET /api/books?page=1&limit=8 - should return a paged book list with valid contract for page 1 @smoke @regression', async ({ request }) => {
    const response = await request.get(`/api/books?page=${testData.defaultPagination.page}&limit=${testData.defaultPagination.limit}`);

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as PaginatedBooks;

    await commonUtil.compareTwoValues(response.status(), 200, 'Response status');
    await commonUtil.compareTwoValues(Array.isArray(data.books), true, 'Books property is an array');
    await commonUtil.compareTwoValues(typeof data.total, 'number', 'Total count is numeric');
    await commonUtil.compareTwoValues(typeof data.page, 'number', 'Page is numeric');
    await commonUtil.compareTwoValues(typeof data.totalPages, 'number', 'Total pages is numeric');
    await commonUtil.compareTwoValues(typeof data.limit, 'number', 'Limit is numeric');
    await commonUtil.compareTwoValues(data.page, testData.defaultPagination.page, `Returned page is ${testData.defaultPagination.page}`);
    await commonUtil.compareTwoValues(data.limit, testData.defaultPagination.limit, `Returned limit is ${testData.defaultPagination.limit}`);

    expect(Array.isArray(data.books)).toBeTruthy();
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
    expect(typeof data.totalPages).toBe('number');
    expect(typeof data.limit).toBe('number');
    expect(data.page).toBe(testData.defaultPagination.page);
    expect(data.limit).toBe(testData.defaultPagination.limit);

    const books = data.books ?? [];
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

  test('Testcase 2: GET /api/books?page=2&limit=8 - should return a paged book list with valid contract for page 2 @smoke @regression', async ({ request }) => {
    const response = await request.get(`/api/books?page=${testData.page2Pagination.page}&limit=${testData.page2Pagination.limit}`);

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    const data = await response.json() as PaginatedBooks;

    await commonUtil.compareTwoValues(response.status(), 200, 'Response status');
    await commonUtil.compareTwoValues(Array.isArray(data.books), true, 'Books property is an array');
    await commonUtil.compareTwoValues(typeof data.total, 'number', 'Total count is numeric');
    await commonUtil.compareTwoValues(typeof data.page, 'number', 'Page is numeric');
    await commonUtil.compareTwoValues(typeof data.totalPages, 'number', 'Total pages is numeric');
    await commonUtil.compareTwoValues(typeof data.limit, 'number', 'Limit is numeric');
    await commonUtil.compareTwoValues(data.page, testData.page2Pagination.page, `Returned page is ${testData.page2Pagination.page}`);
    await commonUtil.compareTwoValues(data.limit, testData.page2Pagination.limit, `Returned limit is ${testData.page2Pagination.limit}`);

    expect(Array.isArray(data.books)).toBeTruthy();
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
    expect(typeof data.totalPages).toBe('number');
    expect(typeof data.limit).toBe('number');
    expect(data.page).toBe(testData.page2Pagination.page);
    expect(data.limit).toBe(testData.page2Pagination.limit);

    const books = data.books ?? [];
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
    test(`Testcase 3: Pagination: ${scenario.description} (page=${scenario.page}, limit=${scenario.limit}) @regression`, async ({ request }) => {
      const response = await request.get(`/api/books?page=${scenario.page}&limit=${scenario.limit}`);
      expect(response.status()).toBe(200);
      const data = await response.json() as PaginatedBooks;

      await commonUtil.compareTwoValues(response.status(), 200, `Status code should be 200 for ${scenario.description}`);
      await commonUtil.compareTwoValues(data.page, scenario.page, `Response page should be ${scenario.page} for ${scenario.description}`);
      expect(data.page).toBe(scenario.page);

      if (scenario.page > data.totalPages) {
        await commonUtil.compareTwoValues(data.books.length, 0, `Books array should be empty for out-of-bounds page ${scenario.page}`);
        expect(data.books).toHaveLength(0);
      } else {
        await commonUtil.compareTwoValues(data.books.length <= scenario.limit, true, `Books array length should be less than or equal to limit ${scenario.limit}`);
        expect(data.books.length).toBeLessThanOrEqual(scenario.limit);
      }
    });
  }

  // Data Integrity - No Duplicates across pages
  test('Testcase 4: Data Integrity: Page 1 last item should not be Page 2 first item @regression', async ({ request }) => {
    const page1Res = await request.get('/api/books?page=1&limit=5');
    const page2Res = await request.get('/api/books?page=2&limit=5');

    expect(page1Res.status()).toBe(200);
    expect(page2Res.status()).toBe(200);

    const page1 = await page1Res.json() as PaginatedBooks;
    const page2 = await page2Res.json() as PaginatedBooks;

    const lastItemP1 = page1.books[page1.books.length - 1].id;
    await commonUtil.logMessage('INFO', `Last item on page 1 ID: ${lastItemP1}`);
    const firstItemP2 = page2.books[0].id;
    await commonUtil.logMessage('INFO', `First item on page 2 ID: ${firstItemP2}`);

    expect(lastItemP1).not.toBe(firstItemP2);
  });

  // Negative Testing - Invalid Query Parameters
  const negativeScenarios = testData.negativeScenarios;

  for (const neg of negativeScenarios) {
    test(`Testcase 5: Negative: ${neg.description} @regression`, async ({ request }) => {
      const response = await request.get(`/api/books?${neg.query}`);
      await commonUtil.compareTwoValues(
        testData.allowedInvalidParameterStatus.includes(response.status()),
        true,
        `Status code should be ${testData.allowedInvalidParameterStatus.join(' or ')} for invalid parameters: ${neg.description}`
      );
      expect(testData.allowedInvalidParameterStatus).toContain(response.status());
    });
  }

  // Security - Unauthorized Access / Missing Headers
  test('Testcase 6: Security: Request without Content-Type header should be handled @regression', async ({ request }) => {
    const response = await request.get('/api/books', {
      headers: {} // Empty headers
    });
    await commonUtil.compareTwoValues(response.status(), 200, 'Status code should be 200 when Content-Type header is missing');
    expect(response.status()).toBe(200);
  });

  // Default Parameters
  test('Testcase 7: Defaults: Verify API works without query parameters @smoke @regression', async ({ request }) => {
    const response = await request.get('/api/books');
    expect(response.status()).toBe(200);
    const data = await response.json() as Book[];

    await commonUtil.compareTwoValues(response.status(), 200, 'Status code should be 200 when no query parameters are provided');
    await commonUtil.compareTwoValues(data.length, testData.expectedAllBooksCount, `should provide all books count ${testData.expectedAllBooksCount}`);
    await commonUtil.compareTwoValues(Array.isArray(data), true, 'Response should be an array');
    expect(data.length).toBe(testData.expectedAllBooksCount);
    expect(Array.isArray(data)).toBeTruthy();
  });
});

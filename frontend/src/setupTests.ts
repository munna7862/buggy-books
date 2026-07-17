import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global fetch to handle ChaosProvider's configuration polling and Catalog book loading cleanly in tests
(globalThis as any).fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/test/config')) {
    const configData = {
      checkoutFailureRate: 0.15,
      inventoryDelayMs: 0,
      jwtExpirySeconds: 900,
      websocketDropRate: 0,
      uploadFailureRate: 0,
      injectA11yViolations: false,
      visualChaos: false,
    };
    return Promise.resolve(
      new Response(JSON.stringify(configData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
  if (url.includes('/books')) {
    const booksData = {
      books: [
        { id: '1', title: 'Test Book 1', author: 'Author 1', price: 9.99, image: '' }
      ],
      total: 1,
      page: 1,
      totalPages: 1
    };
    return Promise.resolve(
      new Response(JSON.stringify(booksData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
  return Promise.reject(new Error(`Unhandled fetch request in test: ${url}`));
});

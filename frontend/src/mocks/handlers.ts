/**
 * MSW (Mock Service Worker) Request Handlers
 * ============================================
 * These handlers intercept API requests during frontend component tests
 * (Vitest + @testing-library/react), allowing the frontend to be tested
 * in complete isolation from the backend.
 *
 * Usage:
 *   - Imported automatically by `src/mocks/browser.ts` for browser-mode mocking.
 *   - Imported by `src/mocks/server.ts` for Node.js test-mode mocking (Vitest).
 *
 * To add a new mock:
 *   http.get('/api/my-endpoint', () => HttpResponse.json({ ... }))
 */

import { http, HttpResponse } from "msw";

const BASE = "http://localhost:4000/api";

// ---------------------------------------------------------------------------
// Sample mock books (mirrors db.json format)
// ---------------------------------------------------------------------------
const MOCK_BOOKS = [
  {
    id: "1",
    title: "The Great Buggy Gatsby",
    author: "F. Scott Flakyzgerald",
    price: 12.99,
    genre: "Fiction",
    image: "https://picsum.photos/seed/book1/200/300",
    description: "A classic tale of flaky network calls and broken promises.",
  },
  {
    id: "2",
    title: "To Kill a Mockingbird Exception",
    author: "Harper Testlee",
    price: 9.99,
    genre: "Drama",
    image: "https://picsum.photos/seed/book2/200/300",
    description: "An unforgettable story about courage and null pointer exceptions.",
  },
  {
    id: "3",
    title: "1984 Bugs",
    author: "George Orwello",
    price: 8.99,
    genre: "Dystopia",
    image: "https://picsum.photos/seed/book3/200/300",
    description: "Big Browser is watching your unhandled promise rejections.",
  },
];

export const handlers = [
  // -------------------------------------------------------------------------
  // Books
  // -------------------------------------------------------------------------
  http.get(`${BASE}/books`, () => {
    return HttpResponse.json({
      books: MOCK_BOOKS,
      total: MOCK_BOOKS.length,
      page: 1,
      totalPages: 1,
    });
  }),

  http.get(`${BASE}/books/:id`, ({ params }: any) => {
    const book = MOCK_BOOKS.find((b) => b.id === params.id);
    if (!book) {
      return HttpResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return HttpResponse.json(book);
  }),

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------
  http.post(`${BASE}/login`, async ({ request }: any) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.username === "testuser" && body.password === "password123") {
      return HttpResponse.json(
        { username: "testuser", message: "Login successful" },
        {
          headers: {
            "Set-Cookie": "token=mock-access-token; HttpOnly; Path=/",
          },
        }
      );
    }
    return HttpResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }),

  http.post(`${BASE}/logout`, () => {
    return HttpResponse.json({ message: "Logged out successfully" });
  }),

  http.post(`${BASE}/register`, async ({ request }: any) => {
    const body = (await request.json()) as { username: string };
    return HttpResponse.json({ username: body.username, message: "Registration successful" });
  }),

  http.post(`${BASE}/auth/refresh`, () => {
    return HttpResponse.json({ message: "Token refreshed" });
  }),

  // -------------------------------------------------------------------------
  // Cart
  // -------------------------------------------------------------------------
  http.get(`${BASE}/cart`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${BASE}/cart`, async ({ request }: any) => {
    const body = (await request.json()) as { bookId: string };
    const book = MOCK_BOOKS.find((b) => b.id === body.bookId);
    if (!book) {
      return HttpResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return HttpResponse.json({ message: "Added to cart", book });
  }),

  http.delete(`${BASE}/cart`, () => {
    return HttpResponse.json({ message: "Cart cleared" });
  }),

  http.delete(`${BASE}/cart/:bookId`, () => {
    return HttpResponse.json({ message: "Item removed from cart" });
  }),

  // -------------------------------------------------------------------------
  // Checkout (intentionally flaky — 15% of the time returns 500)
  // -------------------------------------------------------------------------
  http.post(`${BASE}/checkout/process`, () => {
    if (Math.random() < 0.15) {
      return HttpResponse.json(
        { error: "Internal Server Error: Payment processor unavailable" },
        { status: 500 }
      );
    }
    return HttpResponse.json({
      message: "Order placed successfully",
      orderId: `ORD-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
    });
  }),

  // -------------------------------------------------------------------------
  // Chaos / Test configuration
  // -------------------------------------------------------------------------
  http.get(`${BASE}/test/config`, () => {
    return HttpResponse.json({
      checkoutFailureRate: 0.15,
      inventoryDelayMs: 0,
      jwtExpirySeconds: 900,
      websocketDropRate: 0,
      uploadFailureRate: 0,
      injectA11yViolations: false,
      visualChaos: false,
    });
  }),

  http.post(`${BASE}/test/config`, async ({ request }: any) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, config: body });
  }),

  http.post(`${BASE}/test/reset`, () => {
    return HttpResponse.json({ success: true, message: "Test state reset successfully" });
  }),
];

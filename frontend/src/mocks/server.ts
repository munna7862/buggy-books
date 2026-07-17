/**
 * MSW Node Server Setup (for Vitest / Testing Library tests)
 * ===========================================================
 * Sets up a mock Express-like server in Node.js memory for component tests.
 *
 * Example usage in a test file:
 *
 *   import { server } from "../mocks/server";
 *   import { http, HttpResponse } from "msw";
 *
 *   // Override a handler for a specific test:
 *   server.use(
 *     http.post("http://localhost:4000/api/checkout/process", () => {
 *       return HttpResponse.json({ error: "Server Error" }, { status: 500 });
 *     })
 *   );
 *
 * Or set it up globally in `setupTests.ts`:
 *
 *   import { server } from "./mocks/server";
 *   beforeAll(() => server.listen());
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

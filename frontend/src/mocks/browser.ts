/**
 * MSW Browser Worker Setup
 * =========================
 * Sets up the MSW Service Worker for browser-mode API mocking.
 * Used during development if you want to run the frontend without
 * a live backend (e.g., `npm run dev:mock`).
 *
 * To activate:
 *   1. Run `npx msw init public/ --save` to install the service worker file.
 *   2. Import and start this worker in main.tsx:
 *
 *      if (import.meta.env.VITE_MOCK_API === "true") {
 *        const { worker } = await import("./mocks/browser");
 *        await worker.start({ onUnhandledRequest: "bypass" });
 *      }
 *
 * For Vitest component tests, see `src/mocks/server.ts` instead.
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

# BuggyBooks: Project Summary

**Date Updated**: April 12, 2026
**Target Goal**: A local web application designed specifically as a practice target for Software Quality Engineering and Test Automation (UI, API, and Performance testing).

## Overview
We have successfully built a full-stack local application from scratch. The application intentionally contains flaky behavior, delayed responses, and difficult-to-locate web elements to serve as a robust target for test automation frameworks like Selenium.

### Live Deployments
* **Frontend UI**: [https://buggy-books-fe.onrender.com](https://buggy-books-fe.onrender.com)
* **Backend API**: [https://buggy-books.onrender.com/api](https://buggy-books.onrender.com/api)

## 1. Project Architecture
The project utilizes a segmented, Monorepo style structure, easily spun up concurrently using a single command (`npm run dev`).

```text
buggy-books/
├── package.json (Runs concurrently frontend and backend)
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   │   └── api.ts
│   │   └── data/
│   │       └── db.json
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── components/
│   │   │   └── OrderSummary.tsx
│   │   └── pages/
│   │       ├── Catalog.tsx
│   │       ├── Cart.tsx
│   │       └── Checkout.tsx
```

*   **Backend**: Node.js, Express, TypeScript.
*   **Frontend**: React, Vite, TypeScript, React Router.
*   **Database**: Local JSON file (`db.json`) allowing for instant test-state resetting upon backend restarts.

## 2. API Layer Achievements (Backend)
We developed resilient, customized endpoints targeting common E2E and Performance testing scenarios:
*   **Standard CRUD**: Implemented functional endpoints for fetching books and adding items to the cart, guarded by a mock JWT authorization check.
*   **Flaky Endpoint (`POST /api/checkout/process`)**: Intentionally coded to throw a `500 Internal Server Error` exactly 15% of the time, forcing test scripts to implement retry/polling logic.
*   **Heavy Endpoint (`GET /api/inventory/report`)**: Forcibly blocks the response by 3 seconds (`setTimeout`) to simulate heavy load. Perfect for JMeter or K6 performance testing.
*   **Rate Limiting**: Successfully configured `express-rate-limit` on all endpoints. If an automated script exceeds 60 requests per minute, it will be accurately blocked with a `429 Too Many Requests` status code.

## 3. UI Layer Achievements (Frontend)
The user interface is entirely functional but laced with anti-patterns to challenge automation engineers:
*   **Dynamic Delays**: The "Add to Cart" button simulates slow internet or processing times by imposing a randomly generated dynamic delay (between 500ms and 3500ms) before changing state.
*   **Obfuscated Locators**: Removed all SEMANTIC selectors, `id` attributes, and `data-testid` properties across the catalog list and the checkout form. Test scripts must now rely on complex CSS chaining, nested paths, or XPath.
*   **Shadow DOM Encapsulation**: Built a custom native web component (`<order-summary-box>`) to wrap the Order Summary total. This isolates the element in a Shadow Root, meaning standard driver queries (`document.querySelector`) will fail unless explicitly written to pierce the shadow boundary.

## 4. Code Quality & Formatting
*   Successfully resolved and compiled a full 0-error TypeScript build (`tsc`).
*   Mitigated strict linting rule violations (e.g., removing `any` type fallbacks and bypassing rigid React Compiler warnings where intentional unreliability required it).

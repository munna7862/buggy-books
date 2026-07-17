# 🐛 BuggyBooks: Intentional Bugs & Testing Challenges

This document catalogs the intentional bugs, flaky behaviors, performance bottlenecks, and security/accessibility challenges designed into the BuggyBooks project. These challenges are explicitly implemented to serve as testing targets for UI automation (e.g., Playwright, Selenium), API testing, accessibility audits, and performance/load testing (e.g., JMeter, k6).

---

## 1. Dynamic & Configurable Chaos Injectors (Backend)
The backend manages a dynamic config state in the [ChaosStore](file:///c:/BuggyBooks/buggy-books/backend/src/data/chaosStore.ts). These behaviors can be fetched via `GET /api/test/config` and updated at runtime via `POST /api/test/config`.

### ⚡ Flaky Checkout Endpoint (`checkoutFailureRate`)
* **File Location**: [checkoutController.ts](file:///c:/BuggyBooks/buggy-books/backend/src/controllers/checkoutController.ts#L20-L24)
* **Bug/Behavior**: The payment processing endpoint `POST /api/checkout/process` is coded to randomly fail with a `500 Internal Server Error: Payment Gateway Timeout`.
* **Default Rate**: `0.15` (15% failure rate).
* **QA Goal**: Exercises E2E test suites on retry policies, exponential backoff, and graceful client-side handling of transient network errors.

### 🕒 Heavy Report Query / API Latency (`inventoryDelayMs`)
* **File Location**: [bookController.ts](file:///c:/BuggyBooks/buggy-books/backend/src/controllers/bookController.ts#L26-L36)
* **Bug/Behavior**: The inventory report endpoint `GET /api/inventory/report` is intentionally throttled via a backend `setTimeout` delay.
* **Default Delay**: `3000ms` (3 seconds delay).
* **QA Goal**: Simulated heavy load; perfect for testing API timeouts and JMeter/k6 performance benchmarks.

### 📉 Flaky WebSockets (`websocketDropRate`)
* **File Location**: [server.ts](file:///c:/BuggyBooks/buggy-books/backend/src/server.ts#L23-L31)
* **Bug/Behavior**: Once a WebSocket client connects, the server randomly terminates the socket session after a brief delay (1 to 4 seconds).
* **Default Rate**: `0.0` (disabled by default).
* **QA Goal**: Challenges testers to write robust, self-healing WebSocket listeners that automatically handle connection drops and state synchronization.

### 📁 Avatar Upload Failures (`uploadFailureRate`)
* **File Location**: [profileController.ts](file:///c:/BuggyBooks/buggy-books/backend/src/controllers/profileController.ts#L107-L112)
* **Bug/Behavior**: The profile picture upload endpoint `POST /api/profile/avatar` randomly rejects requests with `500 Internal Server Error: Upload service failed` based on this config rate.
* **Default Rate**: `0.0` (disabled by default).
* **QA Goal**: Tests retry handlers on multipart/form-data upload streams.

### 🔑 Expiring Access Tokens (`jwtExpirySeconds`)
* **File Location**: [authController.ts](file:///c:/BuggyBooks/buggy-books/backend/src/controllers/authController.ts#L57-L60)
* **Bug/Behavior**: Access tokens (JWT) can be configured to expire after a short lifetime (specified in seconds).
* **Default Lifespan**: `900` seconds (15 minutes).
* **QA Goal**: Triggers client-side authorization expiration, forcing the test automation tool to verify HTTP interceptors that exchange refresh tokens at `/api/auth/refresh`.

---

## 2. Frontend Automation & Element Locator Hurdles (Always Active)

### 🕵️ Obfuscated & Non-Semantic Locators
* **File Locations**: [Catalog.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/pages/Catalog.tsx) & [Checkout.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/pages/Checkout.tsx)
* **Bug/Behavior**: Standard, easy-to-use semantic test selectors (like `data-testid` or unique semantic IDs) are absent on critical elements:
  * Catalog layout containers use class names like `layout-wrapper-xyz987` and `complex-item-box-alpha`.
  * Login, registration, and checkout inputs use dynamic or obfuscated forms like `txt_usr_77`, `txt_pwd_99`, `txt_f1`, or `txt_c99`.
* **QA Goal**: Challenges QA engineers to write resilient locator strategies utilizing CSS nesting, relative layout pathing, or text matching rather than relying on brittle semantic IDs.

### ⏳ Add to Cart Delay
* **File Location**: [Catalog.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/pages/Catalog.tsx#L59-L72)
* **Bug/Behavior**: Clicking the "Add to Cart" button introduces a client-side simulated dynamic delay between `500ms` and `3500ms` (using `setTimeout`) before firing the actual API request.
* **QA Goal**: Tests the use of asynchronous wait expectations (e.g., awaiting the cart badge counter change or the success notification toast) rather than using hardcoded thread sleeps.

### 🌑 Shadow DOM Encapsulation
* **File Location**: [OrderSummary.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/components/OrderSummary.tsx)
* **Bug/Behavior**: The "Secure Order Summary" component is rendered within a native Web Component (`<order-summary-box>`) utilizing an open **Shadow Root**.
* **QA Goal**: Selenium or raw document query drivers (`document.querySelector`) fail to search inside this section unless scripts are written to explicitly retrieve and query the shadow root.

---

## 3. Dynamic Chaos Toggle-able Violations
When enabled via `/api/test/config`, these flags introduce deliberate layout, accessibility, and visual failures into the DOM.

### ♿ Accessibility (a11y) Violations (`injectA11yViolations = true`)
* **File Locations**: [Catalog.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/pages/Catalog.tsx), [Checkout.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/pages/Checkout.tsx), [Login.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/pages/Login.tsx)
* **Violations Injected**:
  1. **Missing Label Links**: Removes `htmlFor` attributes from form labels and `id` tags from fields in the Login and Checkout pages, leaving labels orphaned.
  2. **Missing Image Alt Text**: Removes `alt` labels from catalog book cover images.
  3. **Missing Form Element Aria Label**: Removes `aria-label` from the search bar input.
  4. **Poor Color Contrast**: Applies a light grey color on a solid white background (`#eaeaea` on `#ffffff`) to the book result count banner.
* **QA Goal**: Serves as a target for automated accessibility scanning tools (like Axe Core or Lighthouse) to ensure that automated scans can catch structural violations.

### 🎨 Visual Regression Chaos (`visualChaos = true`)
* **File Location**: [index.css](file:///c:/BuggyBooks/buggy-books/frontend/src/index.css#L1269-L1307)
* **Anomalies Injected**:
  1. **Button Shifting**: Shifts the checkout submit button right by `15px`.
  2. **Text Line-Height Skewing**: Increases catalog title/description line-height to `3.2`, causing text to push elements off-center.
  3. **Blur Filter**: Blurs cover images using a `filter: blur(1.5px)` overlay.
  4. **Overlap margins**: Shifts the search bar container to overlap content borders.
  5. **Price Alignment**: Rotates and translates the catalog price tag display (`rotate(-3deg) translateX(8px)`).
  6. **Highlight Border**: Injects a bright red border around every catalog book card.
* **QA Goal**: Evaluates visual testing tools (Applitools, Playwright visual snapshots) to ensure screenshot comparison engines flag layout changes.

---

## 4. Operational Boundaries

### 🚫 Rate Limiter Middleware
* **File Location**: [app.ts](file:///c:/BuggyBooks/buggy-books/backend/src/app.ts#L61-L71)
* **Bug/Behavior**: Configured to block any IP that sends more than `60` requests in a 1-minute window, returning a `429 Too Many Requests` response.
* **QA Goal**: Prepares QA teams for production rate-limits and checks whether automation suites can recover or handle throttled API gateways.

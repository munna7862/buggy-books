---
name: playwright-ai-assistant
description: >-
  Uses local DOM scraping, page snapshotting, and failure-capture hooks to automatically write Page Objects, generate E2E test specs, and self-heal locator failures in the Playwright repository.
---

# Playwright E2E AI Assistant Skill

## Overview
This skill guides the agent to autonomously generate Page Objects, write E2E test specs, and self-heal locator failures in the Playwright test suite. It coordinates CLI snapshot utilities and failure-hook reports.

---

## 1. Capabilities & Instructions

### 1.1 Generating Page Object Models (POMs)
When requested to create a Page Object for a page (e.g. catalog or login):
1. **Launch & Capture Snapshot:** Execute the save-snapshot CLI script in the `playwright-e2e` directory:
   - **For public pages:**
     `npx ts-node scripts/save-snapshot.ts <url> <page-name>`
   - **For pages requiring interactive actions (SSO, MFA, scroll to load):**
     Run in headful mode using:
     `npx ts-node scripts/save-snapshot.ts <url> <page-name> --interactive`
     *(Wait for the user to confirm completion in the terminal).*
2. **Read Cleaned HTML:** Load the captured HTML snapshot from `playwright-e2e/reports/snapshots/<page-name>.html` and the accessibility tree YAML from `playwright-e2e/reports/snapshots/<page-name>.yaml`.
3. **Draft the POM Class:**
   - Extend `BasePage` imported from `../core/base/base.page`.
   - Declare locators as private getters returning `Locator` using `@playwright/test` (e.g., `private get txtUsername(): Locator`).
   - Implement public action methods using custom `BasePage` wrappers (`this.doClick`, `this.doEnterText`, `this.doGetText`, etc.) with meaningful descriptive logs.
4. **Save Page Object:** Write the TypeScript file directly to `playwright-e2e/src/pages/<page-name>.page.ts`.

### 1.2 Generating E2E Test Specs (UI & API)
When requested to write E2E tests:
1. **Analyze existing POMs (for UI):** Check page object classes in `playwright-e2e/src/pages/` to identify reusable methods. Specs must not contain inline selectors.
2. **Draft the Spec:**
   - Import `test` from `../../../core/base/base.fixture` (extended custom fixture) and `expect` from `@playwright/test`.
   - Group test steps using `await test.step(...)`.
   - **For API Tests:**
     - Utilize Playwright's native `request` context.
     - Enforce type safety for request payloads and parse JSON responses.
     - Validate standard status code boundaries (e.g. `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`).
     - Isolate test data from test code using JSON files under `src/test-data/`.
3. **Save Spec:** Write the file to `playwright-e2e/src/tests/ui/<FeatureName>/<TestName>.spec.ts` or `src/tests/api/<TestName>.spec.ts`.

### 1.3 Self-Healing Broken Tests
When a test fails or when requested to "heal a failure":
1. **Load Failure Context:** Read the generated failure metadata from:
   - `playwright-e2e/reports/snapshots/failure-context.json` (contains the failing locator and error traceback)
   - `playwright-e2e/reports/snapshots/failure-dom.html` (contains the cleaned DOM at failure point)
   - `playwright-e2e/reports/snapshots/failure-aria.yaml` (contains the accessibility tree ARIA snapshot at failure point)
2. **Diagnose Selector Changes:**
   - Compare the failing locator from `failure-context.json` against the elements inside `failure-dom.html`.
   - Match the target selector to its updated element attributes.
3. **Patch Code:** Automatically locate the corresponding Page Object (or test spec) file and update the broken selector.
4. **Rerun & Verify:** Run the spec using Playwright to confirm the healed test passes:
   `npx cross-env HEADLESS=true npx playwright test src/tests/ui/<FeatureName>/<TestName>.spec.ts --config=src/config/playwright.config.ts`

---

## 2. SDET Coding Standards

### 2.1 Locator Selection Hierarchy
When generating or updating selectors, always adhere to this prioritization:
1. **Playwright Recommended Semantic Locators:**
   * `this.page.getByRole(...)`
   * `this.page.getByPlaceholder(...)`
   * `this.page.getByLabel(...)`
   * `this.page.getByTestId(...)`
2. **Standard CSS/ID Selectors:** Fall back to unique element IDs (`#element-id`) or unique classes.
3. **Relative XPaths (Fallback Only):** 
   - Use relative XPaths (e.g. `//button[...]`) only when standard semantic or CSS locators fail to isolate the element.
   - You **must** use relative XPaths when complex traversals are required using **XPath axes** (such as `following-sibling`, `preceding-sibling`, `ancestor`).
   - **BANNED:** **Absolutely no absolute XPaths** (e.g. `/html/body/div[1]/div[2]...`).

### 2.2 Formatting and Design Rules
- **Locator Placement:** ALL locators (private getters and dynamic locator methods) MUST be placed at the top of the Page Object class, before any public action methods.
- **Encapsulation:** Never write raw selectors directly inside spec files. All selectors must be declared in POMs as private getters.
- **Assertion Pattern:** Do NOT use multiple hard `expect(...)` assertions scattered inside test steps. Always use soft assertions via `commonFunctions.compareTwoValues(actual, expected, message)` to log results, collect boolean validation flags, and execute a single consolidated hard assertion (e.g., `expect(isCountValid && isTitleValid).toBeTruthy()`) at the end of the test case.
- **Indentation:** Use exactly 2 spaces for indentation (no tabs).
- **Single-Line Signatures:** Keep class methods and function parameter definitions on a single line.
- **Custom wrappers:** Always call custom base wrappers (`this.doClick`, `this.doEnterText`, `this.doGetText`) rather than native locator operations.
- **Native Browser Dialog Handling:** When testing actions that trigger browser dialogs (`window.alert`, `window.confirm`, `window.prompt` or dirty navigation interceptors), set up a single-use dialog handler using `page.once('dialog', async dialog => { ... })` *before* executing the triggering action. Explicitly accept (`await dialog.accept()`) or dismiss (`await dialog.dismiss()`) and verify the dialog message text.
- **Multi-Step Wizard Testing:** For multi-step wizard flows, verify stepper progress state classes (e.g. `step-active`, `step-completed`), step container visibility, and history preservation (retrieving typed values after clicking Back/Next) through encapsulated Page Object getters.
- **Asynchronous Network Synchronization:** When performing actions that mutate backend state (such as adding items to cart, step transitions, or form submissions), set up specific `waitForResponse` or toast status message waiters to guarantee state settling before proceeding to navigation or assertions.
- **Frontend Component MSW API Mocking:** For frontend component tests using Vitest + React Testing Library + MSW, import `server` from `src/mocks/server.ts` and `http`, `HttpResponse` from `msw`. To test custom error states or empty API returns, override specific endpoint handlers per test using `server.use(http.get/post(...))` and ensure `server.resetHandlers()` resets handlers after each test.
- **File Upload Automation:** When testing file upload components, set file inputs via encapsulated POM methods using `locator.setInputFiles(filePath)`. For validation and chaos testing, generate test fixture files locally, verify HTTP response status codes (200, 400, 500), and reset chaos configuration flags in a `finally` block.
- **API Security & Refresh Token Automation:** For API test cases verifying JWT tokens and security headers, parse `Set-Cookie` response headers for `token` and `refreshToken` parameters and security flags (`HttpOnly`). When testing dynamic token expiry (`jwtExpirySeconds`), wait for token expiry before invoking protected endpoints and verify 403 Forbidden statuses.
- **Visual Chaos API Testing:** When testing chaos configuration endpoints (`/api/test/config`), verify boolean toggles (`visualChaos: true/false`), strict type validation rejections (400 Bad Request for string inputs), default configuration state after calling reset (`/api/test/reset`), and combined multi-field chaos updates.
- **Structured Logging & Correlation ID Testing:** When testing request tracing, validate that responses automatically populate the `x-correlation-id` header matching UUIDv4 format (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`), custom `x-correlation-id` headers are preserved across API invocations, and error payloads return matching `correlationId` fields in the JSON response body.
- **UI Transparent Refresh & Session Redirection:** When testing client-side token retry logic on the UI level, inject short access token expirations (`jwtExpirySeconds: 2`), wait for token expiry, and verify UI actions complete silently without forced logouts. For session expiry tests, clear auth cookies, invoke protected UI actions/navigation, and assert user redirection to `/login`.
- **GitHub Workflow Matrix Synchronization:** When adding new UI test suite subdirectories inside `playwright-e2e/src/tests/ui/`, update the matrix shard definitions in `.github/workflows/playwright-docker.yml` so Docker CI runs all test suites.
- **Accessibility (a11y) Scan Testing:** When running WCAG accessibility scans, import `AxeBuilder` from `@axe-core/playwright`. Under normal state (`injectA11yViolations: false`), verify 0 violations exist. Under chaos mode (`injectA11yViolations: true`), target specific rules (`image-alt`, `label`, `color-contrast`) or container targets and assert that Axe detects the expected violations.
- **WebSockets Event & Resilience Testing:** When testing real-time socket connections (Socket.IO), verify connection status indicators (`#ws-status-dot` class `status-connected`), event stream updates inside dropdown containers, and hot-toast alerts triggered by user purchases. For resilience testing, inject `websocketDropRate: 1.0` via chaos API config, assert disconnection/reconnection status classes (`status-disconnected` / `status-reconnecting`), and reset `websocketDropRate: 0` in a `finally` block.
- **UI Styling & Layout Testing:** When testing CSS layout and styling correctness:
  - **Selector Existence Checks:** Assert DOM element existence using `page.locator(selector).count()` and verify `count > 0`. Never directly assert against element visibility for selector-preservation checks.
  - **Computed CSS Evaluation:** Read computed style properties using `page.locator(selector).evaluate(el => getComputedStyle(el).propertyName)`. For root CSS variables, use `page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--variable-name').trim())`.
  - **Grid Layout Verification:** Verify responsive grid layouts by evaluating `getComputedStyle(el).gridTemplateColumns` after changing viewport with `page.setViewportSize({ width, height })`. For `repeat(auto-fill, minmax(280px, 1fr))`, assert the computed value includes `"280px"` (browsers compute the string representation).
  - **Hover Animation Verification:** Trigger hover using `page.locator(selector).hover()`. After an `await page.waitForTimeout(600)` delay for CSS transition completion, evaluate the `transform` computed style on the hover-targeted child element and assert it includes `"matrix"` (indicating CSS scale/rotate transforms are active).
  - **Dark/Light Mode CSS Variables:** Emulate color schemes using `page.emulateMedia({ colorScheme: 'dark' | 'light' })` before navigation. After page load, evaluate the CSS variable from `document.documentElement` and assert the exact HSL string (e.g., `hsl(210, 40%, 98%)`) matches the expected value from the design system.
- **Visual Regression & Layout Chaos Testing:** When testing visual layouts under QA chaos injections:
  - **Screenshot Comparison (toHaveScreenshot):** Establish a baseline screenshot using standard assertion matching (`expect(page).toHaveScreenshot('filename.png', { maxDiffPixelRatio: 0.05 })`). Assert screenshot mismatch when visual chaos is enabled using `expect(page).not.toHaveScreenshot('filename.png', { maxDiffPixelRatio: 0.05 })`.
  - **Chaos style changes validation:** Under layout chaos, assert specific computed styles such as `border-color` (e.g. `rgb(242, 36, 36)`), `filter` (e.g. `blur(1.5px)`), `transform` (e.g. checking for displacement/rotation containing matrices), `margin-left` adjustments, and `line-height` scaling factors relative to font sizes.
  - **Reset/Cleanup Isolation:** Always use the `test.afterEach` hooks or `finally` blocks to invoke `/api/test/reset` to restore visual layouts to their default state so succeeding tests run on standard baselines.













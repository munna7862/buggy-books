---
description: "Spec structure, custom fixture injection, test-data path mirroring, soft assertions, and async settling for Playwright UI tests"
applyTo: "playwright-e2e/src/tests/ui/**/*.spec.ts"
---
# UI Spec rules

These apply on top of the global conventions in `.github/copilot-instructions.md`.

## Structure & fixtures
- Import `test` from the extended custom fixture: `import { test } from '../../../core/base/base.fixture'`.
- Import `expect` from `@playwright/test`.
- Use the injected fixtures (`signUpPage`, `catalogPage`, `bookDetailPage`, `cartPage`, `checkoutPage`, `profilePage`, `notificationCenter`, `commonFunctions`, `networkInterceptor`) rather than instantiating page objects manually where provided.
- Group logical test steps inside `await test.step('Human readable step name', async () => { ... })`.

## Test data mapping
- Test data JSON MUST mirror the spec file path under `src/test-data/`:
  - Spec: `src/tests/ui/Checkout/Test_001_CompleteBookPurchase.spec.ts`
  - Data: `src/test-data/ui/Checkout/Test_001_CompleteBookPurchase.json`
- Load test data dynamically using `path.join(__dirname, '../../../test-data/ui/...')`.
- Never hardcode credentials, URLs, or scenario inputs inside spec files — retrieve credentials via `getLoginCredentials()` from `src/config/env.config`.

## Assertions (Soft-then-Hard pattern)
- Do NOT scatter multiple hard `expect(...)` calls through steps.
- Perform intermediate checks via `commonFunctions.compareTwoValues(actual, expected, message)` which logs PASS/FAIL and invokes `expect.soft`.
- Conclude each test case with a single consolidated hard assertion (e.g., `expect(isA && isB).toBeTruthy()`).

## Synchronization & waits
- Replace static sleeps (`waitForTimeout`) with deterministic conditions:
  - `locator.waitFor({ state: 'visible' })`
  - `page.waitForResponse(response => ...)`
  - Status/toast message waiters

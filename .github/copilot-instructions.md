# Copilot Instructions — BuggyBooks

Always-on guidance for this repository. Path-scoped rules live in `.github/instructions/`.

## What this repo is
An **intentionally buggy** book-store demo used to exercise test-automation and chaos scenarios.
- **`frontend/`** — React + Vite + TypeScript SPA (Vitest + React Testing Library + MSW for unit/component tests).
- **`backend/`** — Express + TypeScript API with a JSON datastore and injectable "chaos" behaviors (Jest tests).
- **`playwright-e2e/`** — the active Playwright E2E framework (`@playwright/test` ^1.58, TypeScript). Most agent/codegen work happens here.
- **`shared/types/`** — shared TypeScript type declarations for API/domain contracts.

## Tech stack & tooling
- E2E runner: Playwright Test. API calls: `axios` via `playwright-e2e/src/utils/api.util.ts` (default export `apiUtil`).
- Logging: `winston` (`src/core/logger`). Reporting: Allure. Network capture: `NetworkInterceptor` fixture.
- Base env: `BASE_URL` (frontend) and `API_BASE_URL` (backend) resolved in `src/config/env.config.ts`; env selected via `ENV`.
- **Chaos control**: the backend exposes `POST /api/test/config` (toggle chaos flags) and `POST /api/test/reset` (restore defaults). Always reset chaos state in a `finally`/`afterEach`.

## Repository map (`playwright-e2e/`)
- `src/pages/*.page.ts` — Page Object Model; base class `src/core/base/base.page.ts` (extends `CommonFunctions`).
- `src/tests/ui/**/*.spec.ts` — UI specs, grouped by area (`Checkout/`, `Profile/`, `A11y/`, `WebSockets/`, `Styling/`, `VisualRegression/`, `BookCatalog/`, `UserManagement/`, `Refresh/`).
- `src/tests/api/**/*.spec.ts` — API specs, grouped by area.
- `src/test-data/<ui|api>/<Area>/<SpecName>.json` — test data mirroring the spec path.
- `src/core/base/` — `base.page.ts`, `base.fixture.ts` (extended `test`), `failure-hook.ts` (writes failure artifacts).
- `src/utils/` — `api.util.ts`, `common.util.ts`, `auth.util.ts`, `dom-cleaner.ts`.
- `src/config/` — `playwright.config.ts`, `env.config.ts`.
- `scripts/save-snapshot.ts` — captures cleaned DOM + ARIA snapshots under `reports/snapshots/`.

## Global conventions (apply everywhere)
- **Indentation**: 2 spaces, spaces only — never tabs.
- **Signatures**: keep function/method parameters on a single line.
- **Locators** (priority): `getByRole` > `getByLabel`/`getByPlaceholder`/`getByTestId`/`getByText` > unique CSS/ID > **relative XPath (axes only)**. Relative XPath (e.g. `//label[text()='Username']/following-sibling::input`, using axes like `following-sibling`, `preceding-sibling`, `ancestor`) **is a sanctioned fallback** because this app ships intentional HTML anti-patterns and lacks stable `data-testid`s. **Absolute XPath (`/html/body/...`) is banned.**
- **No inline selectors in specs** — every locator is a private getter in a page object, placed above the action methods.
- **Interactions via `BasePage` wrappers** — always call `doClick`, `doEnterText`, `doGetText`, `doGetAttribute`, `mouseHover`, `doesElementExist`, etc. with a descriptive log message, never raw `locator.click()/fill()` inside page objects.
- **Assertions (soft-then-hard pattern)**: collect results with `commonFunctions.compareTwoValues(actual, expected, message)` (logs + `expect.soft`), then finish each test with a single consolidated hard assertion (e.g. `expect(isA && isB).toBeTruthy()`). Do not scatter many hard `expect` calls through the steps.
- **Waits**: replace static sleeps with deterministic conditions (`locator.waitFor`, `expect.poll`, `page.waitForResponse`, toast/status waiters).
- **Reuse before create**: prefer existing page objects, fixtures (`signUpPage`, `catalogPage`, `cartPage`, `checkoutPage`, `profilePage`, `notificationCenter`, `commonFunctions`, `networkInterceptor`), and utils before adding new ones.
- **Secrets**: never hardcode credentials; read them via `getLoginCredentials()` / `getRequiredEnv()` from `src/config/env.config.ts`.
- **Scope**: do not edit files unrelated to the task.

## Spec & test-data essentials
- UI specs import the extended `test` from `../../../core/base/base.fixture` and use `await test.step(...)` for meaningful business flows. API specs use native `test`/`expect` from `@playwright/test` because they do not require browser fixtures.
- Use human-readable, report-friendly step names in UI specs.
- Load test data from `src/test-data/<ui|api>/<Area>/<SpecName>.json` so the data path mirrors the spec path.

## Key commands (run from `playwright-e2e/`)
- Full suite: `npm test`.
- Focused run: `npx cross-env TZ=Australia/Adelaide npx playwright test <spec-path> --config=src/config/playwright.config.ts --workers=1`.
- Quality gate: `npm run finalize-spec -- <spec-path>` (checks only) or `npm run finalize-spec -- <spec-path> run` (checks + isolated test).
- Headless heal re-run: `npx cross-env HEADLESS=true npx playwright test <spec-path> --config=src/config/playwright.config.ts`.
- Reports: `npm run report` (Allure). Snapshots: `npm run save-snapshot -- <url> <page-name>`. Clean: `npm run clean-reports`.

## Safety
- Prefer local, reversible edits. Confirm before destructive actions (deleting files/branches, `git reset --hard`, force pushes).
- Do not create documentation markdown unless explicitly requested.
- On UI test failure, the `afterEach` hook auto-writes `reports/snapshots/failure-{context.json,dom.html,aria.yaml}` — use these before diagnosing selector drift.

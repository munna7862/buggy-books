# Playwright E2E Automation Framework

This repository contains a TypeScript-based Playwright automation framework for the BuggyBooks application. It supports UI, API, and end-to-end user journey validation with structured page objects, reusable fixtures, test data separation, network capture, logging, dynamic glob test discovery, tag-based execution (`@smoke`, `@regression`, `@chaos`, `@a11y`), and Allure reporting.

## Tech Stack

- Playwright Test with TypeScript
- Axios for API automation
- Page Object Model for UI automation
- Custom Playwright fixtures for reusable test setup
- Winston for framework logging
- Allure Playwright for execution reports
- dotenv for environment-driven configuration

## Application Under Test

| Layer | Default URL |
| --- | --- |
| UI | `https://buggy-books-fe.onrender.com/` |
| API | `https://buggy-books.onrender.com` |

These values are configurable through environment variables.

## Framework Structure

```text
playwright-e2e/
  src/
    config/
      env.config.ts
      playwright.config.ts
    core/
      base/
        base.fixture.ts
        base.page.ts
        base.test.ts
      logger/
        logger.ts
      network/
        network.interceptor.ts
    pages/
      cart.page.ts
      catalog.page.ts
      checkout.page.ts
      notification-center.component.ts
      profile.page.ts
      signup-login.page.ts
    test-data/
      api/
      ui/
    tests/
      api/
      ui/
    utils/
      api.util.ts
      auth.util.ts
      common.util.ts
  reports/
  logs/
  package.json
  tsconfig.json
```

## Key Capabilities

- Dynamic spec discovery (`testMatch: ['**/*.spec.ts']`) traversing UI and API suites.
- Tag-based execution filtering (`@smoke`, `@regression`, `@chaos`, `@a11y`) using Playwright's native `--grep` flag.
- Configurable action timeout architecture (`ELEMENT_TIMEOUT`, defaulting to 15,000ms).
- UI test automation for catalog, cart, checkout, registration, profile upload, and login flows.
- API test automation for books, registration, login, token refresh, inventory, and chaos endpoints.
- End-to-end checkout journey coverage.
- Reusable page actions through `BasePage`.
- Centralized test fixtures from `src/core/base/base.fixture.ts`.
- Test data stored separately as JSON under `src/test-data`.
- Automatic network capture for UI tests using `NetworkInterceptor`.
- Screenshots, videos, traces, and network logs retained on failures.
- HTML and Allure reporting.
- Centralized configuration through `env.config.ts`.

## Prerequisites

Install the following before running the framework:

- Node.js 18 or higher
- npm
- Google Chrome
- Java Runtime Environment, required only for Allure report generation

## Setup

From the `playwright-e2e` directory:

```bash
npm install
npx playwright install
```

The configured Playwright project uses the local Chrome channel:

```ts
channel: 'chrome'
```

Make sure Google Chrome is installed on the execution machine.

## Environment Configuration

Create a `.env` file inside `playwright-e2e/` when local overrides or credentials are required.

```env
ENV=INTEROP
BASE_URL=https://buggy-books-fe.onrender.com/
API_BASE_URL=https://buggy-books.onrender.com
ELEMENT_TIMEOUT=15000
HEADLESS=false
BROWSER=chrome
USER_NAME=your_existing_user
PASSWORD=your_password
```

Configuration defaults are defined in `src/config/env.config.ts`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `ENV` | Logical environment name used in reports | `INTEROP` |
| `BASE_URL` | BuggyBooks UI base URL | Render UI URL |
| `API_BASE_URL` | BuggyBooks API base URL | Render API URL |
| `ELEMENT_TIMEOUT`| Default action and locator timeout in ms | `15000` |
| `HEADLESS` | Runs browser in headless mode when `true` | `false` |
| `BROWSER` | Browser identifier for future extension | `chrome` |
| `USER_NAME` | Existing user for login and checkout tests | Required for login tests |
| `PASSWORD` | Password for existing user | Required for login tests |

## Running Tests

### Complete Test Suite (Dynamic Discovery)
Run all 26 UI and API specs:

```bash
npm test
```

### Tag-Based Execution Filtering

Run only Smoke tests:
```bash
npx playwright test --grep "@smoke" --config=src/config/playwright.config.ts
```

Run only Regression tests:
```bash
npx playwright test --grep "@regression" --config=src/config/playwright.config.ts
```

Run only Chaos & Resilience tests:
```bash
npx playwright test --grep "@chaos" --config=src/config/playwright.config.ts
```

Run only Accessibility (a11y) tests:
```bash
npx playwright test --grep "@a11y" --config=src/config/playwright.config.ts
```

### Specific Spec Execution
Run a specific spec file:

```bash
npx playwright test src/tests/api/BookCatalog/Test_001_BooksApi.spec.ts --config=src/config/playwright.config.ts
```

### Headless & Custom Timeout Execution
```bash
npx cross-env HEADLESS=true ELEMENT_TIMEOUT=20000 npm test
```

On Windows PowerShell:
```powershell
$env:HEADLESS="true"; $env:ELEMENT_TIMEOUT="20000"; npm test
```

## Reports and Artifacts

Playwright HTML report:

```bash
npx playwright show-report
```

Generate and open Allure report:

```bash
npm run report
```

Clean generated reports, logs, and test artifacts:

```bash
npm run clean-reports
```

Generated output:

| Path | Description |
| --- | --- |
| `playwright-report/` | Playwright HTML report |
| `reports/allure-results/` | Raw Allure results |
| `reports/allure-report/` | Generated Allure report |
| `reports/test-artifacts/` | Screenshots, videos, traces, and attachments |
| `logs/framework.log` | Framework execution logs |
| `logs/errors.log` | Error-level framework logs |

## Network Logging

UI tests that use the custom `test` fixture from `src/core/base/base.fixture.ts` automatically capture API network calls.

The network interceptor runs in `api-only` mode and captures:

- request URL, method, headers, and payload
- response status, headers, and body when available
- failed request details
- duration in milliseconds

Each test attaches a `network-log.json` artifact to the Playwright test output.

## Authentication Support

The framework includes `AuthUtility` for saving and reusing browser authentication state:

- `saveAuthState`
- `createContextWithSavedAuth`
- `authStateExists`
- `clearAuthState`

This enables hybrid API and UI authentication patterns where tests can avoid repeated UI login steps when a saved browser session is appropriate.

The current checkout and login flows read credentials using:

```ts
getLoginCredentials()
```

Credentials must be supplied through `USER_NAME` and `PASSWORD`.

## Test Data Strategy

Test data is stored as JSON and grouped by test layer and feature:

```text
src/test-data/
  api/
    BookCatalog/
    CartAndInventory/
    ChaosAndTesting/
    Logging/
    UserManagement/
  ui/
    A11y/
    BookCatalog/
    Checkout/
    Profile/
    Refresh/
    Styling/
    UserManagement/
    VisualRegression/
    WebSockets/
```

Keep static input data, expected messages, and reusable scenario values in JSON files. Keep test logic and assertions inside spec files.

## Page Object Strategy

Page classes live under `src/pages` and inherit common browser actions and dynamically configured timeouts from `BasePage`.

Use page objects for:

- locators
- page-level actions
- reusable UI workflows
- domain-specific UI behavior

Keep assertions in spec files unless the assertion is part of a reusable business operation.

## API Utility Strategy

`src/utils/api.util.ts` provides a reusable Axios wrapper through `makeRequest`.

It supports:

- `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`
- custom headers
- request payloads
- configurable timeout
- response type selection
- structured error responses
- request and response logging

## Coding Standards

- Use Playwright locators and web-first assertions where possible.
- Annotate all test cases with tags (`@smoke`, `@regression`, `@chaos`, `@a11y`).
- Keep tests readable with `test.step` for business-level flow clarity.
- Store test data outside specs.
- Add new page behavior to page objects instead of duplicating locator logic in tests.
- Keep environment-specific values out of source code.
- Prefer stable selectors over text or layout-dependent selectors.
- Use API setup where it improves test speed and reliability.
- Avoid making tests dependent on execution order unless the dependency is explicit and documented.

## Useful Commands

```bash
npm test
npm run report
npm run clean-reports
npx playwright show-report
npx playwright test --debug --config=src/config/playwright.config.ts
npx playwright test --ui --config=src/config/playwright.config.ts
```

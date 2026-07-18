# Playwright E2E Automation Framework

This repository contains a TypeScript-based Playwright automation framework for the BuggyBooks application. It supports UI, API, and end-to-end user journey validation with structured page objects, reusable fixtures, test data separation, network capture, logging, and Allure reporting.

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

- UI test automation for catalog, cart, checkout, registration, and login flows.
- API test automation for books, registration, and login endpoints.
- End-to-end checkout journey coverage.
- Reusable page actions through `BasePage`.
- Centralized test fixtures from `src/core/base/base.test.ts`.
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
HEADLESS=false
BROWSER=chrome
SUITENAME=Default
USER_NAME=your_existing_user
PASSWORD=your_password
```

Configuration defaults are defined in `src/config/env.config.ts`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `ENV` | Logical environment name used in reports | `INTEROP` |
| `BASE_URL` | BuggyBooks UI base URL | Render UI URL |
| `API_BASE_URL` | BuggyBooks API base URL | Render API URL |
| `HEADLESS` | Runs browser in headless mode when `true` | `false` |
| `BROWSER` | Browser identifier for future extension | `chrome` |
| `SUITENAME` | Optional suite file name | `Default` |
| `USER_NAME` | Existing user for login and checkout tests | Required for login tests |
| `PASSWORD` | Password for existing user | Required for login tests |

## Running Tests

Run the complete configured test set:

```bash
npm test
```

Run a specific spec file:

```bash
npx playwright test src/tests/api/Test_001_BooksApi.spec.ts --config=src/config/playwright.config.ts
```

Run a specific test by title:

```bash
npx playwright test --grep "Complete book purchase successfully" --config=src/config/playwright.config.ts
```

Run in headed mode:

```bash
HEADLESS=false npm test
```

On Windows PowerShell:

```powershell
$env:HEADLESS="false"; npm test
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

UI tests that use the custom `test` fixture from `src/core/base/base.test.ts` automatically capture API network calls.

The network interceptor currently runs in `api-only` mode and captures:

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

## Test Selection

`src/config/playwright.config.ts` controls which specs are loaded.

Current behavior:

- `USE_SPECIFIC_TESTS` is set to `true` in `env.config.ts`.
- The framework runs the explicitly listed UI and API specs from `playwright.config.ts`.
- If `USE_SPECIFIC_TESTS` is changed to `false`, the framework can load all specs or a named JSON suite.

Suite loading expects files under:

```text
src/tests/TestSuites/<SUITENAME>.json
```

Expected suite format:

```json
{
  "testFiles": [
    "**/src/tests/api/Test_001_BooksApi.spec.ts"
  ]
}
```

## Test Data Strategy

Test data is stored as JSON and grouped by test layer and feature:

```text
src/test-data/
  api/
  ui/
    BookCatalog/
    Checkout/
    UserManagement/
```

Keep static input data, expected messages, and reusable scenario values in JSON files. Keep test logic and assertions inside spec files.

## Page Object Strategy

Page classes live under `src/pages` and inherit common browser actions from `BasePage`.

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
- Keep tests readable with `test.step` for business-level flow clarity.
- Store test data outside specs.
- Add new page behavior to page objects instead of duplicating locator logic in tests.
- Keep environment-specific values out of source code.
- Prefer stable selectors over text or layout-dependent selectors.
- Use API setup where it improves test speed and reliability.
- Avoid making tests dependent on execution order unless the dependency is explicit and documented.

## Troubleshooting

| Issue | Likely Cause | Resolution |
| --- | --- | --- |
| Chrome project fails to start | Google Chrome is not installed | Install Chrome or change the Playwright project browser configuration |
| Login tests fail with missing variable error | `USER_NAME` or `PASSWORD` is not configured | Add credentials to `.env` or CI secrets |
| Allure command fails | Java or Allure CLI dependency is unavailable | Install Java and run `npm install` |
| Tests pass locally but fail in CI | Headed/browser dependency mismatch | Set `HEADLESS=true` and ensure browsers are installed in CI |
| No tests are discovered | Test selection pattern does not match files | Check `USE_SPECIFIC_TESTS`, `SUITENAME`, and `testMatch` |

## Useful Commands

```bash
npm test
npm run report
npm run clean-reports
npx playwright show-report
npx playwright test --debug --config=src/config/playwright.config.ts
npx playwright test --ui --config=src/config/playwright.config.ts
```

## Ownership Notes

This framework is designed as a maintainable SDET automation foundation, not just a collection of scripts. New tests should preserve the existing separation of concerns:

- Specs describe the test intent.
- Page objects encapsulate UI behavior.
- Utilities handle cross-cutting technical concerns.
- Test data remains externalized.
- Reports and logs provide enough evidence to debug failures quickly.

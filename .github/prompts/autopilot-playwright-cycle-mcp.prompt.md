---
description: "Strict live-first cycle: execute every workflow step via MCP before generating tests, then run and self-heal"
name: "Playwright Autopilot Cycle (MCP-first)"
argument-hint: "Base URL, environment, feature scope, and target path"
agent: "Playwright Autopilot Cycle"
model: "*"
---
Run a strict live-first Playwright cycle for this repository.

Inputs:
- Base URL: <https://...>
- Environment: <defaults from env.config.ts or .env>
- Feature scope: <area/workflow to cover>
- Acceptance criteria: <bulleted outcomes>
- Target path: <playwright-e2e/src/tests/...>
- Auth context: <how credentials/login should be handled via getLoginCredentials()>

Execution requirements:
- **DO NOT generate any test code from the scenario description alone.**
- Assume the Playwright MCP server is already running and connected — do NOT attempt to start, restart, or verify server startup. Use the available MCP browser tools directly.
- Execute every workflow step live in the browser FIRST:
  - Navigate to the app and complete authentication per Auth context.
  - For each step in the workflow, perform the action using MCP tools (browser_click, browser_fill_form, browser_select_option, etc.).
  - Take a live accessibility snapshot (browser_snapshot) and a screenshot (browser_take_screenshot) after each key action.
  - Build a locator map from live snapshots.
- **Locator Selection (Ranked by Preference)**:
  1. Role-based: `this.page.getByRole('button', { name: 'Submit' })`
  2. Data-testid: `this.page.locator('[data-testid="control"]')` (not common in production code of this app)
  3. getByLabel/Placeholder/Text
  4. CSS selectors (e.g. unique class names or IDs)
  5. **XPath (Fallback only)**: Use relative XPaths only (e.g. `this.page.locator("//label[text()='Username']/following-sibling::input")`). Utilize axes like `following-sibling`, `preceding-sibling`, `ancestor` to traverse layout anti-patterns. Absolutely no absolute XPaths (e.g. `/html/body/...`).
- **Page Object Encapsulation (MANDATORY)**:
  - Page objects must extend `BasePage` (imported from `../core/base/base.page`).
  - ALL locators must be private getters in page objects. Zero inline locators in test files.
  - Example Page Object structure:
    ```typescript
    import { BasePage } from '../core/base/base.page';
    import { Locator, Page } from '@playwright/test';

    export class ExamplePage extends BasePage {
      private get txtUsername(): Locator {
        return this.page.locator("//label[text()='Username']/following-sibling::input");
      }
      
      public async enterUsername(username: string): Promise<void> {
        await this.doEnterText(this.txtUsername, username, `Enter username: ${username}`);
      }
    }
    ```
  - Interaction logic must use the custom `BasePage` wrappers: `doClick`, `doEnterText`, `doGetText`, `doesElementExist`, etc., passing a descriptive log message.
  - Test specs must import `test` from the custom fixture `../../../core/base/base.fixture`.
  - Specs must only call public helper methods on the page object.
- Reuse existing fixtures/page objects/utilities and add minimal new APIs only when required.
- Run targeted tests with `--workers=1`:
  `npx cross-env TZ=Australia/Adelaide npx playwright test <target-spec-path> --config=src/config/playwright.config.ts --workers=1`
- Heal failing tests automatically (up to 3 focused fix/re-run iterations per spec).
- During each heal iteration, re-check impacted locators with live MCP snapshots before patching. Rerun tests headless:
  `npx cross-env HEADLESS=true npx playwright test <target-spec-path> --config=src/config/playwright.config.ts`
- Keep function and method parameters on a single line and use 2-space indentation (spaces: 2, no tabs).

Deliverables:
- Changed files.
- Commands executed.
- Test results before/after healing.
- Live locator evidence summary from snapshots (key controls and why selected).
- Remaining blockers (if any) and next best action.

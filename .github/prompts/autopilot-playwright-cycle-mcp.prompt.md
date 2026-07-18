---
description: "Strict live-first cycle: execute every workflow step via MCP before generating tests, then run and self-heal"
name: "Playwright Autopilot Cycle (MCP-first)"
argument-hint: "Base URL, environment, feature scope, and target path"
agent: "Playwright Autopilot Cycle"
model: "GPT-5 (copilot)"
---
Run a strict live-first Playwright cycle for this repository.

Inputs:
- Base URL: <https://...>
- Environment: <INTEROP | QA | PSR>
- Feature scope: <area/workflow to cover>
- Acceptance criteria: <bulleted outcomes>
- Target path: <playwright-e2e/src/tests/...>
- Auth context: <how login should be handled>

Execution requirements:
- **DO NOT generate any test code from the scenario description alone.**
- Assume the Playwright MCP server is already running and connected — do NOT attempt to start, restart, or verify server startup. Use the available MCP browser tools directly.
- Execute every workflow step live in the browser FIRST:
  - Navigate to the app and complete authentication per Auth context.
  - For each step in the workflow, perform the action using MCP tools (browser_click, browser_fill_form, browser_select_option, etc.).
  - Take a live accessibility snapshot (browser_snapshot) and a screenshot (browser_take_screenshot) after each key action.
  - Build a locator map from live snapshots — prefer data-testid, role/name, and aria-label selectors.
  - Do not rely on static code assumptions for any selector that can be confirmed in the live app.
- Only after ALL workflow steps are completed in the live browser, emit the Playwright TypeScript spec.
- **Locator Selection (Ranked by Preference)**:
  1. Role-based: `page.getByRole('button', { name: 'Submit' })`
  2. Data-testid: `page.locator('[data-testid="control"]')`
  3. getByLabel/Placeholder/Text
  4. CSS selectors (last resort)
  5. **NEVER use XPath** — unmaintainable and slow.
- **Page Object Encapsulation (MANDATORY)**:
  - ALL locators as private getters in page objects.
  - Zero inline locators in test files.
  - Each interaction → one public async method in page object.
  - Tests call page object methods only.
  - Example refactor:
    ```typescript
    // ❌ Wrong - inline locator in test
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // ✅ Correct - page object method
    await submitPage.clickSubmitButton();
    ```
- Reuse existing fixtures/page objects/utilities and add minimal new APIs only when required.
- Run targeted tests with `--workers=1`.
- Heal failing tests automatically (up to 3 focused fix/re-run iterations per spec).
- During each heal iteration, re-check impacted locators with live MCP snapshots before patching.
- Keep function and method parameters on a single line and use 2-space indentation (spaces: 2, no tabs).

Deliverables:
- Changed files.
- Commands executed.
- Test results before/after healing.
- Live locator evidence summary from snapshots (key controls and why selected).
- Remaining blockers (if any) and next best action.

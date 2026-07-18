---
description: "Autonomously explore app, generate Playwright tests, run and self-heal failures"
name: "Playwright Autopilot Cycle"
argument-hint: "Base URL, environment, feature scope, and target path"
agent: "Playwright Autopilot"
model: "*"
---
Run an autonomous Playwright cycle for this repository.

Inputs:
- Base URL: <https://...>
- Environment: <defaults from env.config.ts or .env>
- Feature scope: <area/workflow to cover>
- Acceptance criteria: <bulleted outcomes>
- Target path: <playwright-e2e/src/tests/...>
- Auth context: <how credentials/login should be handled via getLoginCredentials()>

Execution requirements:
- Assume the Playwright MCP server is already running and connected — do NOT attempt to start, restart, or verify server startup. Use the available MCP browser tools directly.
- Explore the workflow first using live app state (MCP required):
	- Navigate to the app and complete authentication per Auth context.
	- Take a live accessibility snapshot and at least one live DOM/evaluate snapshot for each key screen in scope.
	- Build a locator map from the live snapshots using this priority: role-based (`getByRole`) > data-testid > getByLabel/Placeholder/Text > CSS. Fallback to relative XPath only (with axes like `following-sibling`, `preceding-sibling`, etc. to locate elements from labels). Absolutely no absolute XPaths.
	- Do not rely only on static code assumptions when locator behavior can be validated in the live app.
- **Page Object Encapsulation (MANDATORY)**:
	- Page objects must extend `BasePage` (imported from `../core/base/base.page`).
	- ALL locators must be private getters in page objects — zero inline locators in tests.
	- Each UI control → one public async method in page object that encapsulates the locator and interaction logic using custom `BasePage` wrappers (`this.doClick`, `this.doEnterText`, `this.doGetText`, etc.) with descriptive log messages.
	- Tests must only call page object methods, never `page.locator()` or inline selectors.
	- Test specs must import `test` from the custom fixture `../../../core/base/base.fixture`.
	- When healing, verify locators are encapsulated in page objects before patching.
- Reuse existing fixtures/page objects/utilities and add minimal new APIs only when required.
- Generate or update focused specs under the target path.
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

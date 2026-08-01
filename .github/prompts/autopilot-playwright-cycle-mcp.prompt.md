---
description: "Strict live-first cycle: execute every workflow step via MCP before generating tests, then run and self-heal"
name: "Playwright Autopilot Cycle (MCP-first)"
argument-hint: "Base URL, environment, feature scope, and target path"
agent: "Playwright Autopilot Cycle"
model: ["Claude Sonnet 5 (copilot)", "Claude Sonnet 4.6 (copilot)", "GPT-5.5 (copilot)", "GPT-5 (copilot)"]
---
Run a strict live-first Playwright cycle for this repository.
Shared conventions live in `.github/copilot-instructions.md` and `.github/instructions/` — follow them; do not restate them.

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
- Build Page Objects, specs, and test data according to the shared and path-scoped instructions.
- Reuse existing fixtures/page objects/utilities and add minimal new APIs only when required.
- Run targeted tests with `--workers=1`:
  `npx cross-env TZ=Australia/Adelaide npx playwright test <target-spec-path> --config=src/config/playwright.config.ts --workers=1`
- Heal failing tests automatically (up to 3 focused fix/re-run iterations per spec).
- During each heal iteration, re-check impacted locators with live MCP snapshots before patching. Rerun tests headless:
  `npx cross-env HEADLESS=true npx playwright test <target-spec-path> --config=src/config/playwright.config.ts`

Deliverables:
- Changed files.
- Commands executed.
- Test results before/after healing.
- Live locator evidence summary from snapshots (key controls and why selected).
- Remaining blockers (if any) and next best action.

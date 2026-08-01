---
name: playwright-ai-assistant
description: >-
  Uses local DOM scraping, page snapshotting, and failure-capture hooks to automatically write Page Objects, generate E2E test specs, and self-heal locator failures in the Playwright repository.
---

# Playwright E2E AI Assistant Skill

## Overview
This skill provides core capabilities for generating Page Objects, writing E2E test specs, and self-healing locator failures in the BuggyBooks Playwright test suite.

> **Note on Conventions & Instructions:**
> Shared repository conventions live in [.github/copilot-instructions.md](../../../.github/copilot-instructions.md).
> Detailed domain rules auto-apply via path-scoped instruction files:
> - Page Objects: [.github/instructions/playwright-pom.instructions.md](../../../.github/instructions/playwright-pom.instructions.md)
> - UI Specs: [.github/instructions/playwright-specs.instructions.md](../../../.github/instructions/playwright-specs.instructions.md)
> - API Specs: [.github/instructions/playwright-api.instructions.md](../../../.github/instructions/playwright-api.instructions.md)
> - Advanced UI & Chaos: [.github/instructions/playwright-advanced-ui.instructions.md](../../../.github/instructions/playwright-advanced-ui.instructions.md)
> - Test Data: [.github/instructions/testdata.instructions.md](../../../.github/instructions/testdata.instructions.md)
> - Governance & DoD: [.github/instructions/workflow.instructions.md](../../../.github/instructions/workflow.instructions.md)

---

## Capabilities

### 1. Generating Page Object Models (POMs)
1. Capture clean DOM/ARIA snapshots using `scripts/save-snapshot.ts`:
   - Standard: `npm run save-snapshot -- <url> <page-name>`
   - Interactive (SSO/MFA): `npm run save-snapshot -- <url> <page-name> --interactive`
2. Read generated snapshots from `playwright-e2e/reports/snapshots/<page-name>.{html,yaml}`.
3. Draft Page Object extending `BasePage` (`src/core/base/base.page.ts`). Place private getters at the top and action methods calling `BasePage` wrappers (`doClick`, `doEnterText`, `doGetText`, etc.) with descriptive log messages.
4. Save file to `playwright-e2e/src/pages/<page-name>.page.ts`.

### 2. Generating E2E Test Specs (UI & API)
1. Inspect existing page objects and fixtures in `src/pages/` and `src/core/base/base.fixture.ts`.
2. UI specs import `test` from `../../../core/base/base.fixture`; API specs import native `test`/`expect` from `@playwright/test`.
3. Wrap flows in `await test.step(...)`. Use `commonFunctions.compareTwoValues(...)` for soft assertions, concluding with a consolidated hard assertion.
4. Mirror test data under `src/test-data/<ui|api>/<Area>/<SpecName>.json`.
5. Save spec to `src/tests/ui/<Area>/<SpecName>.spec.ts` or `src/tests/api/<Area>/<SpecName>.spec.ts`.

### 3. Self-Healing Broken Tests
1. Read failure artifacts written by `failure-hook.ts`:
   - `reports/snapshots/failure-context.json` (failing locator and traceback)
   - `reports/snapshots/failure-dom.html` (cleaned DOM at failure point)
   - `reports/snapshots/failure-aria.yaml` (accessibility tree at failure point)
2. Compare failing selector against updated element attributes in `failure-dom.html` / `failure-aria.yaml`.
3. Update the selector inside the corresponding Page Object private getter.
4. Rerun targeted spec in headless mode to confirm the fix:
   `npx cross-env HEADLESS=true npx playwright test <target-spec-path> --config=src/config/playwright.config.ts`













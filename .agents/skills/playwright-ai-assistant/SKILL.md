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
- **Encapsulation:** Never write raw selectors directly inside spec files. All selectors must be declared in POMs as private getters.
- **Indentation:** Use exactly 2 spaces for indentation (no tabs).
- **Single-Line Signatures:** Keep class methods and function parameter definitions on a single line.
- **Custom wrappers:** Always call custom base wrappers (`this.doClick`, `this.doEnterText`, `this.doGetText`) rather than native locator operations.

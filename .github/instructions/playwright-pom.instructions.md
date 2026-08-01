---
description: "Page Object Model architecture, BasePage wrapper usage, and relative-XPath fallback rules for Playwright page objects"
applyTo: "playwright-e2e/src/pages/**/*.ts"
---
# Page Object Model rules

These apply on top of the global conventions in `.github/copilot-instructions.md`.

## Structure & encapsulation
- Extend `BasePage` (imported from `../core/base/base.page`).
- Declare ALL locators as private getters returning `@playwright/test` `Locator` instances at the top of the class, before any action methods.
- Never write raw selectors directly inside test specs or inside action methods.

## Locator hierarchy
1. **Playwright recommended semantic locators:** `getByRole`, `getByPlaceholder`, `getByLabel`, `getByTestId`.
2. **Standard CSS/ID locators:** Unique `#element-id` or unique classes.
3. **Relative XPaths (Sanctioned Fallback):** Allowed using **XPath axes** (`following-sibling`, `preceding-sibling`, `ancestor`, etc.) to locate inputs from labels, because this app ships intentional HTML anti-patterns and lacks stable `data-testid` attributes.
4. **BANNED:** **Absolute XPaths** (e.g., `/html/body/...`) are strictly forbidden.

## Interaction methods
- Every interaction MUST use `BasePage` wrappers rather than native `locator.click()` / `locator.fill()`:
  - `this.doClick(locator, logMessage)`
  - `this.doEnterText(locator, value, logMessage)`
  - `this.doGetText(locator, logMessage)`
  - `this.doGetAttribute(locator, attribute, logMessage)`
  - `this.mouseHover(locator, logMessage)`
  - `this.clearAndSetInputValue(locator, value)`
  - `this.doesElementExist(locator, logMessage)`
- Atomic methods perform one action; composite methods orchestrate business flows by calling atomic methods.
- Keep function signatures on a single line with strong TypeScript return types (`Promise<void>`, `Promise<boolean>`, etc.).

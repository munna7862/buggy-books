---
description: "Advanced UI testing standards: chaos injection, native dialogs, file upload, a11y scans, WebSockets, computed CSS, dark/light mode, and visual regression"
applyTo: "playwright-e2e/src/tests/ui/**/*.spec.ts"
---
# Advanced UI & Chaos testing standards

These extend `playwright-specs.instructions.md`. Reach for these domain recipes when testing advanced UI behaviors, chaos scenarios, or real-time features.

## Native browser dialogs
- Set up a single-use dialog handler using `page.once('dialog', async dialog => { ... })` **before** executing the triggering action.
- Explicitly accept (`await dialog.accept()`) or dismiss (`await dialog.dismiss()`) and assert dialog message text.

## File upload automation
- Drive `<input type="file">` via encapsulated POM methods using `locator.setInputFiles(filePath)`.
- Generate temporary test files locally, verify HTTP response status codes, and reset chaos flags in a `finally` block.

## Accessibility (a11y) scan testing
- Import `AxeBuilder` from `@axe-core/playwright`.
- Normal mode (`injectA11yViolations: false`): Assert 0 violations exist.
- Chaos mode (`injectA11yViolations: true`): Target specific rules (`image-alt`, `label`, `color-contrast`) and assert expected violations are detected.

## WebSockets & resilience testing
- Verify connection status indicators (`#ws-status-dot` class `status-connected`), event stream dropdown updates, and toast alerts.
- Chaos testing: Inject `websocketDropRate: 1.0` via `POST /api/test/config`, assert disconnection/reconnecting status classes (`status-disconnected` / `status-reconnecting`), and ALWAYS reset `websocketDropRate: 0` in a `finally` block or `test.afterEach`.

## UI styling & layout testing
- **Encapsulation:** Put style-target locators in a Page Object private getter and expose typed methods that return counts/computed values. Specs must not call `page.locator(...)` directly.
- **Selector existence:** Use an encapsulated Page Object method that returns `locator.count()` and assert `count > 0`. Never assert visibility directly for selector-preservation checks.
- **Computed CSS:** Evaluate computed styles through Page Object methods (`locator.evaluate(el => getComputedStyle(el).propertyName)`). For root CSS variables, a typed Page Object method may evaluate `getComputedStyle(document.documentElement).getPropertyValue('--variable-name').trim()`.
- **Grid layout:** Verify responsive grids through an encapsulated computed-style method after resizing the viewport with `page.setViewportSize({ width, height })`.
- **Hover animations:** Trigger hover through the Page Object and use `expect.poll(...)` on the computed transform until it includes `"matrix"`; never wait a fixed transition duration.
- **Color schemes:** Emulate schemes using `page.emulateMedia({ colorScheme: 'dark' | 'light' })` before navigation, and assert exact HSL/RGB strings.

## Visual regression & layout chaos testing
- Establish baseline screenshot: `expect(page).toHaveScreenshot('filename.png', { maxDiffPixelRatio: 0.05 })`.
- Chaos mode: Assert mismatch with `expect(page).not.toHaveScreenshot(...)`.
- Verify style changes under layout chaos: `border-color`, `filter` (`blur(1.5px)`), `transform` displacement, `margin-left` shifts, `line-height` scaling.

## Chaos reset cleanup (Mandatory)
- ALWAYS invoke `POST /api/test/reset` in `test.afterEach` or `finally` blocks to restore default configurations so subsequent tests run on clean baselines.

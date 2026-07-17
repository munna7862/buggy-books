# ♿ Test Spec: Automated Accessibility (a11y) Violation Injector

This document outlines the test cases and the operational rationale for testing the **Automated Accessibility (a11y) Violation Injector** (Area 8 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

Accessibility compliance (WCAG 2.1 AA) is a standard requirement for enterprise applications. Automation teams use tools like **Axe Core** to verify that code changes do not introduce critical structural or visual barriers.

Currently, this repository features an **a11y chaos mode** (`injectA11yViolations`) to support QA teams:
1.  **Regression Benchmarking**: Allows SDETs to run scan audits against both standard (passing) and injected (failing) states.
2.  **Axe Test Validation**: Proves that the automation scanner pipeline is actively working (a scan must catch these injected errors!).
3.  **Dynamic Injector Elements**: Simulates common structural mistakes:
    *   *Missing Alt Tags*: Covers lose image context.
    *   *Orphaned Input Labels*: Strips label connection IDs.
    *   *Contrast Failures*: Sets text color contrast ratios close to 1:1.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **A11Y_01** | Standard Accessibility Compliance | Verify that when `injectA11yViolations` is `false`, the book catalog, login screen, and checkout step forms pass Axe scans with zero violations. | Smoke |
| **A11Y_02** | Image Alternative Text Scan Failure | Enable `injectA11yViolations: true`. Scan the Book Catalog. Assert that Axe detects `image-alt` failures on catalog images. | Regression |
| **A11Y_03** | Orphaned Form Label Scan Failure | Enable `injectA11yViolations: true`. Scan the Login page. Assert that Axe detects `label` (orphaned labels without htmlFor-id link) violations. | Regression |
| **A11Y_04** | Text Color Contrast Scan Failure | Enable `injectA11yViolations: true`. Scan the Catalog summary text. Assert that Axe flags a color contrast ratio regression on the books count tag. | Regression |

---

## 🛠️ Implementation Guide: Writing the Axe-Core Playwright Scan

Below is a complete implementation showing how you can integrate **`@axe-core/playwright`** into your automation workspace to verify both accessible states and injected violations.

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated Accessibility (a11y) Scan Integration', () => {
  const BASE_API_URL = 'http://localhost:4000/api';
  const UI_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    // Reset chaos configuration before each test
    const request = page.context().request;
    await request.post(`${BASE_API_URL}/test/reset`);
  });

  test('A11Y_01: Verify application passes accessibility scan by default', async ({ page }) => {
    await page.goto(`${UI_URL}/`);
    await page.waitForSelector('.catalog-book-cover');

    // Run Axe scan on the Catalog page
    const results = await new AxeBuilder({ page }).analyze();

    // Assert that there are no critical accessibility violations
    expect(results.violations).toEqual([]);
  });

  test('A11Y_02: Verify dynamic image alt violations are captured when chaos is enabled', async ({ page }) => {
    // 1. Enable accessibility violations via API
    const request = page.context().request;
    await request.post(`${BASE_API_URL}/test/config`, {
      data: { injectA11yViolations: true }
    });

    // 2. Go to Catalog and scan
    await page.goto(`${UI_URL}/`);
    await page.waitForSelector('.catalog-book-cover');

    // Run Axe scan targeting images only
    const results = await new AxeBuilder({ page })
      .include('.catalog-book-cover')
      .analyze();

    // Assert that Axe correctly caught the missing alt attribute regression
    const altViolation = results.violations.find(v => v.id === 'image-alt');
    expect(altViolation).toBeDefined();
    expect(altViolation?.nodes.length).toBeGreaterThan(0);
  });

  test('A11Y_03: Verify orphaned form labels are captured on login fields when chaos is enabled', async ({ page }) => {
    // 1. Enable accessibility violations via API
    const request = page.context().request;
    await request.post(`${BASE_API_URL}/test/config`, {
      data: { injectA11yViolations: true }
    });

    // 2. Go to Login page
    await page.goto(`${UI_URL}/login`);
    await page.waitForSelector('.auth-form');

    // Run Axe scan targeting form fields
    const results = await new AxeBuilder({ page })
      .include('.auth-form')
      .analyze();

    // Assert that Axe caught the label association violation
    const labelViolation = results.violations.find(v => v.id === 'label');
    expect(labelViolation).toBeDefined();
    expect(labelViolation?.nodes.length).toBeGreaterThan(0);
  });
});
```

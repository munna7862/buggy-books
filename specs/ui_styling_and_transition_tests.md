# 📝 Test Spec: Modern UI Styling, Transitions, and Design System

This document outlines the test cases and the operational rationale for testing the **Modern UI Styling, Transitions, and Sleek Dark Mode** (Area 3 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

In modern web application testing, checking simple functional happy paths (like "does the button click") is no longer sufficient. Designing visual testing scenarios and verifying the styling system ensures visual quality, prevents layout breaking across viewport sizes, and checks the fidelity of animations.

### 1. The Operational & Design Rationale
*   **Visual Trust**: A premium, responsive interface (using HSL color schemes, glassmorphism layers, and grid structures) establishes high credibility with users.
*   **Micro-animations**: Hover indicators, smooth scaling, and loading state transitions improve engagement by giving immediate visual feedback for interactive elements.

### 2. The QA & Test Automation Rationale (SDET Benefits)
*   **Refactor Stability (Regression Testing)**: Changing structural tags (e.g. replacing tables with divs) is a common task in frontend development. Asserting that custom CSS classes and element IDs are retained ensures that existing end-to-end (E2E) automated selector pipelines do not break.
*   **Visual Regression Assertions**: Automated visual testing tools (like Playwright Screenshots, Applitools, or Percy) compare baseline snapshots against test executions. Documenting these cases helps testers understand how viewport scaling and dark mode affect visual validation.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **UI_STYLE_01** | Retained Automation Selectors | Search and list books. Assert that all legacy automation classnames and element IDs exist on the new semantic `div` nodes. | Smoke |
| **UI_STYLE_02** | Catalog Grid Layout Responsiveness | Emulate desktop, tablet, and mobile viewports. Verify that cards align to their correct grid patterns (`repeat(auto-fill, minmax(280px, 1fr))`). | Regression |
| **UI_STYLE_03** | Hover Animation CSS Verification | Trigger a hover state on a book card. Assert that the scale and transform styles are applied to the cover image. | Regression |
| **UI_STYLE_04** | HSL CSS Variable Theme Verification | Emulate light and dark mode preferences. Assert that root variables (like `--bg` and `--card-bg`) resolve to their correct HSL values. | Regression |

---

## 🛠️ Implementation Guide: Writing the Automation Assertions

Below is an example of how you can write these assertions using **Playwright** in your automation repository.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Modern UI Layout & Styling Assertions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('UI_STYLE_01: Verify all legacy test selectors exist', async ({ page }) => {
    // 1. Assert card container exists
    const card = page.locator('.complex-item-box-alpha').first();
    await expect(card).toBeVisible();

    // 2. Assert inner columns exist and retain exact legacy class names
    const imageCell = card.locator('.image-cell-omega');
    const infoCell = card.locator('.info-cell-beta');
    await expect(imageCell).toBeVisible();
    await expect(infoCell).toBeVisible();

    // 3. Assert title, author, price tags and buttons are visible
    await expect(card.locator('.title-variant-2')).toBeVisible();
    await expect(card.locator('.author-meta-tag')).toBeVisible();
    await expect(card.locator('.price-tag-value')).toBeVisible();
    await expect(card.locator('.action-btn-primary.dynamic-l1')).toBeVisible();
  });

  test('UI_STYLE_02: Verify card layout grid columns', async ({ page }) => {
    const grid = page.locator('.layout-wrapper-xyz987');
    await expect(grid).toBeVisible();

    // Verify grid CSS properties are set correctly
    const displayMode = await grid.evaluate(el => window.getComputedStyle(el).display);
    expect(displayMode).toBe('grid');
  });

  test('UI_STYLE_03: Verify cover scale transition on card hover', async ({ page }) => {
    const card = page.locator('.complex-item-box-alpha').first();
    const coverImage = card.locator('.catalog-book-cover');

    // 1. Get initial transform scale
    const beforeHover = await coverImage.evaluate(el => window.getComputedStyle(el).transform);

    // 2. Hover over the card
    await card.hover();
    await page.waitForTimeout(300); // Allow transition ease-out time

    // 3. Assert transform scale changes (indicating zoom effect)
    const afterHover = await coverImage.evaluate(el => window.getComputedStyle(el).transform);
    expect(beforeHover).not.toBe(afterHover);
  });

  test('UI_STYLE_04: Verify HSL design system theme variables', async ({ page }) => {
    // Check that core HSL variables are active on root
    const rootBg = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    });
    expect(rootBg).toContain('hsl');
  });
});
```

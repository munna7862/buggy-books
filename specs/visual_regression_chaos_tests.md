# 📝 Test Spec: Visual Regression Chaos Injector

This document outlines the test cases and operational rationale for testing the **Visual Regression Chaos Injector** (Area 9 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

Visual regression testing is an advanced automation discipline where pixel-level screenshots of the UI are compared against approved baselines. When visual defects occur (misaligned buttons, skewed text, blurred images), these tools produce a diff highlighting the exact changed region. BuggyBooks introduces deliberate, configurable visual defects that allow SDETs to practice:

1. **Baseline Capture**: Understanding that visual tests require a clean, approved baseline before defects are introduced.
2. **Snapshot Comparison**: Validating pixel-level differences when chaos is enabled against the baseline.
3. **CSS Property Assertion**: Using automation APIs to directly inspect computed CSS property values (margin, transform, filter) to assert layout changes without relying solely on screenshot diffs.
4. **State Restoration**: Verifying the UI returns to a pixel-perfect baseline after chaos is reset.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **VIS_REG_01** | Baseline Catalog Screenshot | Navigate to `/`. Capture a screenshot when `visualChaos` is `false`. Assert screenshot matches the approved baseline file. | Smoke |
| **VIS_REG_02** | Chaos-Enabled Catalog Pixel Diff | Enable `visualChaos` via API. Navigate to `/`. Capture screenshot and compare with baseline — assert significant pixel difference exists (diff > 0). | Regression |
| **VIS_REG_03** | Book Card Border Color Assertion | Enable chaos. Query `.complex-item-box-alpha` and assert `border-color` computed style equals `rgb(242, 36, 36)` (hsl 0°, 85%, 60%). | Regression |
| **VIS_REG_04** | Book Cover Blur Filter Assertion | Enable chaos. Query `.catalog-book-cover` and assert `filter` computed style includes `blur(1.5px)`. | Regression |
| **VIS_REG_05** | Search Bar Displacement Assertion | Enable chaos. Query `.catalog-search-form` and assert `transform` includes `translateX(-18px)`. | Regression |
| **VIS_REG_06** | Price Tag Rotation Assertion | Enable chaos. Query `.price-tag-value` and assert `transform` includes `rotate(-3deg)`. | Regression |
| **VIS_REG_07** | Checkout Button Margin Shift | Navigate to `/checkout`, enable chaos. Query `.submit-action-btn.primary-x2` and assert `marginLeft` computed value is `15px`. | Regression |
| **VIS_REG_08** | Book Card Text Line Height Chaos | Enable chaos. Query `.info-cell-beta h3` and assert `lineHeight` computed value reflects `3.2` multiplier. | Regression |
| **VIS_REG_09** | Reset Restores Visual Baseline | After enabling chaos and capturing diff screenshot, call `POST /api/test/reset`. Re-capture screenshot. Assert it matches original baseline (pixel diff returns to 0). | E2E |
| **API_VIS_01** | Toggle visualChaos Config via API | `POST /api/test/config` with `{ "visualChaos": true }`. Assert 200 and `config.visualChaos === true`. | Smoke |
| **API_VIS_02** | Default visualChaos is False | `GET /api/test/config` after reset. Assert `visualChaos === false`. | Smoke |
| **API_VIS_03** | Invalid Type Rejected | `POST /api/test/config` with `{ "visualChaos": "yes" }`. Assert 400 and validation error in body. | Regression |
| **API_VIS_04** | Combine with Other Chaos Params | Set `{ "visualChaos": true, "checkoutFailureRate": 0.5 }` in one request. Assert both fields are saved correctly. | Regression |

---

## 🧪 Sample Playwright Test Code

Below is an example of how you can write visual chaos assertions using **Playwright** in your automation repository.

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4000/api';

test.describe('Visual Regression Chaos Injector', () => {
  test.beforeEach(async ({ request }) => {
    // Reset all chaos state before each test
    await request.post(`${API_URL}/test/reset`);
  });

  test('VIS_REG_01 — Baseline catalog matches snapshot', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('.complex-item-box-alpha');
    await expect(page).toHaveScreenshot('catalog-baseline.png');
  });

  test('VIS_REG_03 — Book card border turns reddish with visual chaos', async ({ page, request }) => {
    // Enable visual chaos
    await request.post(`${API_URL}/test/config`, {
      data: { visualChaos: true }
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('.complex-item-box-alpha');

    // Wait for chaos polling to update the body class (max 4 seconds)
    await page.waitForFunction(() =>
      document.body.classList.contains('visual-chaos-active')
    );

    // Assert computed border color
    const borderColor = await page.locator('.complex-item-box-alpha').first().evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });
    expect(borderColor).toBe('rgb(242, 36, 36)');
  });

  test('VIS_REG_04 — Book covers are blurred with visual chaos', async ({ page, request }) => {
    await request.post(`${API_URL}/test/config`, { data: { visualChaos: true } });
    await page.goto(BASE_URL);
    await page.waitForFunction(() => document.body.classList.contains('visual-chaos-active'));

    const filter = await page.locator('.catalog-book-cover').first().evaluate((el) => {
      return window.getComputedStyle(el).filter;
    });
    expect(filter).toContain('blur');
  });

  test('VIS_REG_07 — Checkout button shifts 15px right with visual chaos', async ({ page, request }) => {
    await request.post(`${API_URL}/test/config`, { data: { visualChaos: true } });
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForFunction(() => document.body.classList.contains('visual-chaos-active'));

    const marginLeft = await page.locator('.submit-action-btn.primary-x2').evaluate((el) => {
      return window.getComputedStyle(el).marginLeft;
    });
    expect(marginLeft).toBe('15px');
  });

  test('VIS_REG_09 — Reset restores visual baseline', async ({ page, request }) => {
    // Enable chaos
    await request.post(`${API_URL}/test/config`, { data: { visualChaos: true } });
    await page.goto(BASE_URL);
    await page.waitForFunction(() => document.body.classList.contains('visual-chaos-active'));

    // Reset chaos
    await request.post(`${API_URL}/test/reset`);

    // Wait for polling to remove class
    await page.waitForFunction(() =>
      !document.body.classList.contains('visual-chaos-active')
    );

    // Baseline should now match
    await expect(page).toHaveScreenshot('catalog-baseline.png');
  });

  test('API_VIS_01 — Toggle visualChaos via config API', async ({ request }) => {
    const res = await request.post(`${API_URL}/test/config`, {
      data: { visualChaos: true }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.config.visualChaos).toBe(true);
  });

  test('API_VIS_03 — Invalid type rejected by config API', async ({ request }) => {
    const res = await request.post(`${API_URL}/test/config`, {
      data: { visualChaos: 'yes' }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Validation failed');
  });
});
```

---

## 🔄 Chaos Reset Instructions

After completing visual regression test runs, always restore the application to a clean state:

```bash
curl -X POST http://localhost:4000/api/test/reset
```

Or via Playwright `request` fixture as shown in `VIS_REG_09` above. Verify the `visual-chaos-active` class is absent from `document.body` before capturing post-reset screenshots.

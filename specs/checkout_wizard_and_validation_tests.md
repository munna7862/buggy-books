# 📝 Test Spec: Multi-Step Checkout & Validation Wizard

This document outlines the test cases and the operational rationale for testing the **Multi-Step Checkout & Validation Wizard** (Area 6 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

Multi-step checkout forms are extremely common in e-commerce websites. Testing them goes beyond simple "click-to-submit" validations. It requires simulating complex user interactions:
1.  **Linear Progression & Stepper Verification**: Verifying that active CSS classes dynamically shift from step to step, keeping the user oriented.
2.  **Step-Level Form Validation**: Ensuring validation blocks transition until data is sanitized (e.g. valid expiry dates or exactly 16-digit cards).
3.  **Dirty State/Unsaved Navigation Interception**: Preventing data loss by displaying alert confirmations when users navigate away with partially filled forms. This requires automation scripts to hook into native browser alert boxes.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **UI_WIZ_01** | Stepper Transition Validation | Complete Step 1 shipping, click Next. Verify `step-indicator-2` is active, shipping inputs are hidden, and payment inputs appear. | Smoke |
| **UI_WIZ_02** | Validation Messaging Validation | Submit blank fields on Step 1, and invalid inputs on Step 2. Verify all inline error message nodes become visible with exact error texts. | Regression |
| **UI_WIZ_03** | Wizard Back Step History preservation | Go to Step 2, type in card inputs, click Back. Click Next. Assert card inputs are preserved and error banners are cleared. | Regression |
| **UI_WIZ_04** | Dirty Navigation Alert Dialog | Fill First Name input. Click "Catalog" link in the navbar. Assert that a native browser `confirm` dialog is triggered, and navigation is blocked unless accepted. | Critical |

---

## 🛠️ Implementation Guide: Writing the Automation Assertions

Below is an example of how you can write these assertions using **Playwright** in your automation repository.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Multi-Step Checkout Stepper & Alert Interception', () => {
  const UI_URL = 'http://localhost:5173/checkout';

  test.beforeEach(async ({ page }) => {
    await page.goto(UI_URL);
  });

  test('UI_WIZ_01: Verify step active indicator shifting', async ({ page }) => {
    // 1. Initially Step 1 is active, Step 2 is inactive
    await expect(page.locator('#step-indicator-1')).toHaveClass(/step-active/);
    await expect(page.locator('#step-indicator-2')).not.toHaveClass(/step-active/);

    // 2. Fill Step 1 valid details
    await page.fill('input[name="txt_f1"]', 'Jane');
    await page.fill('input[name="txt_f2"]', 'Smith');
    await page.fill('input[name="txt_addr_12"]', '555 Testing Blvd');
    await page.fill('input[name="txt_city_34"]', 'Auckland');

    // 3. Click Next Step
    await page.click('#wizard-next-btn');

    // 4. Assert Step 2 is now active
    await expect(page.locator('#step-indicator-1')).toHaveClass(/step-completed/);
    await expect(page.locator('#step-indicator-2')).toHaveClass(/step-active/);
  });

  test('UI_WIZ_02: Verify inline validation blocks step transitions', async ({ page }) => {
    // 1. Try to go to Step 2 with blank values
    await page.click('#wizard-next-btn');

    // 2. Assert error text visible
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Address must be at least 5 characters')).toBeVisible();
  });

  test('UI_WIZ_04: Verify unsaved changes block navigation via confirm dialog', async ({ page }) => {
    // 1. Fill an input to make form dirty
    await page.fill('input[name="txt_f1"]', 'Jane');

    // 2. Setup a listener for dialog alerts
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('You have unsaved changes');
      dialogTriggered = true;
      await dialog.dismiss(); // Cancel leaving
    });

    // 3. Click "Catalog" link in the navbar
    await page.click('text=Catalog');

    // 4. Assert dialog was fired, and we are STILL on checkout
    expect(dialogTriggered).toBe(true);
    expect(page.url()).toContain('/checkout');

    // 5. Override listener to ACCEPT leaving this time
    page.removeAllListeners('dialog');
    page.on('dialog', async (dialog) => {
      await dialog.accept(); // Confirms leaving
    });

    // 6. Click Catalog again
    await page.click('text=Catalog');

    // 7. Assert navigation successfully proceeded to catalog page
    await expect(page).toHaveURL(/localhost:5173\/?$/);
  });
});
```

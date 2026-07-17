# 📝 Test Spec: File Upload Target Endpoint and Form

This document outlines the test cases and the operational rationale for testing the **File Upload Target Endpoint and Form** (Area 7 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

Uploading files (like profile photos, documents, or attachments) is a critical feature in many modern web applications. From a QA and automation perspective, it represents a complex target because:
1.  **Multipart Payloads**: File uploads use `multipart/form-data` encoding, requiring automated E2E tests to manipulate native OS file dialog inputs or programmatically inject streams.
2.  **Size & Format Constraints**: Upload endpoints have strict file filters (e.g. whitelists for extensions, size boundaries). Automated suites must verify that error messages and status codes are gracefully handled and shown.
3.  **Upload Chaos Testing**: Network drops and file storage exceptions happen in production. Introducing configurable failure rates (`uploadFailureRate`) trains SDETs to build resilient forms that show friendly recovery states.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **UI_UPL_01** | Valid Profile Picture Upload | Choose a valid PNG/JPEG image under 2MB. Click Upload. Assert that the preview image source points to the new path, and a success message renders. | Smoke |
| **UI_UPL_02** | File Extension Filter Validation | Choose an invalid file format (e.g. `document.txt` or `photo.gif`). Assert that the upload fails with `400` and display warning element. | Smoke |
| **UI_UPL_03** | File Size Limit Validation | Choose an image file larger than 2MB. Assert that the upload fails with `400` and displays a file size limit warning. | Smoke |
| **UI_UPL_04** | Upload Chaos Failure Recovery | Configure `uploadFailureRate: 1.0` via chaos config. Submit a valid file. Assert that status code `500` is returned, and an error banner displays. | Regression |
| **UI_UPL_05** | Unauthorized Session Check | Attempt upload without cookie tokens. Assert that status code `401` is returned. | Regression |

---

## 🛠️ Implementation Guide: Writing the Automation Assertions

Below is an example of how you can write these assertions using **Playwright** in your automation repository.

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Profile Avatar File Upload Verification', () => {
  const BASE_URL = 'http://localhost:4000/api';
  const UI_URL = 'http://localhost:5173';

  // Paths to temporary file fixtures
  const validImage = path.resolve(__dirname, 'valid-avatar.png');
  const invalidTxt = path.resolve(__dirname, 'invalid-doc.txt');
  const largeImage = path.resolve(__dirname, 'large-avatar.png');

  test.beforeAll(() => {
    // Write test file fixtures
    fs.writeFileSync(validImage, 'mock-png-bytes-data');
    fs.writeFileSync(invalidTxt, 'mock-txt-bytes-data');
    
    // 2.2MB large file to exceed limits
    const buffer = Buffer.alloc(2.2 * 1024 * 1024);
    fs.writeFileSync(largeImage, buffer);
  });

  test.afterAll(() => {
    // Cleanup temporary files
    if (fs.existsSync(validImage)) fs.unlinkSync(validImage);
    if (fs.existsSync(invalidTxt)) fs.unlinkSync(invalidTxt);
    if (fs.existsSync(largeImage)) fs.unlinkSync(largeImage);
  });

  test.beforeEach(async ({ page }) => {
    // Reset chaos configuration
    const request = page.context().request;
    await request.post(`${BASE_URL}/test/reset`);

    // Log in and go to Profile page
    await page.goto(`${UI_URL}/login`);
    await page.fill('input[name="txt_usr_77"]', 'admin');
    await page.fill('input[name="txt_pwd_78"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto(`${UI_URL}/profile`);
  });

  test('UI_UPL_01: Verify valid photo upload and preview update', async ({ page }) => {
    // 1. Locate file input
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#profile-avatar-input');
    const fileChooser = await fileChooserPromise;
    
    // 2. Select file
    await fileChooser.setFiles(validImage);

    // 3. Click Upload Button
    await page.click('#profile-upload-btn');

    // 4. Assert success message and status update
    await expect(page.locator('#upload-status')).toHaveText('Upload successful!');
    
    // 5. Assert avatar preview source changes from default
    const avatarImg = page.locator('#profile-avatar-preview');
    await expect(avatarImg).toHaveAttribute('src', /\/uploads\/admin-/);
  });

  test('UI_UPL_02: Verify file extension validation blocks uploads', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#profile-avatar-input');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(invalidTxt);

    await page.click('#profile-upload-btn');

    // Assert format error text is displayed
    const errorText = page.locator('#upload-error');
    await expect(errorText).toContainText('Only JPEG, JPG, and PNG images are allowed');
  });

  test('UI_UPL_03: Verify file size limit blocks uploads', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#profile-avatar-input');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(largeImage);

    await page.click('#profile-upload-btn');

    // Assert size limit error text is displayed
    const errorText = page.locator('#upload-error');
    await expect(errorText).toContainText('File size exceeds the 2MB limit');
  });
});
```

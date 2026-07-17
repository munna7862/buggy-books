# 📝 Test Spec: JWT Expiration & Token Refresh Automation Challenge

This document outlines the test cases and the operational rationale for testing the **JWT Expiration & Token Refresh Automation Challenge** (Area 4 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

In modern web development, authenticating via stateless JSON Web Tokens (JWT) is standard practice. To limit exposure when tokens are intercepted, access tokens are designed to have short expiration times (e.g. 5–15 minutes), while a long-lived refresh token is used to issue new access tokens silently without prompting the user for credentials.

Testing this lifecycle is a critical skill for SDETs because it involves:
*   **Asynchronous Retries**: Handling intermittent 401s transparently in the API client and retrying the original HTTP request before returning control to the caller.
*   **Emulated Expirations (Chaos Injection)**: Injecting short expiration intervals programmatically so that test suites can verify refresh flows dynamically without waiting minutes or hours for standard timeouts.
*   **Cookie Security Assertions**: Verifying that `token` and `refreshToken` cookies are configured with security flags (`httpOnly`, `SameSite=Strict/Lax`, `secure`).

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **API_REF_01** | Dynamic Access Token Expiry | Inject `jwtExpirySeconds: 2` via chaos configuration. Request a protected route after 3 seconds. Verify `403 Forbidden` response is returned. | Smoke |
| **API_REF_02** | Refresh Token Issuance | Login. Verify that both access `token` and `refreshToken` cookies are returned with `httpOnly` flags set. | Smoke |
| **API_REF_03** | Silent Token Refresh | Request `/api/auth/refresh` using the `refreshToken` cookie. Verify status is `200` and a new `token` cookie is returned. | Regression |
| **UI_REF_01** | Transparent Client Request Retry | Set access token to expire in 2 seconds. Trigger an action in the UI (e.g. Add to Cart) after 3 seconds. Verify the action completes successfully (the API client silently refreshed the token and retried the request). | Regression |
| **UI_REF_02** | Session Expiry Redirection | Set access and refresh tokens to be invalid/expired. Trigger any UI action. Verify that the user is logged out and redirected to `/login`. | Smoke |

---

## 🛠️ Implementation Guide: Writing the Automation Assertions

Below is an example of how you can write these assertions using **Playwright** in your automation repository.

```typescript
import { test, expect } from '@playwright/test';

test.describe('JWT Expiration & Silent Refresh E2E Verification', () => {
  const BASE_URL = 'http://localhost:4000/api';
  const UI_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    // Reset chaos configuration
    const context = page.context();
    const request = context.request;
    await request.post(`${BASE_URL}/test/reset`);
  });

  test('API_REF_01: Verify access token expiration block', async ({ page }) => {
    const request = page.context().request;

    // 1. Configure access token to expire in 2 seconds
    await request.post(`${BASE_URL}/test/config`, {
      data: { jwtExpirySeconds: 2 }
    });

    // 2. Login to get cookies
    const loginRes = await request.post(`${BASE_URL}/login`, {
      data: { username: 'admin', password: 'password123' }
    });
    expect(loginRes.status()).toBe(200);

    // 3. Wait 3 seconds for token to expire
    await page.waitForTimeout(3000);

    // 4. Hit a protected route (e.g., cart) with the expired token
    const cartRes = await request.get(`${BASE_URL}/cart`);
    
    // Express returns 403 Forbidden because of the expired/invalid access token type
    expect(cartRes.status()).toBe(403);
  });

  test('UI_REF_01: Verify transparent client refresh & retry', async ({ page }) => {
    // 1. Configure token to expire in 2 seconds
    const request = page.context().request;
    await request.post(`${BASE_URL}/test/config`, {
      data: { jwtExpirySeconds: 2 }
    });

    // 2. Open page and login
    await page.goto(`${UI_URL}/login`);
    await page.fill('input[name="txt_usr_77"]', 'admin');
    await page.fill('input[name="txt_pwd_78"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify redirect to catalog
    await expect(page.locator('text=Book Catalog')).toBeVisible();

    // 3. Wait 3 seconds so the access token expires
    await page.waitForTimeout(3000);

    // 4. Try to add a book to the cart. 
    // The fetch request will return a 401, trigger the silent /auth/refresh, 
    // obtain a new access token, and transparently retry the add-to-cart request.
    const firstAddBtn = page.locator('.complex-item-box-alpha button').first();
    await firstAddBtn.click();

    // 5. Verify the toast notification shows success (proving retry worked!)
    await expect(page.locator('text=Added to cart!')).toBeVisible();
  });
});
```

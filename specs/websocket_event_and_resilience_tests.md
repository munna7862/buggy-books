# 📝 Test Spec: Real-Time Event System via WebSockets

This document outlines the test cases and the operational rationale for testing the **Real-Time Event System via WebSockets** (Area 5 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

Real-time notifications, stock alerts, and flash sale updates are core experiences in modern e-commerce websites. Unlike static REST APIs, WebSockets maintain persistent duplex connections. Testing WebSocket integrations is a highly valued SDET skill because connection states are dynamic and flaky network conditions must be handled resiliently.

Testing WebSockets involves asserting:
1.  **State Synchronizations**: Verifying that client connection indicators (green/yellow/red dots) accurately map to connection state hooks.
2.  **Schema and Payload Correctness**: Confirming that event bodies (like purchases, stock alerts, and views) conform to specified structures.
3.  **Connection Resilience**: Assuring that when the server drops the connection (chaos testing), the client automatically triggers reconnect timers and restores state without requiring page reload.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **WS_CONN_01** | WebSocket State Indicator | Open page. Assert that `ws-status-dot` is present and contains the class `status-connected` (indicating successful handshakes). | Smoke |
| **WS_EVENT_01** | Broadcasted Event Reception | Click the bell button to open the dropdown. Assert that mock bookstore events (e.g. view, purchase, sale) populate the list inside the dropdown. | Smoke |
| **WS_EVENT_02** | Hot-Toast Alert Trigger | Listen for incoming events. Assert that if the event type is `purchase` or `sale`, a toast notification banner is rendered. | Regression |
| **WS_RESIL_01** | Automatic Connection Recovery | Configure `websocketDropRate: 1.0` via chaos config. Verify that when disconnected, the client changes state to `status-reconnecting` or `status-disconnected`, and attempts auto-reconnection. | Critical |

---

## 🛠️ Implementation Guide: Writing the Automation Assertions

Below is an example of how you can write these assertions using **Playwright** in your automation repository.

```typescript
import { test, expect } from '@playwright/test';

test.describe('WebSocket Real-Time Notifications & Resilience', () => {
  const BASE_URL = 'http://localhost:4000/api';
  const UI_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    // Reset configuration
    const request = page.context().request;
    await request.post(`${BASE_URL}/test/reset`);
  });

  test('WS_CONN_01: Verify active connection status indicator', async ({ page }) => {
    await page.goto(UI_URL);

    // 1. Locate connection indicator dot
    const statusDot = page.locator('#ws-status-dot');
    await expect(statusDot).toBeVisible();

    // 2. Assert connection class is green/connected
    await expect(statusDot).toHaveClass(/status-connected/);
  });

  test('WS_EVENT_01: Verify real-time message stream dropdown list', async ({ page }) => {
    await page.goto(UI_URL);

    // 1. Open notifications dropdown
    await page.click('#ws-notification-btn');

    // 2. Wait for background generator to emit a message (up to 10 seconds)
    const eventItem = page.locator('.ws-event-item').first();
    await expect(eventItem).toBeVisible({ timeout: 10000 });

    // 3. Verify event items contain text content
    const content = await eventItem.locator('p').textContent();
    expect(content?.length).toBeGreaterThan(5);
  });

  test('WS_RESIL_01: Verify connection drop and auto-reconnection', async ({ page }) => {
    const request = page.context().request;
    await page.goto(UI_URL);

    // 1. Verify initially connected
    const statusDot = page.locator('#ws-status-dot');
    await expect(statusDot).toHaveClass(/status-connected/);

    // 2. Inject 100% websocket drop rate configuration
    await request.post(`${BASE_URL}/test/config`, {
      data: { websocketDropRate: 1.0 }
    });

    // 3. Open a new page context or trigger action to see drop
    // Since the server enforces disconnects on new sockets, 
    // we can reload to reconnect with chaos drop mode enabled
    await page.reload();

    // 4. The socket should establish a connection and get force-disconnected.
    // Assert that the dot indicator changes to disconnected/reconnecting.
    await expect(statusDot).not.toHaveClass(/status-connected/, { timeout: 5000 });

    // 5. Restore connection stability by resetting chaos parameters
    await request.post(`${BASE_URL}/test/reset`);

    // 6. Assert client recovers and automatically reconnects without requiring manual refresh
    await expect(statusDot).toHaveClass(/status-connected/, { timeout: 8000 });
  });
});
```

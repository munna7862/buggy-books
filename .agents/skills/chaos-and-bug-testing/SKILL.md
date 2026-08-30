---
name: chaos-and-bug-testing
description: Guidelines and procedures for interacting with BuggyBooks chaos endpoints, configuring intentional failure modes, and handling UI/API anti-patterns in automated tests.
---

# Chaos & Bug Testing Skill

This skill outlines how to interact with BuggyBooks' intentional chaos features and anti-patterns during test development and QA validation.

---

## 1. Chaos Configuration & Reset Endpoints

The backend provides endpoints to dynamically configure chaos parameters or reset state:

### A. Reset Application State (`POST /api/test/reset`)
Restores the database (`backend/src/data/db.json`) and resets chaos flags to default baseline.
```bash
# Using curl
curl -X POST http://localhost:5000/api/test/reset -H "Content-Type: application/json" -d "{}"
```
*Always invoke this in Playwright `beforeEach` and `afterAll` hooks.*

### B. Dynamic Chaos Toggle (`POST /api/test/config`)
Enables or customizes artificial latency, error rates, and failure injections:
```json
{
  "flakyCheckoutErrorRate": 0.15,
  "inventoryDelayMs": 3000,
  "rateLimitMaxRequests": 60
}
```

---

## 2. Intentional Anti-Patterns & Testing Strategies

| Anti-Pattern | Description | Recommended Test Automation Strategy |
| :--- | :--- | :--- |
| **Flaky Checkout** | `POST /api/checkout/process` intermittently returns `500 Internal Server Error` ~15% of the time. | Implement an exponential backoff or polling retry helper in the API/UI flow. Never remove the test assertion. |
| **Dynamic UI Delays** | "Add to Cart" and checkout buttons simulate latency (500ms–3500ms) before transitioning state. | Use auto-waiting Playwright assertions (e.g. `await expect(cartBadge).toHaveText('1')` or `locator.waitFor({ state: 'visible' })`). Avoid fixed `page.waitForTimeout()` sleeps. |
| **Obfuscated Locators** | Missing `id` attributes and `data-testid` attributes across the catalog and checkout forms. | Use semantic ARIA queries (`getByRole`, `getByLabel`) or sanctioned **relative XPath with axes** (e.g. `//label[text()='Username']/following-sibling::input`). |
| **Shadow DOM Encapsulation** | `<order-summary-box>` encapsulates the total amount in an isolated Shadow Root. | Rely on Playwright's automatic shadow DOM piercing locators (`page.locator('order-summary-box .total-price')`) or dedicated helper methods. |
| **Rate Limiting** | `express-rate-limit` enforces 60 requests/minute per IP, responding with `429 Too Many Requests`. | In high-frequency API tests, throttle requests or configure rate limit bypass via `/api/test/config`. |

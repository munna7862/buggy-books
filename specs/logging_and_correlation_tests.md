# 📝 Test Spec: Structured JSON Logging & Request Correlation ID

This document outlines the test cases and the architectural rationale for introducing the **Structured JSON Logging & Correlation ID** framework (Area 2 of the improvement plan).

---

## 💡 Rationale: Why This Area Was Added

In modern web applications (particularly distributed architectures, microservices, and serverless backends), tracing a single transaction through the entire request-response lifecycle is a significant challenge. When an automated regression suite fails, or a user experiences a transient error (such as BuggyBooks' intentional 15% stochastic checkout timeout), diagnosing the issue from raw log dumps is time-consuming.

### 1. The Operational Rationale
*   **Traceability**: A unique `x-correlation-id` is generated for every request at the API gateway/middleware level. Using Node's native `AsyncLocalStorage`, this ID automatically flows through the database, security check, and payment layers without cluttering controller code signatures.
*   **Structured Parsing**: Switching from string logs to structured JSON logs allows log aggregators (like Grafana Loki, Datadog, or Elasticsearch) to index logs natively. You can query logs by `correlationId`, `username`, `statusCode`, or `method` instantly.

### 2. The QA & Test Automation Rationale (SDET Benefits)
*   **Instant Fail Debugging**: When an automated Playwright or Cypress test fails due to a backend error, the test framework can extract the correlation ID from the response header or the JSON error payload. The test reporter prints this ID. Developers can search the logs with the ID to locate the exact backend stack trace, reducing debugging time from hours to seconds.
*   **Compliance & Audit Testing**: Enterprise-level systems must audit critical events (e.g., successful/failed logins, card checkouts). Testers can write API automation tests that invoke an action, capture the correlation ID, and assert that the correct structured audit logs were successfully recorded on the server.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **API_LOG_01** | Correlation ID Header Generation | Send any HTTP request. Verify `x-correlation-id` is returned in response headers and is a valid UUIDv4. | Smoke |
| **API_LOG_02** | Correlation ID Header Preservation | Send a request with a custom `x-correlation-id` header. Verify the API preserves it and returns the exact same ID. | Regression |
| **API_LOG_03** | Error Body Correlation ID Mapping | Trigger a server-side error (e.g., send malformed JSON syntax). Verify that the JSON response body contains the exact same `correlationId`. | Regression |
| **API_LOG_04** | User Context Log Association | Login, add an item to the cart, and checkout. Inspect the server logs for that correlation ID and verify that the logs contain the correct `username` field. | E2E |

---

## 🛠️ Implementation Guide: Writing the Automation Assertions

Below is an example of how you can write these assertions using **Playwright APIRequest** in your automation repository.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Structured Logging & Correlation ID API Assertions', () => {
  const BASE_URL = 'http://localhost:4000/api';

  test('API_LOG_01: Verify correlation ID is generated in headers', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/books`);
    expect(response.status()).toBe(200);

    // 1. Extract the header
    const correlationId = response.headers()['x-correlation-id'];
    expect(correlationId).toBeDefined();

    // 2. Assert it matches UUIDv4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(correlationId).穩.toMatch(uuidRegex);
  });

  test('API_LOG_02: Verify custom correlation ID preservation', async ({ request }) => {
    const customTraceId = 'qa-run-user-registration-1002';
    const response = await request.post(`${BASE_URL}/register`, {
      headers: {
        'x-correlation-id': customTraceId
      },
      data: {
        username: `qa_user_${Date.now()}`,
        password: 'Password123!'
      }
    });

    expect(response.status()).toBe(201);
    expect(response.headers()['x-correlation-id']).toBe(customTraceId);
  });

  test('API_LOG_03: Verify error body contains correlationId', async ({ request }) => {
    const customTraceId = 'bad-json-failure-test';
    
    // Send raw text to trigger a BodyParser parsing syntax error (500/400)
    const response = await request.post(`${BASE_URL}/login`, {
      headers: {
        'x-correlation-id': customTraceId,
        'Content-Type': 'application/json'
      },
      data: 'invalid-json-body-{text}'
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    
    // Assert the response payload maps back to the correlation ID for quick debugging
    expect(body.error).toBe('Internal Server Error');
    expect(body.correlationId).toBe(customTraceId);
  });
});
```

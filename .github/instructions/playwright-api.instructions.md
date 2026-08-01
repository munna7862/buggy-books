---
description: "Request patterns, full-response status assertions, response contract validation, JWT/cookie handling, and correlation tracing for Playwright API tests"
applyTo: "playwright-e2e/src/tests/api/**/*.spec.ts"
---
# API test rules

These apply on top of the global conventions in `.github/copilot-instructions.md`.

## Request execution
- Import the default export from `src/utils/api.util`: `import apiUtil from '../../../utils/api.util'`.
- Call `apiUtil.makeRequest({ method, url, data, headers, logMessage, responseType })`.
- Use `responseType: 'full'` when full Axios response inspection (status code, headers) is required.
- Use `envConfig.apiBaseUrl` from `src/config/env.config` as the base endpoint URL.

## Status & contract assertions
- **Status assertions:** Check for expected status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
- **Contract assertions:** Validate JSON response body structure, required fields, and array item schemas.
- **Negative testing:** Assert error response statuses (< 500) and error payloads without causing server crashes.
- Use `commonFunctions.compareTwoValues(actual, expected, message)` for logged soft assertions alongside standard Playwright status checks.

## Security, JWT & Cookies
- Parse `Set-Cookie` headers for `token` and `refreshToken` parameters and security flags (`HttpOnly`).
- For JWT expiry testing (`jwtExpirySeconds`), wait for expiry before making requests to protected endpoints to verify `403 Forbidden` responses.

## Request tracing (Correlation ID)
- Assert responses automatically populate the `x-correlation-id` header in UUIDv4 format (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`).
- Verify custom `x-correlation-id` headers are preserved across API invocations and return matching `correlationId` fields in error payloads.

## Determinism
- Append unique timestamps/random integers to generated usernames during registration tests to prevent collisions.

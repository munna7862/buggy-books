# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/Logging/Test_001_LoggingAndCorrelationApi.spec.ts >> Structured JSON Logging & Correlation ID API Suite >> API_LOG_04: User Context Log Association @regression
- Location: src/tests/api/Logging/Test_001_LoggingAndCorrelationApi.spec.ts:58:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { CommonFunctions } from '../../../utils/common.util';
  3  | import TestData from '../../../test-data/api/Logging/Test_001_LoggingAndCorrelationApi.json';
  4  | import { randomBytes } from 'crypto';
  5  | 
  6  | const commonUtil = new CommonFunctions();
  7  | 
  8  | function uniqueUsername(prefix: string = 'loguser'): string {
  9  |   return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
  10 | }
  11 | 
  12 | test.describe('Structured JSON Logging & Correlation ID API Suite', () => {
  13 | 
  14 |   test('API_LOG_01: Correlation ID Header Generation @smoke @regression', async ({ request }) => {
  15 |     const res = await request.get('/api/books');
  16 |     expect(res.status()).toBe(200);
  17 | 
  18 |     const correlationId = res.headers()['x-correlation-id'];
  19 |     await commonUtil.logMessage('INFO', 'Verifying x-correlation-id header is present in response');
  20 |     expect(correlationId).toBeDefined();
  21 | 
  22 |     const uuidRegex = new RegExp(TestData.UUIDV4_REGEX, 'i');
  23 |     await commonUtil.logMessage('INFO', 'Verifying x-correlation-id matches valid UUIDv4 format');
  24 |     expect(uuidRegex.test(correlationId || '')).toBe(true);
  25 |   });
  26 | 
  27 |   test('API_LOG_02: Correlation ID Header Preservation @regression', async ({ request }) => {
  28 |     const customCorrelationId = TestData.CUSTOM_CORRELATION_ID;
  29 | 
  30 |     const res = await request.get('/api/books', {
  31 |       headers: { 'x-correlation-id': customCorrelationId }
  32 |     });
  33 | 
  34 |     expect(res.status()).toBe(200);
  35 | 
  36 |     const returnedCorrelationId = res.headers()['x-correlation-id'];
  37 |     await commonUtil.logMessage('INFO', 'Verifying API preserves custom x-correlation-id header');
  38 |     expect(returnedCorrelationId).toBe(customCorrelationId);
  39 |   });
  40 | 
  41 |   test('API_LOG_03: Error Body Correlation ID Mapping @regression', async ({ request }) => {
  42 |     const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_err';
  43 | 
  44 |     const res = await request.post('/api/test/config', {
  45 |       data: { visualChaos: "invalid_string_type" },
  46 |       headers: { 'x-correlation-id': customCorrelationId }
  47 |     });
  48 | 
  49 |     await commonUtil.logMessage('INFO', 'Verifying status code is 400 Bad Request');
  50 |     expect(res.status()).toBe(400);
  51 | 
  52 |     const body = await res.json() as { correlationId?: string };
  53 |     const bodyCorrelationId = body?.correlationId;
  54 |     await commonUtil.logMessage('INFO', 'Verifying error response body contains exact same correlationId');
  55 |     expect(bodyCorrelationId).toBe(customCorrelationId);
  56 |   });
  57 | 
  58 |   test('API_LOG_04: User Context Log Association @regression', async ({ request }) => {
  59 |     const username = uniqueUsername('user_log');
  60 |     const password = TestData.PASSWORD;
  61 |     const fullName = TestData.FULL_NAME;
  62 |     const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_user_flow';
  63 | 
  64 |     const registerRes = await request.post('/api/register', {
  65 |       data: { username, password, fullName },
  66 |       headers: { 'x-correlation-id': customCorrelationId }
  67 |     });
  68 |     await commonUtil.logMessage('INFO', 'Verifying user registration status is 201');
  69 |     expect(registerRes.status()).toBe(201);
  70 | 
  71 |     const loginRes = await request.post('/api/login', {
  72 |       data: { username, password },
  73 |       headers: { 'x-correlation-id': customCorrelationId }
  74 |     });
  75 |     await commonUtil.logMessage('INFO', 'Verifying user login status is 200');
  76 |     expect(loginRes.status()).toBe(200);
  77 | 
  78 |     const cartRes = await request.post('/api/cart', {
  79 |       data: { bookId: '1' },
  80 |       headers: { 'x-correlation-id': customCorrelationId }
  81 |     });
  82 |     await commonUtil.logMessage('INFO', 'Verifying add to cart status is 200');
  83 |     expect(cartRes.status()).toBe(200);
  84 | 
  85 |     const checkoutRes = await request.post('/api/checkout/process', {
  86 |       data: { firstName: 'LogUser', lastName: 'Test', creditCard: '4111222233334444' },
  87 |       headers: { 'x-correlation-id': customCorrelationId }
  88 |     });
  89 |     await commonUtil.logMessage('INFO', 'Verifying process checkout status is 200');
> 90 |     expect(checkoutRes.status()).toBe(200);
     |                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  91 | 
  92 |     const returnedCorrelationId = checkoutRes.headers()['x-correlation-id'];
  93 |     await commonUtil.logMessage('INFO', 'Verifying correlation ID preserved in checkout response');
  94 |     expect(returnedCorrelationId).toBe(customCorrelationId);
  95 |   });
  96 | 
  97 | });
  98 | 
```
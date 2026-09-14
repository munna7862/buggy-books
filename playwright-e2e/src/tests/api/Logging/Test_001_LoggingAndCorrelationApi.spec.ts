import { test, expect } from '@playwright/test';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/Logging/Test_001_LoggingAndCorrelationApi.json';
import { randomBytes } from 'crypto';

const commonUtil = new CommonFunctions();

function uniqueUsername(prefix: string = 'loguser'): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

test.describe('Structured JSON Logging & Correlation ID API Suite', () => {

  test('API_LOG_01: Correlation ID Header Generation @smoke @regression', async ({ request }) => {
    const res = await request.get('/api/books');
    expect(res.status()).toBe(200);

    const correlationId = res.headers()['x-correlation-id'];
    await commonUtil.logMessage('INFO', 'Verifying x-correlation-id header is present in response');
    expect(correlationId).toBeDefined();

    const uuidRegex = new RegExp(TestData.UUIDV4_REGEX, 'i');
    await commonUtil.logMessage('INFO', 'Verifying x-correlation-id matches valid UUIDv4 format');
    expect(uuidRegex.test(correlationId || '')).toBe(true);
  });

  test('API_LOG_02: Correlation ID Header Preservation @regression', async ({ request }) => {
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID;

    const res = await request.get('/api/books', {
      headers: { 'x-correlation-id': customCorrelationId }
    });

    expect(res.status()).toBe(200);

    const returnedCorrelationId = res.headers()['x-correlation-id'];
    await commonUtil.logMessage('INFO', 'Verifying API preserves custom x-correlation-id header');
    expect(returnedCorrelationId).toBe(customCorrelationId);
  });

  test('API_LOG_03: Error Body Correlation ID Mapping @regression', async ({ request }) => {
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_err';

    const res = await request.post('/api/test/config', {
      data: { visualChaos: "invalid_string_type" },
      headers: { 'x-correlation-id': customCorrelationId }
    });

    await commonUtil.logMessage('INFO', 'Verifying status code is 400 Bad Request');
    expect(res.status()).toBe(400);

    const body = await res.json() as { correlationId?: string };
    const bodyCorrelationId = body?.correlationId;
    await commonUtil.logMessage('INFO', 'Verifying error response body contains exact same correlationId');
    expect(bodyCorrelationId).toBe(customCorrelationId);
  });

  test('API_LOG_04: User Context Log Association @regression', async ({ request }) => {
    const username = uniqueUsername('user_log');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_user_flow';

    const registerRes = await request.post('/api/register', {
      data: { username, password, fullName },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    await commonUtil.logMessage('INFO', 'Verifying user registration status is 201');
    expect(registerRes.status()).toBe(201);

    const loginRes = await request.post('/api/login', {
      data: { username, password },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    await commonUtil.logMessage('INFO', 'Verifying user login status is 200');
    expect(loginRes.status()).toBe(200);

    const cartRes = await request.post('/api/cart', {
      data: { bookId: '1' },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    await commonUtil.logMessage('INFO', 'Verifying add to cart status is 200');
    expect(cartRes.status()).toBe(200);

    const checkoutRes = await request.post('/api/checkout/process', {
      data: { firstName: 'LogUser', lastName: 'Test', creditCard: '4111222233334444' },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    await commonUtil.logMessage('INFO', 'Verifying process checkout status is 200');
    expect(checkoutRes.status()).toBe(200);

    const returnedCorrelationId = checkoutRes.headers()['x-correlation-id'];
    await commonUtil.logMessage('INFO', 'Verifying correlation ID preserved in checkout response');
    expect(returnedCorrelationId).toBe(customCorrelationId);
  });

});

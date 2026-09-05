import { test, expect } from '../../../core/base/base.fixture';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/Logging/Test_001_LoggingAndCorrelationApi.json';
import { randomBytes } from 'crypto';

const commonUtil = new CommonFunctions();

function uniqueUsername(prefix: string = 'loguser'): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

test.describe('Structured JSON Logging & Correlation ID API Suite', () => {

  test('API_LOG_01: Correlation ID Header Generation @smoke @regression', async ({ request }) => {
    let hasCorrelationIdHeader = false;
    let isValidUuid = false;

    const res = await request.get('/api/books');

    expect(res.status()).toBe(200);

    const correlationId = res.headers()['x-correlation-id'];
    hasCorrelationIdHeader = await commonUtil.compareTwoValues(Boolean(correlationId), true, "Verifying x-correlation-id header is present in response");

    const uuidRegex = new RegExp(TestData.UUIDV4_REGEX, 'i');
    isValidUuid = await commonUtil.compareTwoValues(uuidRegex.test(correlationId || ''), true, "Verifying x-correlation-id matches valid UUIDv4 format");

    expect(hasCorrelationIdHeader && isValidUuid).toBeTruthy();
  });

  test('API_LOG_02: Correlation ID Header Preservation @regression', async ({ request }) => {
    let isCorrelationIdPreserved = false;
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID;

    const res = await request.get('/api/books', {
      headers: { 'x-correlation-id': customCorrelationId }
    });

    expect(res.status()).toBe(200);

    const returnedCorrelationId = res.headers()['x-correlation-id'];
    isCorrelationIdPreserved = await commonUtil.compareTwoValues(returnedCorrelationId, customCorrelationId, "Verifying API preserves custom x-correlation-id header");

    expect(isCorrelationIdPreserved).toBeTruthy();
  });

  test('API_LOG_03: Error Body Correlation ID Mapping @regression', async ({ request }) => {
    let isErrorStatus400 = false;
    let isBodyCorrelationIdMatching = false;
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_err';

    const res = await request.post('/api/test/config', {
      data: { visualChaos: "invalid_string_type" },
      headers: { 'x-correlation-id': customCorrelationId }
    });

    isErrorStatus400 = await commonUtil.compareTwoValues(res.status(), 400, "Verifying status code is 400 Bad Request");

    const body = await res.json() as { correlationId?: string };
    const bodyCorrelationId = body?.correlationId;
    isBodyCorrelationIdMatching = await commonUtil.compareTwoValues(bodyCorrelationId, customCorrelationId, "Verifying error response body contains exact same correlationId");

    expect(isErrorStatus400 && isBodyCorrelationIdMatching).toBeTruthy();
  });

  test('API_LOG_04: User Context Log Association @regression', async ({ request }) => {
    const username = uniqueUsername('user_log');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_user_flow';

    let isRegisterOk = false;
    let isLoginOk = false;
    let isCartOk = false;
    let isCheckoutOk = false;
    let isCorrelationPreserved = false;

    const registerRes = await request.post('/api/register', {
      data: { username, password, fullName },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    isRegisterOk = await commonUtil.compareTwoValues(registerRes.status(), 201, "Verifying user registration status is 201");

    const loginRes = await request.post('/api/login', {
      data: { username, password },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    isLoginOk = await commonUtil.compareTwoValues(loginRes.status(), 200, "Verifying user login status is 200");

    const cartRes = await request.post('/api/cart', {
      data: { bookId: '1' },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    isCartOk = await commonUtil.compareTwoValues(cartRes.status(), 200, "Verifying add to cart status is 200");

    const checkoutRes = await request.post('/api/checkout/process', {
      data: { firstName: 'LogUser', lastName: 'Test', creditCard: '4111222233334444' },
      headers: { 'x-correlation-id': customCorrelationId }
    });
    isCheckoutOk = await commonUtil.compareTwoValues(checkoutRes.status(), 200, "Verifying process checkout status is 200");

    const returnedCorrelationId = checkoutRes.headers()['x-correlation-id'];
    isCorrelationPreserved = await commonUtil.compareTwoValues(returnedCorrelationId, customCorrelationId, "Verifying correlation ID preserved in checkout response");

    expect(isRegisterOk && isLoginOk && isCartOk && isCheckoutOk && isCorrelationPreserved).toBeTruthy();
  });

});

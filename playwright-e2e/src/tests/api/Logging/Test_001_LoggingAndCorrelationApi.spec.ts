import { test, expect } from '@playwright/test';
import { envConfig } from '../../../config/env.config';
import apiUtil from '../../../utils/api.util';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/Logging/Test_001_LoggingAndCorrelationApi.json';

const commonUtil = new CommonFunctions();
const BOOKS_URL = `${envConfig.apiBaseUrl}/api/books`;
const REGISTER_URL = `${envConfig.apiBaseUrl}/api/register`;
const LOGIN_URL = `${envConfig.apiBaseUrl}/api/login`;
const CART_URL = `${envConfig.apiBaseUrl}/api/cart`;
const CHECKOUT_URL = `${envConfig.apiBaseUrl}/api/checkout/process`;
const CONFIG_URL = `${envConfig.apiBaseUrl}/api/test/config`;

import { randomBytes } from 'crypto';

function uniqueUsername(prefix: string = 'loguser'): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

test.describe('Structured JSON Logging & Correlation ID API Suite', () => {

  test('API_LOG_01: Correlation ID Header Generation @smoke @regression', async () => {
    let hasCorrelationIdHeader = false;
    let isValidUuid = false;

    const res = await apiUtil.makeRequest({
      method: 'GET',
      url: BOOKS_URL,
      logMessage: 'GET /api/books to check correlation ID generation',
      responseType: 'full'
    });

    expect(res.status).toBe(200);

    const correlationId = res.headers['x-correlation-id'];
    hasCorrelationIdHeader = await commonUtil.compareTwoValues(Boolean(correlationId), true, "Verifying x-correlation-id header is present in response");

    const uuidRegex = new RegExp(TestData.UUIDV4_REGEX, 'i');
    isValidUuid = await commonUtil.compareTwoValues(uuidRegex.test(correlationId || ''), true, "Verifying x-correlation-id matches valid UUIDv4 format");

    expect(hasCorrelationIdHeader && isValidUuid).toBeTruthy();
  });

  test('API_LOG_02: Correlation ID Header Preservation @regression', async () => {
    let isCorrelationIdPreserved = false;
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID;

    const res = await apiUtil.makeRequest({
      method: 'GET',
      url: BOOKS_URL,
      headers: { 'x-correlation-id': customCorrelationId },
      logMessage: 'GET /api/books with custom x-correlation-id header',
      responseType: 'full'
    });

    expect(res.status).toBe(200);

    const returnedCorrelationId = res.headers['x-correlation-id'];
    isCorrelationIdPreserved = await commonUtil.compareTwoValues(returnedCorrelationId, customCorrelationId, "Verifying API preserves custom x-correlation-id header");

    expect(isCorrelationIdPreserved).toBeTruthy();
  });

  test('API_LOG_03: Error Body Correlation ID Mapping @regression', async () => {
    let isErrorStatus400 = false;
    let isBodyCorrelationIdMatching = false;
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_err';

    const res = await apiUtil.makeRequest({
      method: 'POST',
      url: CONFIG_URL,
      data: { visualChaos: "invalid_string_type" },
      headers: { 'x-correlation-id': customCorrelationId },
      logMessage: 'Trigger 400 validation error with custom x-correlation-id',
      responseType: 'full'
    });

    isErrorStatus400 = await commonUtil.compareTwoValues(res.status, 400, "Verifying status code is 400 Bad Request");

    const bodyCorrelationId = res.data?.correlationId;
    isBodyCorrelationIdMatching = await commonUtil.compareTwoValues(bodyCorrelationId, customCorrelationId, "Verifying error response body contains exact same correlationId");

    expect(isErrorStatus400 && isBodyCorrelationIdMatching).toBeTruthy();
  });

  test('API_LOG_04: User Context Log Association @regression', async () => {
    const username = uniqueUsername('user_log');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;
    const customCorrelationId = TestData.CUSTOM_CORRELATION_ID + '_user_flow';

    let isRegisterOk = false;
    let isLoginOk = false;
    let isCartOk = false;
    let isCheckoutOk = false;
    let isCorrelationPreserved = false;

    const registerRes = await apiUtil.makeRequest({
      method: 'POST',
      url: REGISTER_URL,
      data: { username, password, fullName },
      headers: { 'x-correlation-id': customCorrelationId },
      logMessage: 'Register user with custom correlation ID',
      responseType: 'full'
    });
    isRegisterOk = await commonUtil.compareTwoValues(registerRes.status, 201, "Verifying user registration status is 201");

    const loginRes = await apiUtil.makeRequest({
      method: 'POST',
      url: LOGIN_URL,
      data: { username, password },
      headers: { 'x-correlation-id': customCorrelationId },
      logMessage: 'Login user with custom correlation ID',
      responseType: 'full'
    });
    isLoginOk = await commonUtil.compareTwoValues(loginRes.status, 200, "Verifying user login status is 200");

    const setCookieHeader: string[] = loginRes.headers['set-cookie'] || [];
    const cookieHeader = setCookieHeader.map(c => c.split(';')[0]).join('; ');

    const cartRes = await apiUtil.makeRequest({
      method: 'POST',
      url: CART_URL,
      data: { bookId: '1' },
      headers: { 'Cookie': cookieHeader, 'x-correlation-id': customCorrelationId },
      logMessage: 'Add book 1 to cart with custom correlation ID',
      responseType: 'full'
    });
    isCartOk = await commonUtil.compareTwoValues(cartRes.status, 200, "Verifying add to cart status is 200");

    const checkoutRes = await apiUtil.makeRequest({
      method: 'POST',
      url: CHECKOUT_URL,
      data: { firstName: 'LogUser', lastName: 'Test', creditCard: '4111222233334444' },
      headers: { 'Cookie': cookieHeader, 'x-correlation-id': customCorrelationId },
      logMessage: 'Process checkout with custom correlation ID',
      responseType: 'full'
    });
    isCheckoutOk = await commonUtil.compareTwoValues(checkoutRes.status, 200, "Verifying process checkout status is 200");

    const returnedCorrelationId = checkoutRes.headers['x-correlation-id'];
    isCorrelationPreserved = await commonUtil.compareTwoValues(returnedCorrelationId, customCorrelationId, "Verifying correlation ID preserved in checkout response");

    expect(isRegisterOk && isLoginOk && isCartOk && isCheckoutOk && isCorrelationPreserved).toBeTruthy();
  });

});

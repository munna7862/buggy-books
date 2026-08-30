import { test, expect } from '../../../core/base/base.fixture';
import { AxiosResponse } from 'axios';
import { envConfig } from '../../../config/env.config';
import { CommonFunctions } from '../../../utils/common.util';

const commonUtil = new CommonFunctions();
const REGISTER_URL = `${envConfig.apiBaseUrl}/api/register`;
const LOGIN_URL = `${envConfig.apiBaseUrl}/api/login`;
const CART_URL = `${envConfig.apiBaseUrl}/api/cart`;
const CHECKOUT_URL = `${envConfig.apiBaseUrl}/api/checkout/process`;
const INVENTORY_URL = `${envConfig.apiBaseUrl}/api/inventory/report`;
const CONFIG_URL = `${envConfig.apiBaseUrl}/api/test/config`;
const RESET_URL = `${envConfig.apiBaseUrl}/api/test/reset`;

import { randomBytes } from 'crypto';

function uniqueUsername(prefix: string = 'chaosuser'): string {
  return `${prefix}${Date.now()}${randomBytes(4).toString('hex')}@`;
}

test.describe('Chaos and Testing Utilities API', () => {

  test.beforeEach(async ({ apiUtil }) => {
    // Clean up state before each test in the isolated session
    const resetRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: RESET_URL,
      logMessage: 'Reset state before test',
      responseType: 'full'
    });
    expect(resetRes.status).toBe(200);
  });

  test('API_TEST_01: Global reset clears all non-default users and carts @smoke @regression', async ({ apiUtil }) => {
    const username = uniqueUsername();
    const password = 'Password123!';
    const fullName = 'Chaos Test User';

    // 1. Register a new user
    const registerRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: REGISTER_URL,
      data: { username, password, fullName },
      logMessage: 'Register user for reset test',
      responseType: 'full'
    });
    expect(registerRes.status).toBe(201);

    // 2. Login to get cookies
    const loginRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username, password },
      logMessage: 'Login user for reset test',
      responseType: 'full'
    });
    expect(loginRes.status).toBe(200);

    const setCookieHeader = loginRes.headers['set-cookie'];
    let cookieHeader = '';
    if (setCookieHeader) {
      cookieHeader = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
    }

    // 3. Add book 3 to cart
    const addRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: CART_URL,
      data: { bookId: '3' },
      headers: { 'Cookie': cookieHeader },
      logMessage: 'Add book 3 to cart',
      responseType: 'full'
    });
    expect(addRes.status).toBe(200);

    // 4. Perform Global Reset
    const resetRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: RESET_URL,
      logMessage: 'Call Global Reset',
      responseType: 'full'
    });
    expect(resetRes.status).toBe(200);

    // 5. Verify the registered user is cleared (Login should fail)
    const loginPostReset = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username, password },
      logMessage: 'Attempt login with deleted user',
      responseType: 'full'
    });
    expect(loginPostReset.status).toBe(401);

    // 6. Verify cart is cleared (Get Cart with default user should be empty)
    // Default user is testuser/buggybooks
    const defaultLoginRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username: 'testuser', password: 'buggybooks' },
      logMessage: 'Login default testuser',
      responseType: 'full'
    });
    expect(defaultLoginRes.status).toBe(200);

    const defaultSetCookie = defaultLoginRes.headers['set-cookie'];
    let defaultCookieHeader = '';
    if (defaultSetCookie) {
      defaultCookieHeader = defaultSetCookie.map(cookie => cookie.split(';')[0]).join('; ');
    }

    const getCartRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'GET',
      url: CART_URL,
      headers: { 'Cookie': defaultCookieHeader },
      logMessage: 'Get default testuser cart post-reset',
      responseType: 'full'
    });
    expect(getCartRes.status).toBe(200);
    expect(getCartRes.data).toEqual([]);
  });

  test('API_CHAOS_01: Inject checkout failures @smoke @regression @chaos', async ({ apiUtil }) => {
    const username = uniqueUsername();
    const password = 'Password123!';
    const fullName = 'Chaos Checkout User';

    // 1. Register & Login
    const registerRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: REGISTER_URL,
      data: { username, password, fullName },
      logMessage: 'Register user for chaos checkout',
      responseType: 'full'
    });
    expect(registerRes.status).toBe(201);

    const loginRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username, password },
      logMessage: 'Login user for chaos checkout',
      responseType: 'full'
    });
    expect(loginRes.status).toBe(200);

    const setCookieHeader = loginRes.headers['set-cookie'];
    let cookieHeader = '';
    if (setCookieHeader) {
      cookieHeader = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
    }

    // 2. Add book to cart
    const addRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: CART_URL,
      data: { bookId: '1' },
      headers: { 'Cookie': cookieHeader },
      logMessage: 'Add book to cart',
      responseType: 'full'
    });
    expect(addRes.status).toBe(200);

    // 3. Set checkout failure rate to 1.0 (always fail)
    const configRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: CONFIG_URL,
      data: { checkoutFailureRate: 1.0 },
      logMessage: 'Configure checkout failure rate to 1.0',
      responseType: 'full'
    });
    expect(configRes.status).toBe(200);

    // 4. Try checkout and verify it returns 500
    const checkoutRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: CHECKOUT_URL,
      data: {
        firstName: 'John',
        lastName: 'Doe',
        creditCard: '1234567890123456'
      },
      headers: { 'Cookie': cookieHeader },
      logMessage: 'Perform checkout under chaos injection',
      responseType: 'full'
    });
    expect(checkoutRes.status).toBe(500);
    expect(checkoutRes.data.error).toContain('Internal Server Error: Payment Gateway Timeout');
  });

  test('API_CHAOS_02: Inject API latency @smoke @regression @chaos', async ({ apiUtil }) => {
    // 1. Set inventory latency to 3000 ms
    const configRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: CONFIG_URL,
      data: { inventoryDelayMs: 3000 },
      logMessage: 'Configure inventory report latency to 3000ms',
      responseType: 'full'
    });
    expect(configRes.status).toBe(200);

    // 2. Query inventory report and measure latency
    const startTime = Date.now();
    const response = await apiUtil.makeRequest<AxiosResponse<{ totalBooks: number; totalValue: number; timestamp: string }>>({
      method: 'GET',
      url: INVENTORY_URL,
      logMessage: 'Get inventory report under latency injection',
      responseType: 'full'
    });
    const endTime = Date.now();
    const elapsedMs = endTime - startTime;

    expect(response.status).toBe(200);
    await commonUtil.logMessage('INFO', `Inventory report request took: ${elapsedMs} ms`);
    
    // We expect at least 3000ms delay, allowing a 100ms grace threshold
    expect(elapsedMs).toBeGreaterThanOrEqual(2900);
  });
});

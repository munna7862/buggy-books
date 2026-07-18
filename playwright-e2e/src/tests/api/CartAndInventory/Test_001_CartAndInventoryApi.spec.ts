import { test, expect } from '@playwright/test';
import { envConfig } from '../../../config/env.config';
import apiUtil from '../../../utils/api.util';
import { CommonFunctions } from '../../../utils/common.util';
import * as fs from 'fs';
import * as path from 'path';

const commonUtil = new CommonFunctions();
const REGISTER_URL = `${envConfig.apiBaseUrl}/api/register`;
const LOGIN_URL = `${envConfig.apiBaseUrl}/api/login`;
const CART_URL = `${envConfig.apiBaseUrl}/api/cart`;
const INVENTORY_URL = `${envConfig.apiBaseUrl}/api/inventory/report`;

function uniqueUsername(prefix: string = 'cartuser'): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 100000)}@`;
}

test.describe('Cart & Inventory API', () => {
  let cookieHeader = '';
  let username = '';

  test.beforeAll(async () => {
    // 1. Register a new user
    username = uniqueUsername();
    const password = 'Password123!';
    const fullName = 'Cart Test User';

    const registerRes = await apiUtil.makeRequest({
      method: 'POST',
      url: REGISTER_URL,
      data: { username, password, fullName },
      logMessage: 'Register user for Cart test',
      responseType: 'full'
    });
    expect(registerRes.status).toBe(201);

    // 2. Login to get cookies
    const loginRes = await apiUtil.makeRequest({
      method: 'POST',
      url: LOGIN_URL,
      data: { username, password },
      logMessage: 'Login user for Cart test',
      responseType: 'full'
    });
    expect(loginRes.status).toBe(200);

    const setCookieHeader = loginRes.headers['set-cookie'];
    if (setCookieHeader) {
      cookieHeader = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
    }
  });

  test('API_CART_01: Cart persistence after server crash', async () => {
    // 1. Add item to cart
    const addRes = await apiUtil.makeRequest({
      method: 'POST',
      url: CART_URL,
      data: { bookId: '3' },
      headers: { 'Cookie': cookieHeader },
      logMessage: 'Add book 3 to cart',
      responseType: 'full'
    });
    expect(addRes.status).toBe(200);
    expect(addRes.data).toContainEqual(expect.objectContaining({ id: '3' }));

    // 2. Restart server locally (if applicable)
    if (envConfig.apiBaseUrl.includes('localhost')) {
      await commonUtil.logMessage('INFO', 'Restarting local server by touching backend server.ts...');
      // Touch backend/src/server.ts to trigger ts-node-dev reload
      const serverFilePath = path.join(__dirname, '../../../../../backend/src/server.ts');
      if (fs.existsSync(serverFilePath)) {
        fs.utimesSync(serverFilePath, new Date(), new Date());
        await commonUtil.logMessage('INFO', 'Touched server.ts. Waiting 3 seconds for backend to reload...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        await commonUtil.logMessage('WARNING', `Could not find server.ts at path: ${serverFilePath}`);
      }
    } else {
      await commonUtil.logMessage('INFO', 'Remote server detected. Skipping server reload step.');
    }

    // 3. Get Cart and verify book 3 is still there
    const getRes = await apiUtil.makeRequest({
      method: 'GET',
      url: CART_URL,
      headers: { 'Cookie': cookieHeader },
      logMessage: 'Get cart after restart',
      responseType: 'full'
    });
    expect(getRes.status).toBe(200);
    expect(getRes.data).toContainEqual(expect.objectContaining({ id: '3' }));
  });

  test('API_INV_01: Trigger inventory report', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: INVENTORY_URL,
      logMessage: 'Get inventory report',
      responseType: 'full'
    });

    expect(response.status).toBe(200);
    expect(response.data.totalBooks).toBe(15);
    expect(response.data.totalValue).toBeCloseTo(196.91, 2);
    expect(response.data.timestamp).toBeTruthy();
    expect(new Date(response.data.timestamp).toString()).not.toBe('Invalid Date');
  });
});

import { test, expect } from '@playwright/test';
import { envConfig } from '../../../config/env.config';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/UserManagement/Test_002_TokenRefreshAndProfileApi.json';
import { randomBytes } from 'crypto';

const commonUtil = new CommonFunctions();

function uniqueUsername(prefix: string = 'tokenuser'): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

test.describe('Token Refresh and Profile Upload API Suite', () => {

  test('API_REF_01: Dynamic Access Token Expiry @smoke @regression @chaos', async ({ request }) => {
    const username = uniqueUsername('token_exp');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;

    try {
      const regRes = await request.post('/api/register', {
        data: { username, password, fullName },
      });
      expect(regRes.status()).toBe(201);

      const configRes = await request.post('/api/test/config', {
        data: { jwtExpirySeconds: 2 },
      });
      expect(configRes.status()).toBe(200);

      const loginRes = await request.post('/api/login', {
        data: { username, password },
      });
      expect(loginRes.status()).toBe(200);

      const setCookieHeaders = loginRes.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
      const cookieHeader = setCookieHeaders.map(c => c.value.split(';')[0]).join('; ');

      // Wait 3s so that the 2s access token expires
      await new Promise(r => setTimeout(r, 3000));

      const protectedRes = await request.get('/api/cart', {
        headers: { 'Cookie': cookieHeader },
      });

      await commonUtil.logMessage('INFO', 'Verifying 403 Forbidden returned for expired token');
      expect(protectedRes.status()).toBe(403);
    } finally {
      await request.post('/api/test/config', {
        data: { jwtExpirySeconds: 900 },
      });
    }
  });

  test('API_REF_02: Refresh Token Issuance @smoke @regression', async ({ request }) => {
    const username = uniqueUsername('ref_issue');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;

    const regRes = await request.post('/api/register', {
      data: { username, password, fullName },
    });
    expect(regRes.status()).toBe(201);

    const loginRes = await request.post('/api/login', {
      data: { username, password },
    });
    expect(loginRes.status()).toBe(200);

    const setCookieHeaders = loginRes.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
    const setCookieStr = setCookieHeaders.map(h => h.value).join('; ');

    await commonUtil.logMessage('INFO', 'Verifying Set-Cookie contains access token');
    expect(setCookieStr.includes('token=')).toBe(true);

    await commonUtil.logMessage('INFO', 'Verifying Set-Cookie contains refresh token');
    expect(setCookieStr.includes('refreshToken=')).toBe(true);

    await commonUtil.logMessage('INFO', 'Verifying Set-Cookie includes HttpOnly security flag');
    expect(setCookieStr.toLowerCase().includes('httponly')).toBe(true);
  });

  test('API_REF_03: Silent Token Refresh @regression', async ({ request }) => {
    const username = uniqueUsername('silent_ref');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;

    const regRes = await request.post('/api/register', {
      data: { username, password, fullName },
    });
    expect(regRes.status()).toBe(201);

    const loginRes = await request.post('/api/login', {
      data: { username, password },
    });
    expect(loginRes.status()).toBe(200);

    const setCookieHeaders = loginRes.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
    const refreshCookie = setCookieHeaders.find(c => c.value.startsWith('refreshToken='));
    const refreshTokenHeader = refreshCookie ? refreshCookie.value.split(';')[0] : '';

    const refreshRes = await request.post('/api/auth/refresh', {
      headers: { 'Cookie': refreshTokenHeader },
    });

    await commonUtil.logMessage('INFO', 'Verifying POST /api/auth/refresh returns 200 OK');
    expect(refreshRes.status()).toBe(200);

    const refreshSetCookieHeaders = refreshRes.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
    const refreshSetCookieStr = refreshSetCookieHeaders.map(h => h.value).join('; ');

    await commonUtil.logMessage('INFO', 'Verifying new access token issued in Set-Cookie');
    expect(refreshSetCookieStr.includes('token=')).toBe(true);
  });

  test('API_UPL_01: Unauthorized Session Check @regression', async ({ playwright }) => {
    const unauthContext = await playwright.request.newContext({
      baseURL: envConfig.apiBaseUrl,
      storageState: { cookies: [], origins: [] },
      extraHTTPHeaders: {
        'x-bypass-csrf': 'true',
      },
    });
    const uploadRes = await unauthContext.post('/api/profile/upload', {
      multipart: {
        avatar: {
          name: 'avatar.png',
          mimeType: 'image/png',
          buffer: Buffer.from('mock-avatar-bytes'),
        },
      },
    });
    const status = uploadRes.status();
    await unauthContext.dispose();

    await commonUtil.logMessage('INFO', 'Verifying 401 Unauthorized for unauthenticated upload request');
    expect(status).toBe(401);
  });

});

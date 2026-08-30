import { test, expect } from '../../../core/base/base.fixture';
import { AxiosResponse } from 'axios';
import { envConfig } from '../../../config/env.config';
import apiUtil from '../../../utils/api.util';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/UserManagement/Test_002_TokenRefreshAndProfileApi.json';

const commonUtil = new CommonFunctions();
const REGISTER_URL = `${envConfig.apiBaseUrl}/api/register`;
const LOGIN_URL = `${envConfig.apiBaseUrl}/api/login`;
const REFRESH_URL = `${envConfig.apiBaseUrl}/api/auth/refresh`;
const CART_URL = `${envConfig.apiBaseUrl}/api/cart`;
const UPLOAD_URL = `${envConfig.apiBaseUrl}/api/profile/upload`;
const CONFIG_URL = `${envConfig.apiBaseUrl}/api/test/config`;

import { randomBytes } from 'crypto';

function uniqueUsername(prefix: string = 'tokenuser'): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

test.describe('Token Refresh and Profile Upload API Suite', () => {

  test('API_REF_01: Dynamic Access Token Expiry @smoke @regression @chaos', async () => {
    const username = uniqueUsername('token_exp');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;

    let isForbiddenReturned = false;

    try {
      await apiUtil.makeRequest<AxiosResponse<any>>({
        method: 'POST',
        url: REGISTER_URL,
        data: { username, password, fullName },
        logMessage: 'Register user for token expiry test',
        responseType: 'full'
      });

      const configRes = await apiUtil.makeRequest<AxiosResponse<any>>({
        method: 'POST',
        url: CONFIG_URL,
        data: { jwtExpirySeconds: 2 },
        logMessage: 'Inject jwtExpirySeconds: 2 via chaos config',
        responseType: 'full'
      });
      expect(configRes.status).toBe(200);

      const loginRes = await apiUtil.makeRequest<AxiosResponse<any>>({
        method: 'POST',
        url: LOGIN_URL,
        data: { username, password },
        logMessage: 'Login user to receive short-lived access token',
        responseType: 'full'
      });
      expect(loginRes.status).toBe(200);

      const setCookieHeader: string[] = loginRes.headers['set-cookie'] || [];
      const cookieHeader = setCookieHeader.map(c => c.split(';')[0]).join('; ');

      await new Promise(r => setTimeout(r, 3000));


      const protectedRes = await apiUtil.makeRequest<AxiosResponse<any>>({
        method: 'GET',
        url: CART_URL,
        headers: { 'Cookie': cookieHeader },
        logMessage: 'Request GET /api/cart with expired access token',
        responseType: 'full'
      });

      isForbiddenReturned = await commonUtil.compareTwoValues(protectedRes.status, 403, "Verifying 403 Forbidden returned for expired token");
    } finally {
      await apiUtil.makeRequest<AxiosResponse<any>>({
        method: 'POST',
        url: CONFIG_URL,
        data: { jwtExpirySeconds: 900 },
        logMessage: 'Reset jwtExpirySeconds to 900',
        responseType: 'full'
      });
    }

    expect(isForbiddenReturned).toBeTruthy();
  });

  test('API_REF_02: Refresh Token Issuance @smoke @regression', async () => {
    const username = uniqueUsername('ref_issue');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;

    let hasAccessToken = false;
    let hasRefreshToken = false;
    let hasHttpOnlyFlag = false;

    await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: REGISTER_URL,
      data: { username, password, fullName },
      logMessage: 'Register user for refresh token issuance test',
      responseType: 'full'
    });

    const loginRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username, password },
      logMessage: 'Login user to inspect Set-Cookie headers',
      responseType: 'full'
    });
    expect(loginRes.status).toBe(200);

    const setCookieHeader: string[] = loginRes.headers['set-cookie'] || [];
    const setCookieStr = setCookieHeader.join('; ');

    hasAccessToken = await commonUtil.compareTwoValues(setCookieStr.includes('token='), true, "Verifying Set-Cookie contains access token");
    hasRefreshToken = await commonUtil.compareTwoValues(setCookieStr.includes('refreshToken='), true, "Verifying Set-Cookie contains refresh token");
    hasHttpOnlyFlag = await commonUtil.compareTwoValues(setCookieStr.toLowerCase().includes('httponly'), true, "Verifying Set-Cookie includes HttpOnly security flag");

    expect(hasAccessToken && hasRefreshToken && hasHttpOnlyFlag).toBeTruthy();
  });

  test('API_REF_03: Silent Token Refresh @regression', async () => {
    const username = uniqueUsername('silent_ref');
    const password = TestData.PASSWORD;
    const fullName = TestData.FULL_NAME;

    let isRefreshOk = false;
    let hasNewAccessToken = false;

    await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: REGISTER_URL,
      data: { username, password, fullName },
      logMessage: 'Register user for silent refresh test',
      responseType: 'full'
    });

    const loginRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username, password },
      logMessage: 'Login user to extract refreshToken cookie',
      responseType: 'full'
    });
    expect(loginRes.status).toBe(200);

    const setCookieHeader: string[] = loginRes.headers['set-cookie'] || [];
    const refreshCookie = setCookieHeader.find(c => c.startsWith('refreshToken='));
    const refreshTokenHeader = refreshCookie ? refreshCookie.split(';')[0] : '';

    const refreshRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: REFRESH_URL,
      headers: { 'Cookie': refreshTokenHeader },
      logMessage: 'Call POST /api/auth/refresh with refreshToken cookie',
      responseType: 'full'
    });

    isRefreshOk = await commonUtil.compareTwoValues(refreshRes.status, 200, "Verifying POST /api/auth/refresh returns 200 OK");

    const refreshSetCookie: string[] = refreshRes.headers['set-cookie'] || [];
    const refreshSetCookieStr = refreshSetCookie.join('; ');
    hasNewAccessToken = await commonUtil.compareTwoValues(refreshSetCookieStr.includes('token='), true, "Verifying new access token issued in Set-Cookie");

    expect(isRefreshOk && hasNewAccessToken).toBeTruthy();
  });

  test('API_UPL_01: Unauthorized Session Check @regression', async () => {
    let isUnauthorized = false;

    const uploadRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: UPLOAD_URL,
      logMessage: 'Attempt POST /api/profile/upload without auth cookies',
      responseType: 'full'
    });

    isUnauthorized = await commonUtil.compareTwoValues(uploadRes.status, 401, "Verifying 401 Unauthorized for unauthenticated upload request");

    expect(isUnauthorized).toBeTruthy();
  });

});

import { test, expect } from '../../../core/base/base.fixture';
import { AxiosResponse } from 'axios';
import { envConfig } from '../../../config/env.config';
import { CommonFunctions } from '../../../utils/common.util';

const commonUtil = new CommonFunctions();
const REGISTER_URL = `${envConfig.apiBaseUrl}/api/register`;
const LOGIN_URL = `${envConfig.apiBaseUrl}/api/login`;
const CART_URL = `${envConfig.apiBaseUrl}/api/cart`;
const SESSION_URL = `${envConfig.apiBaseUrl}/api/test/session`;

test.describe('Session-Partitioned Data Sandboxing & Multi-Tenant Isolation', () => {

  test('API_SAN_01: Concurrent sessions maintain 100% data isolation for cart and user state @smoke @regression @sandboxing', async ({ apiUtil, testSessionId }) => {
    const sessionA = `${testSessionId}-worker-a`;
    const sessionB = `${testSessionId}-worker-b`;

    const userA = `sandbox_user_a_${Date.now()}`;
    const userB = `sandbox_user_b_${Date.now()}`;
    const password = 'Password123!';

    // 1. Register User A in Session A
    const regResA = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: REGISTER_URL,
      data: { username: userA, password, fullName: 'Sandbox User A' },
      headers: { 'x-test-session-id': sessionA },
      logMessage: 'Register user in Session A',
      responseType: 'full'
    });
    expect(regResA.status).toBe(201);

    // 2. Register User B in Session B
    const regResB = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: REGISTER_URL,
      data: { username: userB, password, fullName: 'Sandbox User B' },
      headers: { 'x-test-session-id': sessionB },
      logMessage: 'Register user in Session B',
      responseType: 'full'
    });
    expect(regResB.status).toBe(201);

    // 3. User A logs into Session A and gets cookie
    const loginResA = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username: userA, password },
      headers: { 'x-test-session-id': sessionA },
      logMessage: 'Login user in Session A',
      responseType: 'full'
    });
    expect(loginResA.status).toBe(200);
    const cookieA = (loginResA.headers['set-cookie'] || []).map((c: string) => c.split(';')[0]).join('; ');

    // 4. User B logs into Session B and gets cookie
    const loginResB = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username: userB, password },
      headers: { 'x-test-session-id': sessionB },
      logMessage: 'Login user in Session B',
      responseType: 'full'
    });
    expect(loginResB.status).toBe(200);
    const cookieB = (loginResB.headers['set-cookie'] || []).map((c: string) => c.split(';')[0]).join('; ');

    // 5. Add Book '1' to User A's Cart in Session A
    const addCartA = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: CART_URL,
      data: { bookId: '1' },
      headers: { 'Cookie': cookieA, 'x-test-session-id': sessionA },
      logMessage: 'Add book 1 to cart in Session A',
      responseType: 'full'
    });
    expect(addCartA.status).toBe(200);

    // 6. Add Book '2' to User B's Cart in Session B
    const addCartB = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: CART_URL,
      data: { bookId: '2' },
      headers: { 'Cookie': cookieB, 'x-test-session-id': sessionB },
      logMessage: 'Add book 2 to cart in Session B',
      responseType: 'full'
    });
    expect(addCartB.status).toBe(200);

    // 7. Verify User A only sees Book 1 in Session A
    const getCartA = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'GET',
      url: CART_URL,
      headers: { 'Cookie': cookieA, 'x-test-session-id': sessionA },
      logMessage: 'Get Cart in Session A',
      responseType: 'full'
    });
    expect(getCartA.status).toBe(200);
    expect(getCartA.data).toHaveLength(1);
    expect(getCartA.data[0].id).toBe('1');

    // 8. Verify User B only sees Book 2 in Session B
    const getCartB = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'GET',
      url: CART_URL,
      headers: { 'Cookie': cookieB, 'x-test-session-id': sessionB },
      logMessage: 'Get Cart in Session B',
      responseType: 'full'
    });
    expect(getCartB.status).toBe(200);
    expect(getCartB.data).toHaveLength(1);
    expect(getCartB.data[0].id).toBe('2');

    // 9. Verify User A cannot login in Session B (Zero bleed)
    const crossLoginRes = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'POST',
      url: LOGIN_URL,
      data: { username: userA, password },
      headers: { 'x-test-session-id': sessionB },
      logMessage: 'Cross-tenant login attempt in Session B',
      responseType: 'full'
    });
    expect(crossLoginRes.status).toBe(401);

    // 10. Clean up Session A explicitly
    const delResA = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'DELETE',
      url: `${SESSION_URL}/${sessionA}`,
      headers: { 'x-test-session-id': sessionA },
      logMessage: 'Delete Session A',
      responseType: 'full'
    });
    expect(delResA.status).toBe(200);
    expect(delResA.data.success).toBe(true);

    // 11. Clean up Session B explicitly
    const delResB = await apiUtil.makeRequest<AxiosResponse<any>>({
      method: 'DELETE',
      url: `${SESSION_URL}/${sessionB}`,
      headers: { 'x-test-session-id': sessionB },
      logMessage: 'Delete Session B',
      responseType: 'full'
    });
    expect(delResB.status).toBe(200);
    expect(delResB.data.success).toBe(true);
  });

});

import { test, expect } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';

test.describe('Session-Partitioned Data Sandboxing & Multi-Tenant Isolation', () => {

  test('API_SAN_01: Concurrent sessions maintain 100% data isolation for cart and user state @smoke @regression @sandboxing', async ({ playwright, testSessionId }) => {
    const sessionA = `${testSessionId}-worker-a`;
    const sessionB = `${testSessionId}-worker-b`;

    const userA = `sandbox_user_a_${Date.now()}`;
    const userB = `sandbox_user_b_${Date.now()}`;
    const password = 'Password123!';

    // Create two isolated APIRequestContext instances representing concurrent tenants
    const requestA = await playwright.request.newContext({
      baseURL: envConfig.apiBaseUrl,
      extraHTTPHeaders: {
        'x-test-session-id': sessionA,
        'x-bypass-rate-limit': 'true',
      },
    });

    const requestB = await playwright.request.newContext({
      baseURL: envConfig.apiBaseUrl,
      extraHTTPHeaders: {
        'x-test-session-id': sessionB,
        'x-bypass-rate-limit': 'true',
      },
    });

    try {
      // 1. Register User A in Session A
      const regResA = await requestA.post('/api/register', {
        data: { username: userA, password, fullName: 'Sandbox User A' }
      });
      expect(regResA.status()).toBe(201);

      // 2. Register User B in Session B
      const regResB = await requestB.post('/api/register', {
        data: { username: userB, password, fullName: 'Sandbox User B' }
      });
      expect(regResB.status()).toBe(201);

      // 3. User A logs into Session A (cookies stored automatically in requestA)
      const loginResA = await requestA.post('/api/login', {
        data: { username: userA, password }
      });
      expect(loginResA.status()).toBe(200);

      // 4. User B logs into Session B (cookies stored automatically in requestB)
      const loginResB = await requestB.post('/api/login', {
        data: { username: userB, password }
      });
      expect(loginResB.status()).toBe(200);

      // 5. Add Book '1' to User A's Cart in Session A
      const addCartA = await requestA.post('/api/cart', {
        data: { bookId: '1' }
      });
      expect(addCartA.status()).toBe(200);

      // 6. Add Book '2' to User B's Cart in Session B
      const addCartB = await requestB.post('/api/cart', {
        data: { bookId: '2' }
      });
      expect(addCartB.status()).toBe(200);

      // 7. Verify User A only sees Book 1 in Session A
      const getCartA = await requestA.get('/api/cart');
      expect(getCartA.status()).toBe(200);
      const cartDataA = await getCartA.json();
      expect(cartDataA).toHaveLength(1);
      expect(cartDataA[0].id).toBe('1');

      // 8. Verify User B only sees Book 2 in Session B
      const getCartB = await requestB.get('/api/cart');
      expect(getCartB.status()).toBe(200);
      const cartDataB = await getCartB.json();
      expect(cartDataB).toHaveLength(1);
      expect(cartDataB[0].id).toBe('2');

      // 9. Verify User A cannot login in Session B (Zero tenant bleed)
      const crossLoginRes = await requestB.post('/api/login', {
        data: { username: userA, password }
      });
      expect(crossLoginRes.status()).toBe(401);

      // 10. Clean up Session A explicitly
      const delResA = await requestA.delete(`/api/test/session/${sessionA}`);
      expect(delResA.status()).toBe(200);
      const delDataA = await delResA.json();
      expect(delDataA.success).toBe(true);

      // 11. Clean up Session B explicitly
      const delResB = await requestB.delete(`/api/test/session/${sessionB}`);
      expect(delResB.status()).toBe(200);
      const delDataB = await delResB.json();
      expect(delDataB.success).toBe(true);
    } finally {
      await requestA.dispose();
      await requestB.dispose();
    }
  });

});

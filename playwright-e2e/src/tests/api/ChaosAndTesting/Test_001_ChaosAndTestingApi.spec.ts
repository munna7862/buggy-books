import { test, expect } from '../../../core/base/base.fixture';
import { CommonFunctions } from '../../../utils/common.util';
import { randomBytes } from 'crypto';

const commonUtil = new CommonFunctions();

function uniqueUsername(prefix: string = 'chaosuser'): string {
  return `${prefix}${Date.now()}${randomBytes(4).toString('hex')}@`;
}

test.describe('Chaos and Testing Utilities API', () => {

  test.beforeEach(async ({ request }) => {
    // Clean up state before each test in the isolated session
    const resetRes = await request.post('/api/test/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('API_TEST_01: Global reset clears all non-default users and carts @smoke @regression', async ({ request }) => {
    const username = uniqueUsername();
    const password = 'Password123!';
    const fullName = 'Chaos Test User';

    // 1. Register a new user
    const registerRes = await request.post('/api/register', {
      data: { username, password, fullName }
    });
    expect(registerRes.status()).toBe(201);

    // 2. Login to get cookies
    const loginRes = await request.post('/api/login', {
      data: { username, password }
    });
    expect(loginRes.status()).toBe(200);

    // 3. Add book 3 to cart
    const addRes = await request.post('/api/cart', {
      data: { bookId: '3' }
    });
    expect(addRes.status()).toBe(200);

    // 4. Perform Session Reset
    const resetRes = await request.post('/api/test/reset');
    expect(resetRes.status()).toBe(200);

    // 5. Verify the registered user is cleared (Login should fail)
    const loginPostReset = await request.post('/api/login', {
      data: { username, password }
    });
    expect(loginPostReset.status()).toBe(401);

    // 6. Verify cart is cleared (Get Cart with default user should be empty)
    // Default user is testuser/buggybooks
    const defaultLoginRes = await request.post('/api/login', {
      data: { username: 'testuser', password: 'buggybooks' }
    });
    expect(defaultLoginRes.status()).toBe(200);

    const getCartRes = await request.get('/api/cart');
    expect(getCartRes.status()).toBe(200);
    const cartData = await getCartRes.json();
    expect(cartData).toEqual([]);
  });

  test('API_CHAOS_01: Inject checkout failures @smoke @regression @chaos', async ({ request }) => {
    const username = uniqueUsername();
    const password = 'Password123!';
    const fullName = 'Chaos Checkout User';

    // 1. Register & Login
    const registerRes = await request.post('/api/register', {
      data: { username, password, fullName }
    });
    expect(registerRes.status()).toBe(201);

    const loginRes = await request.post('/api/login', {
      data: { username, password }
    });
    expect(loginRes.status()).toBe(200);

    // 2. Add book to cart
    const addRes = await request.post('/api/cart', {
      data: { bookId: '1' }
    });
    expect(addRes.status()).toBe(200);

    // 3. Set checkout failure rate to 1.0 (always fail)
    const configRes = await request.post('/api/test/config', {
      data: { checkoutFailureRate: 1.0 }
    });
    expect(configRes.status()).toBe(200);

    // 4. Try checkout and verify it returns 500
    const checkoutRes = await request.post('/api/checkout/process', {
      data: {
        firstName: 'John',
        lastName: 'Doe',
        creditCard: '1234567890123456'
      }
    });
    expect(checkoutRes.status()).toBe(500);
    const errData = await checkoutRes.json();
    expect(errData.error).toContain('Internal Server Error: Payment Gateway Timeout');
  });

  test('API_CHAOS_02: Inject API latency @smoke @regression @chaos', async ({ request }) => {
    // 1. Set inventory latency to 3000 ms
    const configRes = await request.post('/api/test/config', {
      data: { inventoryDelayMs: 3000 }
    });
    expect(configRes.status()).toBe(200);

    // 2. Query inventory report and measure latency
    const startTime = Date.now();
    const response = await request.get('/api/inventory/report');
    const endTime = Date.now();
    const elapsedMs = endTime - startTime;

    expect(response.status()).toBe(200);
    await commonUtil.logMessage('INFO', `Inventory report request took: ${elapsedMs} ms`);
    
    // We expect at least 3000ms delay, allowing a 100ms grace threshold
    expect(elapsedMs).toBeGreaterThanOrEqual(2900);
  });
});

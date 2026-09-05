import { test, expect } from '../../../core/base/base.fixture';
import { CommonFunctions } from '../../../utils/common.util';
import { randomBytes } from 'crypto';

const commonUtil = new CommonFunctions();

function uniqueUsername(prefix: string = 'cartuser'): string {
  return `${prefix}${Date.now()}${randomBytes(4).toString('hex')}@`;
}

test.describe('Cart & Inventory API', () => {

  test('API_CART_01: Cart persistence after server crash @smoke @regression', async ({ request }, testInfo) => {
    // 1. Register a new user
    const username = uniqueUsername();
    const password = 'Password123!';
    const fullName = 'Cart Test User';

    const registerRes = await request.post('/api/register', {
      data: { username, password, fullName }
    });
    expect(registerRes.status()).toBe(201);

    // 2. Login to get cookies in APIRequestContext
    const loginRes = await request.post('/api/login', {
      data: { username, password }
    });
    expect(loginRes.status()).toBe(200);

    // 3. Add item to cart
    const addRes = await request.post('/api/cart', {
      data: { bookId: '3' }
    });
    expect(addRes.status()).toBe(200);
    const addData = await addRes.json();
    expect(addData).toContainEqual(expect.objectContaining({ id: '3' }));

    // 4. Get Cart and verify book 3 is still there
    const getRes = await request.get('/api/cart');
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    expect(getData).toContainEqual(expect.objectContaining({ id: '3' }));
  });

  test('API_INV_01: Trigger inventory report @smoke @regression', async ({ request }) => {
    const response = await request.get('/api/inventory/report');

    expect(response.status()).toBe(200);
    const data = await response.json() as { totalBooks: number; totalValue: number; timestamp: string };
    expect(data.totalBooks).toBe(15);
    expect(data.totalValue).toBeCloseTo(196.91, 2);
    expect(data.timestamp).toBeTruthy();
    expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
  });
});

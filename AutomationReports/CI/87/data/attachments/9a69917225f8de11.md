# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/CartAndInventory/Test_001_CartAndInventoryApi.spec.ts >> Cart & Inventory API >> API_CART_01: Cart persistence after server crash @smoke @regression
- Location: src/tests/api/CartAndInventory/Test_001_CartAndInventoryApi.spec.ts:10:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { randomBytes } from 'crypto';
  3  | 
  4  | function uniqueUsername(prefix: string = 'cartuser'): string {
  5  |   return `${prefix}${Date.now()}${randomBytes(4).toString('hex')}@`;
  6  | }
  7  | 
  8  | test.describe('Cart & Inventory API', () => {
  9  | 
  10 |   test('API_CART_01: Cart persistence after server crash @smoke @regression', async ({ request }) => {
  11 |     // 1. Register a new user
  12 |     const username = uniqueUsername();
  13 |     const password = 'Password123!';
  14 |     const fullName = 'Cart Test User';
  15 | 
  16 |     const registerRes = await request.post('/api/register', {
  17 |       data: { username, password, fullName }
  18 |     });
  19 |     expect(registerRes.status()).toBe(201);
  20 | 
  21 |     // 2. Login to get cookies in APIRequestContext
  22 |     const loginRes = await request.post('/api/login', {
  23 |       data: { username, password }
  24 |     });
> 25 |     expect(loginRes.status()).toBe(200);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  26 | 
  27 |     // 3. Add item to cart
  28 |     const addRes = await request.post('/api/cart', {
  29 |       data: { bookId: '3' }
  30 |     });
  31 |     expect(addRes.status()).toBe(200);
  32 |     const addData = await addRes.json();
  33 |     expect(addData).toContainEqual(expect.objectContaining({ id: '3' }));
  34 | 
  35 |     // 4. Get Cart and verify book 3 is still there
  36 |     const getRes = await request.get('/api/cart');
  37 |     expect(getRes.status()).toBe(200);
  38 |     const getData = await getRes.json();
  39 |     expect(getData).toContainEqual(expect.objectContaining({ id: '3' }));
  40 |   });
  41 | 
  42 |   test('API_INV_01: Trigger inventory report @smoke @regression', async ({ request }) => {
  43 |     const response = await request.get('/api/inventory/report');
  44 | 
  45 |     expect(response.status()).toBe(200);
  46 |     const data = await response.json() as { totalBooks: number; totalValue: number; timestamp: string };
  47 |     expect(data.totalBooks).toBe(15);
  48 |     expect(data.totalValue).toBeCloseTo(196.91, 2);
  49 |     expect(data.timestamp).toBeTruthy();
  50 |     expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
  51 |   });
  52 | });
  53 | 
```
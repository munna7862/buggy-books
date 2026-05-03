import request from 'supertest';
import app from '../app';

describe('BuggyBooks API Integration Tests', () => {
  let cookies: string[];

  beforeEach(async () => {
    // Reset data before each test
    await request(app).post('/api/test/reset');
  });

  describe('Standard API Routes', () => {
    it('GET /api/books should return a list of books', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThanOrEqual(15);
    });

    it('GET /api/books?page=1&limit=6 should return paginated results', async () => {
      const res = await request(app).get('/api/books?page=1&limit=6');
      expect(res.status).toBe(200);
      expect(res.body.books).toHaveLength(6);
      expect(res.body.total).toBeGreaterThanOrEqual(15);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/books?q=dystopian should filter by genre', async () => {
      const res = await request(app).get('/api/books?q=dystopian&page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.books.length).toBeGreaterThanOrEqual(1);
      expect(res.body.books.every((b: any) =>
        b.genre?.toLowerCase().includes('dystopian')
      )).toBeTruthy();
    });

    it('GET /api/books/:id should return a specific book', async () => {
      const res = await request(app).get('/api/books/1');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('1');
      expect(res.body.title).toContain('Gatsby');
    });

    it('GET /api/books/:id should return 404 for a missing book', async () => {
      const res = await request(app).get('/api/books/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Not Found');
    });

    it('POST /api/register should create a new user and return a token', async () => {
      const res = await request(app).post('/api/register').send({
        username: 'test_new_user',
        password: 'securepassword123'
      });
      expect(res.status).toBe(201);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.message).toBe('Registration successful');
    });

    it('POST /api/register should fail if missing credentials', async () => {
      const res = await request(app).post('/api/register').send({
        username: 'test_new_user'
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Bad Request');
    });

    it('POST /api/register should fail if username already exists', async () => {
      // admin already exists
      const res = await request(app).post('/api/register').send({
        username: 'admin',
        password: 'newpassword123'
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Conflict');
    });

    it('POST /api/login should authenticate a valid user', async () => {
      const res = await request(app).post('/api/login').send({
        username: 'admin',
        password: 'password123'
      });
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      cookies = (res.headers['set-cookie'] as any) || []; // save for subsequent tests
    });


    it('POST /api/login should fail with bad credentials', async () => {
      const res = await request(app).post('/api/login').send({
        username: 'admin',
        password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/cart should require authentication', async () => {
      const res = await request(app).post('/api/cart').send({ bookId: '1' });
      expect(res.status).toBe(401);
    });

    it('POST /api/cart should validate request body schema', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Cookie', cookies)
        .send({ bookId: 123 }); // integer instead of string

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
    });

    it('POST /api/cart should add item to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Cookie', cookies)
        .send({ bookId: '1' });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe('1');
    });

    it('DELETE /api/cart/:bookId should remove an item from the cart', async () => {
      // First add an item
      await request(app)
        .post('/api/cart')
        .set('Cookie', cookies)
        .send({ bookId: '1' });

      // Then remove it
      const res = await request(app)
        .delete('/api/cart/1')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it('DELETE /api/cart should clear the cart', async () => {
      // First add some items
      await request(app)
        .post('/api/cart')
        .set('Cookie', cookies)
        .send({ bookId: '1' });
      await request(app)
        .post('/api/cart')
        .set('Cookie', cookies)
        .send({ bookId: '2' });

      // Then clear the cart
      const res = await request(app)
        .delete('/api/cart')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify cart is empty
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Cookie', cookies);
      expect(cartRes.body.length).toBe(0);
    });

    it('DELETE /api/cart/:bookId should return 404 if item is not in cart', async () => {
      const res = await request(app)
        .delete('/api/cart/999')
        .set('Cookie', cookies);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Not Found');
    });

    it('POST /api/checkout/process should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/checkout/process')
        .set('Cookie', cookies)
        .send({ firstName: 'John' }); // Missing lastName and creditCard

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
    });


  });

  describe('Chaos API / Testing Configurations', () => {
    it('GET /api/inventory/report should be fast when delay is configured to 0', async () => {
      // 1. Configure to 0 delay
      await request(app).post('/api/test/config').send({ inventoryDelayMs: 0 });

      // 2. Fetch inventory
      const start = Date.now();
      const res = await request(app).get('/api/inventory/report');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(1000); // definitely less than 3000ms
    });

    it('POST /api/checkout/process should fail 100% of the time when configured', async () => {
      // 1. Configure to 100% failure rate
      await request(app).post('/api/test/config').send({ checkoutFailureRate: 1.0 });

      // Add a book first so cart isn't empty
      await request(app)
        .post('/api/cart')
        .set('Cookie', cookies)
        .send({ bookId: '1' });

      // 2. Process checkout
      const res = await request(app)
        .post('/api/checkout/process')
        .set('Cookie', cookies)
        .send({ firstName: 'John', lastName: 'Doe', creditCard: '1234567812345678' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Payment Gateway Timeout');
    });

    it('POST /api/checkout/process should succeed and create an order', async () => {
      // Configure 0% failure rate
      await request(app).post('/api/test/config').send({ checkoutFailureRate: 0.0 });

      // Add a book
      await request(app).post('/api/cart').set('Cookie', cookies).send({ bookId: '1' });

      // Process checkout
      const res = await request(app)
        .post('/api/checkout/process')
        .set('Cookie', cookies)
        .send({ firstName: 'Jane', lastName: 'Doe', creditCard: '8765432187654321' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orderId).toBeDefined();

      // Verify cart is empty
      const cartRes = await request(app).get('/api/cart').set('Cookie', cookies);
      expect(cartRes.body.length).toBe(0);

      // Verify order exists
      const ordersRes = await request(app).get('/api/orders').set('Cookie', cookies);
      expect(ordersRes.status).toBe(200);
      expect(ordersRes.body.length).toBe(1);
      expect(ordersRes.body[0].id).toBe(res.body.orderId);
      expect(ordersRes.body[0].customerName).toBe('Jane Doe');
    });
  });
});

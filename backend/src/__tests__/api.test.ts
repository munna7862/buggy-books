import request from 'supertest';
import app from '../app';

describe('BuggyBooks API Integration Tests', () => {
  let token: string;

  beforeEach(async () => {
    // Reset data before each test
    await request(app).post('/api/test/reset');
  });

  describe('Standard API Routes', () => {
    it('GET /api/books should return a list of books', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('POST /api/register should create a new user and return a token', async () => {
      const res = await request(app).post('/api/register').send({
        username: 'test_new_user',
        password: 'securepassword123'
      });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
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
      expect(res.body.token).toBeDefined();
      token = res.body.token; // save for subsequent tests
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
        .set('Authorization', `Bearer ${token}`)
        .send({ bookId: 123 }); // integer instead of string

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation failed');
    });

    it('POST /api/cart should add item to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookId: '1' });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe('1');
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

      // 2. Process checkout
      const res = await request(app)
        .post('/api/checkout/process')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Payment Gateway Timeout');
    });
  });
});

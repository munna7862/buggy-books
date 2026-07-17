import request from 'supertest';
import app from '../app';

describe('Visual Regression Chaos Configuration API', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should default visualChaos to false in the chaos store', async () => {
    const res = await request(app).get('/api/test/config');
    expect(res.status).toBe(200);
    expect(res.body.visualChaos).toBe(false);
  });

  it('should allow enabling visualChaos via POST /api/test/config', async () => {
    const updateRes = await request(app)
      .post('/api/test/config')
      .send({ visualChaos: true });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.config.visualChaos).toBe(true);

    const fetchRes = await request(app).get('/api/test/config');
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.visualChaos).toBe(true);
  });

  it('should allow disabling visualChaos via POST /api/test/config', async () => {
    await request(app).post('/api/test/config').send({ visualChaos: true });

    const updateRes = await request(app)
      .post('/api/test/config')
      .send({ visualChaos: false });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.config.visualChaos).toBe(false);
  });

  it('should reset visualChaos to false via POST /api/test/reset', async () => {
    await request(app).post('/api/test/config').send({ visualChaos: true });

    const resetRes = await request(app).post('/api/test/reset');
    expect(resetRes.status).toBe(200);

    const fetchRes = await request(app).get('/api/test/config');
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.visualChaos).toBe(false);
  });

  it('should reject non-boolean values for visualChaos', async () => {
    const res = await request(app)
      .post('/api/test/config')
      .send({ visualChaos: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Validation failed');
  });

  it('should allow setting visualChaos alongside other chaos parameters', async () => {
    const res = await request(app)
      .post('/api/test/config')
      .send({ visualChaos: true, checkoutFailureRate: 0.5 });

    expect(res.status).toBe(200);
    expect(res.body.config.visualChaos).toBe(true);
    expect(res.body.config.checkoutFailureRate).toBe(0.5);
  });
});

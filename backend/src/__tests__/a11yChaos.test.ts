import request from 'supertest';
import app from '../app';

describe('Accessibility Violation Injector (a11y) Chaos Configuration API', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should default injectA11yViolations to false in the chaos store', async () => {
    const res = await request(app).get('/api/test/config');
    expect(res.status).toBe(200);
    expect(res.body.injectA11yViolations).toBe(false);
  });

  it('should allow toggling injectA11yViolations via POST /api/test/config', async () => {
    // 1. Enable a11y violations
    const updateRes = await request(app)
      .post('/api/test/config')
      .send({ injectA11yViolations: true });
    
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.config.injectA11yViolations).toBe(true);

    // 2. Fetch config to verify persistence
    const fetchRes = await request(app).get('/api/test/config');
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.injectA11yViolations).toBe(true);
  });

  it('should reject invalid values (e.g. non-boolean types) for injectA11yViolations', async () => {
    const res = await request(app)
      .post('/api/test/config')
      .send({ injectA11yViolations: "yes" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Validation failed');
  });
});

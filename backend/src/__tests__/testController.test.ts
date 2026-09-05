import request from 'supertest';
import app from '../app';

describe('Test Controller Session Isolation & Chaos Sandboxing', () => {
  const sessionA = 'test-worker-session-A-123';
  const sessionB = 'test-worker-session-B-456';

  beforeEach(async () => {
    // Reset global baseline
    await request(app).post('/api/test/reset');
  });

  afterEach(async () => {
    await request(app).delete(`/api/test/session/${sessionA}`);
    await request(app).delete(`/api/test/session/${sessionB}`);
  });

  it('should isolate chaos configuration between different test session IDs', async () => {
    // Session A enables visual chaos and 0.5 failure rate
    const resA = await request(app)
      .post('/api/test/config')
      .set('x-test-session-id', sessionA)
      .send({ visualChaos: true, checkoutFailureRate: 0.5 });

    expect(resA.status).toBe(200);
    expect(resA.body.config.visualChaos).toBe(true);
    expect(resA.body.config.checkoutFailureRate).toBe(0.5);

    // Session B should have default chaos configuration (visualChaos: false, checkoutFailureRate: 0.0)
    const resB = await request(app)
      .get('/api/test/config')
      .set('x-test-session-id', sessionB);

    expect(resB.status).toBe(200);
    expect(resB.body.visualChaos).toBe(false);
    expect(resB.body.checkoutFailureRate).toBe(0.0);

    // Global default should remain false
    const resGlobal = await request(app).get('/api/test/config');
    expect(resGlobal.status).toBe(200);
    expect(resGlobal.body.visualChaos).toBe(false);
    expect(resGlobal.body.checkoutFailureRate).toBe(0.0);
  });

  it('should only reset the caller session when x-test-session-id is provided', async () => {
    // 1. Session A sets chaos
    await request(app)
      .post('/api/test/config')
      .set('x-test-session-id', sessionA)
      .send({ visualChaos: true });

    // 2. Session B sets chaos
    await request(app)
      .post('/api/test/config')
      .set('x-test-session-id', sessionB)
      .send({ checkoutFailureRate: 0.8 });

    // 3. Reset Session A only
    const resetA = await request(app)
      .post('/api/test/reset')
      .set('x-test-session-id', sessionA);

    expect(resetA.status).toBe(200);
    expect(resetA.body.sessionId).toBe(sessionA);

    // 4. Session A chaos should be back to false
    const checkA = await request(app)
      .get('/api/test/config')
      .set('x-test-session-id', sessionA);
    expect(checkA.body.visualChaos).toBe(false);

    // 5. Session B chaos MUST remain untouched (checkoutFailureRate: 0.8)
    const checkB = await request(app)
      .get('/api/test/config')
      .set('x-test-session-id', sessionB);
    expect(checkB.body.checkoutFailureRate).toBe(0.8);
  });

  it('should clean up session state cleanly via DELETE /api/test/session/:id', async () => {
    // Mutate Session A
    await request(app)
      .post('/api/test/config')
      .set('x-test-session-id', sessionA)
      .send({ visualChaos: true });

    const deleteRes = await request(app).delete(`/api/test/session/${sessionA}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.deleted).toBe(true);
  });
});

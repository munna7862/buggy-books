import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

describe('JWT Expiration and Silent Refresh Integration Flow', () => {
  beforeEach(async () => {
    // Reset databases and chaos configs before each test
    await request(app).post('/api/test/reset');
  });

  it('should issue both access and refresh token cookies on successful login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(200);

    // Extract set-cookie headers
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();

    // Check token cookie
    const hasAccessToken = cookies.some(c => c.startsWith('token='));
    expect(hasAccessToken).toBe(true);

    // Check refreshToken cookie
    const hasRefreshToken = cookies.some(c => c.startsWith('refreshToken='));
    expect(hasRefreshToken).toBe(true);

    // Parse cookies to verify claims
    const accessTokenCookie = cookies.find(c => c.startsWith('token='))!;
    const accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    
    const decodedAccess = jwt.verify(accessToken, JWT_SECRET) as any;
    expect(decodedAccess.username).toBe('admin');
    expect(decodedAccess.type).toBe('access');

    const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='))!;
    const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET) as any;
    expect(decodedRefresh.username).toBe('admin');
    expect(decodedRefresh.type).toBe('refresh');
  });

  it('should deny access to protected routes if access token is expired', async () => {
    // 1. Set short JWT expiry (e.g. 1 second) via chaos config
    await request(app)
      .post('/api/test/config')
      .send({ jwtExpirySeconds: 1 });

    // 2. Login to get short-lived tokens
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const accessTokenCookie = cookies.find(c => c.startsWith('token='))!;

    // 3. Request immediately - should succeed
    const firstCartRes = await request(app)
      .get('/api/cart')
      .set('Cookie', [accessTokenCookie]);
    expect(firstCartRes.status).toBe(200);

    // 4. Wait for 1.2 seconds for the token to expire
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 5. Request again - should return 403 Forbidden (Expired)
    const secondCartRes = await request(app)
      .get('/api/cart')
      .set('Cookie', [accessTokenCookie]);
    expect(secondCartRes.status).toBe(403);
    expect(secondCartRes.body.error).toContain('Forbidden');
  });

  it('should issue a new access token when calling /api/auth/refresh with a valid refresh token', async () => {
    // 1. Login to get cookies
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='))!;

    // 2. Call the refresh endpoint
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.username).toBe('admin');

    // 3. Confirm new token cookie is returned
    const refreshCookies = refreshRes.headers['set-cookie'] as unknown as string[];
    expect(refreshCookies).toBeDefined();
    const hasNewAccessToken = refreshCookies.some(c => c.startsWith('token='));
    expect(hasNewAccessToken).toBe(true);
  });

  it('should fail with 401 if refresh is called without cookies', async () => {
    const res = await request(app)
      .post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('should fail with 403 if refresh is called with an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=invalid-token-value']);
    expect(res.status).toBe(403);
  });
});

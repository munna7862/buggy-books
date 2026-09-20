import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

describe('JWT Expiration and Silent Refresh Integration Flow', () => {
  beforeEach(async () => {
    // Reset databases and chaos configs before each test
    await request(app).post('/api/test/reset');
  });

  it('should issue both access and refresh token cookies on successful login and return them in JSON body', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('admin');
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

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
    
    const decodedAccess = jwt.verify(accessToken, JWT_SECRET) as { username: string; type: string };
    expect(decodedAccess.username).toBe('admin');
    expect(decodedAccess.type).toBe('access');

    const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='))!;
    const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET) as { username: string; type: string };
    expect(decodedRefresh.username).toBe('admin');
    expect(decodedRefresh.type).toBe('refresh');
  });

  it('should grant access to protected routes with Authorization: Bearer <token> header', async () => {
    // 1. Login to get token
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // 2. Access protected /api/cart with Bearer header (no cookies)
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(cartRes.status).toBe(200);
    expect(Array.isArray(cartRes.body)).toBe(true);
  });

  it('should deny access to protected routes with invalid Bearer token', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', 'Bearer invalid-token-value');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('should deny access to protected routes if access token is expired', async () => {
    // 1. Set short JWT expiry (e.g. 3 seconds) via chaos config
    await request(app)
      .post('/api/test/config')
      .send({ jwtExpirySeconds: 3 });

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

    // 4. Wait for 3.2 seconds for the token to expire
    await new Promise(resolve => setTimeout(resolve, 3200));

    // 5. Request again - should return 403 Forbidden (Expired)
    const secondCartRes = await request(app)
      .get('/api/cart')
      .set('Cookie', [accessTokenCookie]);
    expect(secondCartRes.status).toBe(403);
    expect(secondCartRes.body.error).toContain('Forbidden');
  });

  it('should issue a new access token and rotated refresh token when calling /api/auth/refresh with cookies', async () => {
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
    expect(refreshRes.body.token).toBeDefined();
    expect(refreshRes.body.refreshToken).toBeDefined();

    // 3. Confirm new token cookie is returned
    const refreshCookies = refreshRes.headers['set-cookie'] as unknown as string[];
    expect(refreshCookies).toBeDefined();
    const hasNewAccessToken = refreshCookies.some(c => c.startsWith('token='));
    expect(hasNewAccessToken).toBe(true);
  });

  it('should issue new access token and rotated refresh token via JSON body refresh token', async () => {
    // 1. Login to get tokens
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    const originalRefreshToken = loginRes.body.refreshToken;
    expect(originalRefreshToken).toBeDefined();

    // 2. Call refresh using body payload (no cookies sent)
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.username).toBe('admin');
    expect(refreshRes.body.token).toBeDefined();
    expect(refreshRes.body.refreshToken).toBeDefined();

    // Verify claims of rotated token
    const decodedRotated = jwt.verify(refreshRes.body.refreshToken, JWT_SECRET) as { username: string; type: string };
    expect(decodedRotated.username).toBe('admin');
    expect(decodedRotated.type).toBe('refresh');
  });

  it('should bypass CSRF protection for mutating requests carrying valid Bearer token', async () => {
    // 1. Login to get Bearer token
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    const token = loginRes.body.token;

    // 2. Mutating POST /api/cart with Bearer token, enforcing CSRF check via header, without x-csrf-token
    const cartMutationRes = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .set('x-enforce-csrf', 'true')
      .send({ bookId: '1', quantity: 1 });

    // Should succeed because Bearer tokens are exempt from CSRF
    expect(cartMutationRes.status).toBe(200);
  });

  it('should reject mutating requests without CSRF token when using cookie authentication', async () => {
    // 1. Login to get auth cookie
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const tokenCookie = cookies.find(c => c.startsWith('token='))!;

    // 2. Mutating POST /api/cart with cookie, enforcing CSRF check, without x-csrf-token
    const cartMutationRes = await request(app)
      .post('/api/cart')
      .set('Cookie', [tokenCookie])
      .set('x-enforce-csrf', 'true')
      .send({ bookId: '1', quantity: 1 });

    // Should fail with 403 Forbidden due to missing CSRF token
    expect(cartMutationRes.status).toBe(403);
  });

  it('should fail with 401 if refresh is called without cookies or body', async () => {
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

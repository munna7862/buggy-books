import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { REFRESH_REUSE_GRACE_MS } from '../services/auth.service';

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

  describe('Bearer verification before skipping CSRF (MOB_M1_08)', () => {
    const postCartWithBearer = (token: string) =>
      request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .set('x-enforce-csrf', 'true')
        .send({ bookId: '1', quantity: 1 });

    it('should apply the CSRF check to a Bearer token that does not verify', async () => {
      const res = await postCartWithBearer('a-long-but-invalid-bearer-token');

      expect(res.status).toBe(403);
      expect(res.body.error).not.toContain('Invalid token');
    });

    it('should apply the CSRF check to a refresh token sent as a Bearer token', async () => {
      const login = await request(app).post('/api/login').send({ username: 'admin', password: 'password123' });

      const res = await postCartWithBearer(login.body.refreshToken);

      expect(res.status).toBe(403);
      expect(res.body.error).not.toContain('Invalid token');
    });
  });

  describe('Refresh token reuse detection (MOB_M1_09)', () => {
    const login = async () =>
      (await request(app).post('/api/login').send({ username: 'admin', password: 'password123' })).body.refreshToken as string;
    const refresh = (refreshToken: string) => request(app).post('/api/auth/refresh').send({ refreshToken });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const moveClockPastGraceWindow = () => {
      const later = Date.now() + REFRESH_REUSE_GRACE_MS + 1000;
      jest.spyOn(Date, 'now').mockReturnValue(later);
    };

    it('should tolerate a replay inside the grace window without revoking the session', async () => {
      const original = await login();
      const first = await refresh(original);
      const replay = await refresh(original);

      expect(first.status).toBe(200);
      expect(replay.status).toBe(200);
      expect((await refresh(first.body.refreshToken)).status).toBe(200);
    });

    it('should reject a replay after the grace window and revoke the whole family', async () => {
      const original = await login();
      const rotated = (await refresh(original)).body.refreshToken as string;
      moveClockPastGraceWindow();

      expect((await refresh(original)).status).toBe(403);
      expect((await refresh(rotated)).status).toBe(403);
    });

    it('should not affect another session of the same user', async () => {
      const stolen = await login();
      const other = await login();
      await refresh(stolen);
      moveClockPastGraceWindow();
      await refresh(stolen);

      expect((await refresh(other)).status).toBe(200);
    });

    it('should revoke the session when logout receives its refresh token', async () => {
      const refreshToken = await login();

      await request(app).post('/api/logout').send({ refreshToken });

      expect((await refresh(refreshToken)).status).toBe(403);
    });

    it('should accept a refresh token issued before reuse detection existed', async () => {
      const legacy = jwt.sign({ username: 'admin', type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });

      expect((await refresh(legacy)).status).toBe(200);
    });
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

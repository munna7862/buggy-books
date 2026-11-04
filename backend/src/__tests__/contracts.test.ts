import request from 'supertest';
import type { IRouter } from 'express';
import app from '../app';
import apiRoutes from '../routes/api';
import { API_ROUTES, SEEDED_BOOK_IDS, SEEDED_USERS, buildPath } from '@buggybooks/contracts';

interface RouteLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

/** Lists every `METHOD /api/path` the API router registers. */
function registeredRoutes(router: IRouter): Set<string> {
  const routes = new Set<string>();
  for (const layer of router.stack as RouteLayer[]) {
    if (!layer.route) continue;
    for (const [method, enabled] of Object.entries(layer.route.methods)) {
      if (enabled) routes.add(`${method.toUpperCase()} /api${layer.route.path}`);
    }
  }
  return routes;
}

describe('Shared API contract (@buggybooks/contracts)', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  afterAll(async () => {
    await request(app).post('/api/test/reset');
  });

  const registered = registeredRoutes(apiRoutes);

  it.each(Object.entries(API_ROUTES))('backend registers %s', (_name, route) => {
    expect(registered).toContain(`${route.method} ${route.path}`);
  });

  it.each(Object.values(SEEDED_USERS))('seeded user "$username" can log in with the shared password', async (user) => {
    const res = await request(app)
      .post(API_ROUTES.login.path)
      .send({ username: user.username, password: user.password });

    // The mobile app reads exactly these fields from the login response.
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ username: user.username, token: expect.any(String), refreshToken: expect.any(String) }),
    );
  });

  it('GET books without query params returns a plain list of books', async () => {
    // The mobile catalog relies on this shape; query params switch to a paginated object.
    const res = await request(app).get(API_ROUTES.books.path);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const book of res.body) {
      expect(book).toEqual(expect.objectContaining({ id: expect.any(String), title: expect.any(String), price: expect.any(Number) }));
    }
  });

  it('a Bearer token from login reads the profile of the same user', async () => {
    const { username, password } = SEEDED_USERS.testuser;
    const login = await request(app).post(API_ROUTES.login.path).send({ username, password });

    const profile = await request(app)
      .get(API_ROUTES.profile.path)
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(profile.status).toBe(200);
    expect(profile.body.username).toBe(username);
  });

  it.each(SEEDED_BOOK_IDS)('seeded book "%s" exists', async (id) => {
    const res = await request(app).get(buildPath(API_ROUTES.bookById.path, { id }));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });
});

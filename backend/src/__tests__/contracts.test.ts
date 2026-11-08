import request from 'supertest';
import type { IRouter } from 'express';
import app from '../app';
import apiRoutes from '../routes/api';
import { API_ROUTES, SEEDED_BOOKS, SEEDED_USERS, buildPath } from '@buggybooks/contracts';

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

  it.each(SEEDED_BOOKS)('seeded book "$id" exists with the shared title', async ({ id, title }) => {
    const res = await request(app).get(buildPath(API_ROUTES.bookById.path, { id }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ id, title }));
  });

  it('GET books with page, limit and q returns the paginated shape the catalog reads', async () => {
    const res = await request(app).get(API_ROUTES.books.path).query({ q: '1984', page: '1', limit: '8' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ books: [expect.objectContaining({ id: '3' })], total: 1, page: 1, totalPages: 1, limit: 8 });
  });

  it('the first catalog page leaves the book used by the Load more flow for page two', async () => {
    const first = await request(app).get(API_ROUTES.books.path).query({ page: '1', limit: '8' });
    const second = await request(app).get(API_ROUTES.books.path).query({ page: '2', limit: '8' });
    const ids = (res: request.Response) => (res.body.books as { id: string }[]).map((book) => book.id);

    expect(ids(first)).not.toContain('9');
    expect(ids(second)).toContain('9');
  });

  it('register returns the fields the app reads, and refresh rotates them', async () => {
    const register = await request(app)
      .post(API_ROUTES.register.path)
      .send({ username: 'contract-user', password: 'a-password', fullName: 'Contract User' });
    expect(register.status).toBe(201);
    expect(register.body).toEqual(
      expect.objectContaining({ username: 'contract-user', token: expect.any(String), refreshToken: expect.any(String) }),
    );

    const refresh = await request(app).post(API_ROUTES.refresh.path).send({ refreshToken: register.body.refreshToken });
    expect(refresh.status).toBe(200);
    expect(refresh.body).toEqual(expect.objectContaining({ token: expect.any(String), refreshToken: expect.any(String) }));
    expect(refresh.body.refreshToken).not.toBe(register.body.refreshToken);
  });
});

import { API_ROUTES, SEEDED_USERS } from '@buggybooks/contracts';

/**
 * A fake of the backend at the network boundary (global fetch). It only answers
 * the method + path pairs from @buggybooks/contracts, so the app is tested with
 * its real API client and a wrong path fails the test with a 404, just as the
 * real backend would.
 */
export interface FakeBook {
  id: string;
  title: string;
  author: string;
  price: number;
  description?: string;
  stock?: number;
}

export interface FakeBackendOptions {
  books?: FakeBook[];
  /** Overrides the GET /api/books body, e.g. to simulate a changed response shape. */
  booksResponse?: unknown;
  validToken?: string;
  /** Makes POST /api/auth/refresh reject every refresh token. */
  refreshRejected?: boolean;
}

export interface RecordedRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
}

const DEFAULT_BOOKS: FakeBook[] = [
  { id: '1', title: 'Clean Code', author: 'Robert Martin', price: 30, description: 'On craftsmanship.', stock: 4 },
  { id: '2', title: 'Refactoring', author: 'Martin Fowler', price: 40.5, stock: 0 },
];

export function installFakeBackend(options: FakeBackendOptions = {}) {
  const books = options.books ?? DEFAULT_BOOKS;
  let validToken = options.validToken ?? 'access-token';
  let refreshCount = 0;
  const registered = new Set<string>();
  const requests: RecordedRequest[] = [];

  const json = (status: number, body: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

  const fetchMock = jest.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const { pathname } = url;
    const query = Object.fromEntries(url.searchParams.entries());
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = (init.headers ?? {}) as Record<string, string>;
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ method, path: pathname, query, headers, body });

    const is = (route: { method: string; path: string }) => route.method === method && route.path === pathname;

    if (is(API_ROUTES.login)) {
      const user = Object.values(SEEDED_USERS).find(
        (u) => u.username === body?.username && u.password === body?.password,
      );
      return user
        ? json(200, { message: 'Login successful', username: user.username, token: validToken, refreshToken: 'refresh-token' })
        : json(401, { error: 'Unauthorized: Invalid credentials' });
    }
    if (is(API_ROUTES.register)) {
      const taken = registered.has(body?.username) || Object.values(SEEDED_USERS).some((u) => u.username === body?.username);
      if (taken) return json(409, { error: 'Conflict: Username already exists' });
      registered.add(body.username);
      return json(201, { message: 'Registration successful', username: body.username, token: validToken, refreshToken: 'refresh-token' });
    }
    if (is(API_ROUTES.refresh)) {
      if (options.refreshRejected) return json(403, { error: 'Forbidden: Invalid refresh token' });
      refreshCount += 1;
      validToken = `access-token-${refreshCount}`;
      return json(200, { success: true, username: SEEDED_USERS.testuser.username, token: validToken, refreshToken: `refresh-token-${refreshCount}` });
    }
    if (is(API_ROUTES.logout)) return json(200, { message: 'Logged out' });
    if (is(API_ROUTES.books)) {
      if (options.booksResponse !== undefined) return json(200, options.booksResponse);
      const q = (query.q ?? '').toLowerCase();
      const matches = books.filter((b) => b.title.toLowerCase().includes(q));
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 8);
      return json(200, {
        books: matches.slice((page - 1) * limit, page * limit),
        total: matches.length,
        page,
        totalPages: Math.ceil(matches.length / limit),
        limit,
      });
    }
    if (method === 'GET' && pathname.startsWith(`${API_ROUTES.books.path}/`)) {
      const book = books.find((b) => b.id === pathname.split('/').pop());
      return book ? json(200, book) : json(404, { error: 'Not Found: Book does not exist' });
    }
    if (is(API_ROUTES.profile)) {
      return headers.Authorization === `Bearer ${validToken}`
        ? json(200, { username: SEEDED_USERS.testuser.username })
        : json(403, { error: 'Forbidden: Invalid token' });
    }
    return json(404, { error: `Not Found: ${method} ${pathname}` });
  });

  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return {
    fetchMock,
    requests,
    /** Makes the access token the app holds invalid, as if it had expired. */
    expireAccessToken: () => {
      validToken = 'token-the-app-does-not-have';
    },
  };
}

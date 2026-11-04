import { API_ROUTES, SEEDED_USERS } from '@buggybooks/contracts';

/**
 * A fake of the backend at the network boundary (global fetch). It only answers
 * the method + path pairs from @buggybooks/contracts, so the app is tested with
 * its real API client and a wrong path fails the test with a 404, just as the
 * real backend would.
 */
export interface FakeBackendOptions {
  books?: { id: string; title: string }[];
  /** Overrides the GET /api/books body, e.g. to simulate a changed response shape. */
  booksResponse?: unknown;
  validToken?: string;
}

export interface RecordedRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
}

export function installFakeBackend(options: FakeBackendOptions = {}) {
  const books = options.books ?? [
    { id: '1', title: 'Clean Code' },
    { id: '2', title: 'Refactoring' },
  ];
  const validToken = options.validToken ?? 'access-token';
  const requests: RecordedRequest[] = [];

  const json = (status: number, body: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

  const fetchMock = jest.fn(async (input: string, init: RequestInit = {}) => {
    const { pathname } = new URL(input);
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = (init.headers ?? {}) as Record<string, string>;
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ method, path: pathname, headers, body });

    const is = (route: { method: string; path: string }) => route.method === method && route.path === pathname;

    if (is(API_ROUTES.login)) {
      const user = Object.values(SEEDED_USERS).find(
        (u) => u.username === body?.username && u.password === body?.password,
      );
      return user
        ? json(200, { message: 'Login successful', username: user.username, token: validToken, refreshToken: 'refresh-token' })
        : json(401, { error: 'Unauthorized: Invalid credentials' });
    }
    if (is(API_ROUTES.logout)) return json(200, { message: 'Logged out' });
    if (is(API_ROUTES.books)) return json(200, options.booksResponse ?? books);
    if (is(API_ROUTES.profile)) {
      return headers.Authorization === `Bearer ${validToken}`
        ? json(200, { username: SEEDED_USERS.testuser.username })
        : json(403, { error: 'Forbidden: Invalid token' });
    }
    return json(404, { error: `Not Found: ${method} ${pathname}` });
  });

  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return { fetchMock, requests };
}

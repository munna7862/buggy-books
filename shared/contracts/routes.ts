/**
 * Backend API routes used by non-browser clients.
 *
 * The backend keeps its own route strings in `backend/src/routes/api.ts`;
 * `backend/src/__tests__/contracts.test.ts` fails if they drift from this list.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRoute {
  readonly method: HttpMethod;
  readonly path: string;
}

export const API_ROUTES = {
  login: { method: 'POST', path: '/api/login' },
  register: { method: 'POST', path: '/api/register' },
  logout: { method: 'POST', path: '/api/logout' },
  refresh: { method: 'POST', path: '/api/auth/refresh' },
  books: { method: 'GET', path: '/api/books' },
  bookById: { method: 'GET', path: '/api/books/:id' },
  cart: { method: 'GET', path: '/api/cart' },
  addToCart: { method: 'POST', path: '/api/cart' },
  clearCart: { method: 'DELETE', path: '/api/cart' },
  removeFromCart: { method: 'DELETE', path: '/api/cart/:bookId' },
  checkout: { method: 'POST', path: '/api/checkout/process' },
  orders: { method: 'GET', path: '/api/orders' },
  profile: { method: 'GET', path: '/api/profile' },
  profileUpload: { method: 'POST', path: '/api/profile/upload' },
  health: { method: 'GET', path: '/api/health' },
  testConfig: { method: 'GET', path: '/api/test/config' },
  updateTestConfig: { method: 'POST', path: '/api/test/config' },
  testReset: { method: 'POST', path: '/api/test/reset' },
} as const satisfies Record<string, ApiRoute>;

export type ApiRouteName = keyof typeof API_ROUTES;

/**
 * Fills `:param` placeholders in a route path, URI-encoding each value.
 * Throws if a placeholder has no value, so a missing ID never reaches the network.
 */
export function buildPath(path: string, params: Record<string, string> = {}): string {
  return path.replace(/:([A-Za-z]+)/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(`Missing route parameter "${name}" for ${path}`);
    }
    return encodeURIComponent(value);
  });
}

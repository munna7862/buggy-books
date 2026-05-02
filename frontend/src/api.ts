const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const TOKEN_KEY = 'dummyAccessToken';

const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Fix #5: Centralized request helper.
 * - Always checks res.ok and throws a descriptive Error on failure.
 * - On 401, clears the stale token and redirects to /login automatically.
 */
const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const res = await fetch(url, options);

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
    return;
  }

  const contentType = res.headers.get('content-type');
  let data: any;

  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(
      `Expected JSON response but received ${contentType || 'unknown'}. ` +
      `This often happens when the API URL is incorrect or the server is returning an HTML error page. ` +
      `Response start: ${text.substring(0, 100)}...`
    );
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
};

export const api = {
  login: async (username: string, password: string) => {
    const data = await apiRequest(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  register: async (username: string, password: string, fullName?: string) => {
    const data = await apiRequest(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, fullName }),
    });
    if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getBooks: async () => {
    return apiRequest(`${BASE_URL}/books`);
  },

  getCart: async () => {
    return apiRequest(`${BASE_URL}/cart`, { headers: getHeaders() });
  },

  addToCart: async (bookId: string) => {
    return apiRequest(`${BASE_URL}/cart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bookId }),
    });
  },

  removeFromCart: async (bookId: string) => {
    return apiRequest(`${BASE_URL}/cart/${bookId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  clearCart: async () => {
    return apiRequest(`${BASE_URL}/cart`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  checkout: async (payload: { firstName: string, lastName: string, creditCard: string }) => {
    return apiRequest(`${BASE_URL}/checkout/process`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  },
};

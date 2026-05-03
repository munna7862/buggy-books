const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Fix #5: Centralized request helper.
 * - Always checks res.ok and throws a descriptive Error on failure.
 * - On 401, clears the stale storage and redirects to /login automatically.
 * - Includes credentials for httpOnly cookies.
 */
const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const mergedOptions = {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  };

  const res = await fetch(url, mergedOptions);

  if (res.status === 401) {
    localStorage.removeItem('authUser');
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
    return apiRequest(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username: string, password: string, fullName?: string) => {
    return apiRequest(`${BASE_URL}/register`, {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName }),
    });
  },

  logout: async () => {
    return apiRequest(`${BASE_URL}/logout`, { method: 'POST' });
  },

  getBooks: async (params?: { q?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest(`${BASE_URL}/books${qs ? `?${qs}` : ''}`);
  },

  getBookById: async (id: string) => {
    return apiRequest(`${BASE_URL}/books/${id}`);
  },

  getCart: async () => {
    return apiRequest(`${BASE_URL}/cart`);
  },

  addToCart: async (bookId: string) => {
    return apiRequest(`${BASE_URL}/cart`, {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    });
  },

  removeFromCart: async (bookId: string) => {
    return apiRequest(`${BASE_URL}/cart/${bookId}`, {
      method: 'DELETE',
    });
  },

  clearCart: async () => {
    return apiRequest(`${BASE_URL}/cart`, {
      method: 'DELETE',
    });
  },

  checkout: async (payload: { firstName: string, lastName: string, creditCard: string }) => {
    return apiRequest(`${BASE_URL}/checkout/process`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

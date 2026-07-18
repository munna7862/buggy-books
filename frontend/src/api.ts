const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// --- CSRF Token Management ---
let csrfToken: string | null = null;

const fetchCsrfToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${BASE_URL}/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken;
      return csrfToken!;
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err);
  }
  return '';
};

/**
 * Fix #5: Centralized request helper.
 * - Always checks res.ok and throws a descriptive Error on failure.
 * - On 401, clears the stale storage and redirects to /login automatically.
 * - Includes credentials for httpOnly cookies.
 */
const processResponse = async (res: Response): Promise<any> => {
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

const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const isFormData = options?.body instanceof FormData;
  const isMutating = options?.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method);

  // Fetch CSRF token for mutating requests (skip for auth endpoints)
  let csrfHeader: Record<string, string> = {};
  if (isMutating && !url.includes('/login') && !url.includes('/register') && !url.includes('/logout') && !url.includes('/auth/refresh')) {
    const token = await fetchCsrfToken();
    if (token) {
      csrfHeader = { 'x-csrf-token': token };
    }
  }

  const mergedOptions = {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...csrfHeader,
      ...(options?.headers || {})
    }
  };

  const res = await fetch(url, mergedOptions);

  if (res.status === 401 && !url.includes('/login') && !url.includes('/register')) {
    // If the refresh request itself fails with 401/403, redirect to login
    if (url.includes('/auth/refresh')) {
      csrfToken = null;
      localStorage.removeItem('authUser');
      window.location.href = '/login';
      return;
    }

    try {
      // Attempt silent refresh
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (refreshRes.ok) {
        csrfToken = null; // Clear cached token for the refreshed session
        // Retry original request
        const retryRes = await fetch(url, mergedOptions);
        if (retryRes.status === 401) {
          localStorage.removeItem('authUser');
          window.location.href = '/login';
          return;
        }
        return processResponse(retryRes);
      }
    } catch (err) {
      console.error('Silent token refresh failed:', err);
    }

    csrfToken = null;
    localStorage.removeItem('authUser');
    window.location.href = '/login';
    return;
  }

  return processResponse(res);
};

export const api = {
  login: async (username: string, password: string) => {
    csrfToken = null;
    return apiRequest(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username: string, password: string, fullName?: string) => {
    csrfToken = null;
    return apiRequest(`${BASE_URL}/register`, {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName }),
    });
  },

  logout: async () => {
    csrfToken = null;
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

  getProfile: async () => {
    return apiRequest(`${BASE_URL}/profile`);
  },

  uploadAvatar: async (formData: FormData) => {
    return apiRequest(`${BASE_URL}/profile/upload`, {
      method: 'POST',
      body: formData,
    });
  },
};

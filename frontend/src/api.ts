import type { Book, CartItem, PaginatedBooks, ChaosConfig, Order } from '@buggybooks/types';

export interface AuthResponse {
  message: string;
  username: string;
  token?: string;
}

export interface ProfileResponse {
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  avatarUrl: string;
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  orderId?: string;
}

export interface MessageResponse {
  message?: string;
  success?: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// --- CSRF Token Management ---
let csrfToken: string | null = null;

const fetchCsrfToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${BASE_URL}/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      const data = (await res.json()) as { csrfToken?: string };
      csrfToken = data.csrfToken || null;
      return csrfToken || '';
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err);
  }
  return '';
};

/**
 * Centralized request response processor.
 * - Always checks res.ok and throws a descriptive Error on failure.
 * - Parses JSON safely and rejects unexpected content types.
 */
const processResponse = async <T = unknown>(res: Response): Promise<T> => {
  const contentType = res.headers.get('content-type');
  let data: Record<string, unknown>;

  if (contentType && contentType.includes('application/json')) {
    data = (await res.json()) as Record<string, unknown>;
  } else {
    const text = await res.text();
    throw new Error(
      `Expected JSON response but received ${contentType || 'unknown'}. ` +
      `This often happens when the API URL is incorrect or the server is returning an HTML error page. ` +
      `Response start: ${text.substring(0, 100)}...`
    );
  }

  if (!res.ok) {
    const errorMessage = typeof data.error === 'string' ? data.error : `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return data as unknown as T;
};

const apiRequest = async <T = unknown>(url: string, options?: RequestInit): Promise<T> => {
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

  const mergedOptions: RequestInit = {
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
      return undefined as unknown as T;
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
          return undefined as unknown as T;
        }
        return processResponse<T>(retryRes);
      }
    } catch (err) {
      console.error('Silent token refresh failed:', err);
    }

    csrfToken = null;
    localStorage.removeItem('authUser');
    window.location.href = '/login';
    return undefined as unknown as T;
  }

  return processResponse<T>(res);
};

export const api = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    csrfToken = null;
    return apiRequest<AuthResponse>(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username: string, password: string, fullName?: string): Promise<AuthResponse> => {
    csrfToken = null;
    return apiRequest<AuthResponse>(`${BASE_URL}/register`, {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName }),
    });
  },

  logout: async (): Promise<MessageResponse> => {
    csrfToken = null;
    return apiRequest<MessageResponse>(`${BASE_URL}/logout`, { method: 'POST' });
  },

  getBooks: async (params?: { q?: string; page?: number; limit?: number }): Promise<PaginatedBooks> => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<PaginatedBooks>(`${BASE_URL}/books${qs ? `?${qs}` : ''}`);
  },

  getBookById: async (id: string): Promise<Book> => {
    return apiRequest<Book>(`${BASE_URL}/books/${id}`);
  },

  getCart: async (): Promise<CartItem[]> => {
    return apiRequest<CartItem[]>(`${BASE_URL}/cart`);
  },

  addToCart: async (bookId: string): Promise<CartItem[]> => {
    return apiRequest<CartItem[]>(`${BASE_URL}/cart`, {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    });
  },

  removeFromCart: async (bookId: string): Promise<CartItem[]> => {
    return apiRequest<CartItem[]>(`${BASE_URL}/cart/${bookId}`, {
      method: 'DELETE',
    });
  },

  clearCart: async (): Promise<MessageResponse> => {
    return apiRequest<MessageResponse>(`${BASE_URL}/cart`, {
      method: 'DELETE',
    });
  },

  checkout: async (payload: { firstName: string; lastName: string; creditCard: string }): Promise<CheckoutResponse> => {
    return apiRequest<CheckoutResponse>(`${BASE_URL}/checkout/process`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProfile: async (): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>(`${BASE_URL}/profile`);
  },

  uploadAvatar: async (formData: FormData): Promise<UploadAvatarResponse> => {
    return apiRequest<UploadAvatarResponse>(`${BASE_URL}/profile/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  getChaosConfig: async (): Promise<ChaosConfig> => {
    return apiRequest<ChaosConfig>(`${BASE_URL}/test/config`);
  },

  updateChaosConfig: async (config: Partial<ChaosConfig>): Promise<{ success: boolean; config: ChaosConfig }> => {
    return apiRequest<{ success: boolean; config: ChaosConfig }>(`${BASE_URL}/test/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  resetChaosConfig: async (): Promise<MessageResponse> => {
    return apiRequest<MessageResponse>(`${BASE_URL}/test/reset`, {
      method: 'POST',
    });
  },
};

export type { Book, CartItem, PaginatedBooks, ChaosConfig, Order };


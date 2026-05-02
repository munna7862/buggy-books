const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';


const getHeaders = () => {
  const token = localStorage.getItem('dummyAccessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    if (data.token) {
      localStorage.setItem('dummyAccessToken', data.token);
    }
    return data;
  },

  register: async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    if (data.token) {
      localStorage.setItem('dummyAccessToken', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('dummyAccessToken');
  },

  getBooks: async () => {
    const res = await fetch(`${BASE_URL}/books`);
    return res.json();
  },

  getCart: async () => {
    const res = await fetch(`${BASE_URL}/cart`, {
      headers: getHeaders()
    });
    return res.json();
  },

  addToCart: async (bookId: string) => {
    const res = await fetch(`${BASE_URL}/cart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bookId })
    });
    return res.json();
  },

  checkout: async () => {
    const res = await fetch(`${BASE_URL}/checkout/process`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
        throw new Error('Checkout failed');
    }
    return res.json();
  }
};

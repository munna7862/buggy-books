import { renderHook, waitFor } from '@testing-library/react';
import { useCart } from './useCart';
import { api } from '../api';
import { AuthProvider } from '../AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the api module
vi.mock('../api', () => ({
  api: {
    getCart: vi.fn(),
  },
}));

describe('useCart Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should not fetch cart when user is unauthenticated', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Verify api.getCart was not called
    expect(api.getCart).not.toHaveBeenCalled();
    expect(result.current.cart).toEqual([]);
  });

  it('should fetch cart when user is authenticated', async () => {
    const mockCartItems = [{ id: '1', title: 'Test Book 1', price: 9.99, quantity: 1 }];
    vi.mocked(api.getCart).mockResolvedValue(mockCartItems);

    // Simulate authenticated state by setting localStorage before mounting AuthProvider
    localStorage.setItem('authUser', 'testuser');

    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Verify api.getCart is called and items are fetched
    await waitFor(() => {
      expect(api.getCart).toHaveBeenCalled();
      expect(result.current.cart).toEqual(mockCartItems);
    });
  });
});

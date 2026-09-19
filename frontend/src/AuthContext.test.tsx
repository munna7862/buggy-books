import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from './api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  api: {
    logout: vi.fn(),
    onUnauthorized: vi.fn(),
  },
}));

describe('AuthContext and useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('throws an error when useAuth is used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });

  it('initializes with unauthenticated state when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.username).toBeNull();
  });

  it('initializes with authenticated state when localStorage has authUser', () => {
    localStorage.setItem('authUser', 'saved_user');

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.username).toBe('saved_user');
  });

  it('logs in user and persists to localStorage', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    act(() => {
      result.current.login('alice_tester');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.username).toBe('alice_tester');
    expect(localStorage.getItem('authUser')).toBe('alice_tester');
  });

  it('logs out user and clears localStorage', async () => {
    localStorage.setItem('authUser', 'alice_tester');
    vi.mocked(api.logout).mockResolvedValue({ message: 'Logged out' });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(api.logout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.username).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();
  });

  it('clears state locally even if api.logout() throws an error', async () => {
    localStorage.setItem('authUser', 'alice_tester');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.logout).mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.username).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();
    consoleSpy.mockRestore();
  });

  it('triggers unauthorized handler with onNavigate prop', () => {
    let capturedUnauthorizedCallback: (() => void) | null = null;
    vi.mocked(api.onUnauthorized).mockImplementation((cb) => {
      if (typeof cb === 'function') {
        capturedUnauthorizedCallback = cb as () => void;
      }
    });

    const mockNavigate = vi.fn();
    localStorage.setItem('authUser', 'bob');

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider onNavigate={mockNavigate}>{children}</AuthProvider>,
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(capturedUnauthorizedCallback).not.toBeNull();

    act(() => {
      capturedUnauthorizedCallback!();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.username).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('dispatches auth:navigate custom event when no onNavigate callback is provided', () => {
    let capturedUnauthorizedCallback: (() => void) | null = null;
    vi.mocked(api.onUnauthorized).mockImplementation((cb) => {
      if (typeof cb === 'function') {
        capturedUnauthorizedCallback = cb as () => void;
      }
    });

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    act(() => {
      capturedUnauthorizedCallback!();
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth:navigate',
        detail: { path: '/login' },
      })
    );
    dispatchEventSpy.mockRestore();
  });

  it('supports updating navigate callback via setNavigateHandler', () => {
    let capturedUnauthorizedCallback: (() => void) | null = null;
    vi.mocked(api.onUnauthorized).mockImplementation((cb) => {
      if (typeof cb === 'function') {
        capturedUnauthorizedCallback = cb as () => void;
      }
    });

    const customHandler = vi.fn();

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    act(() => {
      result.current.setNavigateHandler(customHandler);
    });

    act(() => {
      capturedUnauthorizedCallback!();
    });

    expect(customHandler).toHaveBeenCalledWith('/login');
  });

  it('syncs authentication state on window storage event', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.isAuthenticated).toBe(false);

    // Simulate login in another tab
    localStorage.setItem('authUser', 'tab_user');
    act(() => {
      window.dispatchEvent(new Event('storage'));
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.username).toBe('tab_user');

    // Simulate logout in another tab
    localStorage.removeItem('authUser');
    act(() => {
      window.dispatchEvent(new Event('storage'));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.username).toBeNull();
  });
});

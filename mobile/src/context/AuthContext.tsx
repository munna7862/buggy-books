import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { AuthUser, AuthTokensResponse } from '@buggybooks/types';
import { apiClient, onAuthExpired } from '../api/client';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/storage';
import { decodeJwtPayload } from '../utils/jwt';

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout').catch(() => {});
    } finally {
      await clearTokens();
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Hydrate session from SecureStore on startup (offline-capable)
  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        const [storedToken, storedRefreshToken] = await Promise.all([
          getAccessToken(),
          getRefreshToken(),
        ]);

        if (storedToken && storedRefreshToken && isMounted) {
          const payload = decodeJwtPayload(storedToken);
          if (payload?.username) {
            setUser({
              username: payload.username,
              fullName: payload.fullName,
              type: payload.type || 'access',
            });
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setIsAuthenticated(true);
          } else {
            // Invalid payload structure, purge stored tokens
            await clearTokens();
          }
        }
      } catch {
        // Fallback to unauthenticated on storage retrieval failure
        await clearTokens();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    // Subscribe to automatic logout when refresh interceptor rejects
    const unsubscribe = onAuthExpired(() => {
      if (isMounted) {
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await apiClient.post<AuthTokensResponse>('/api/auth/login', {
        username,
        password,
      });

      const { token: newAccessToken, refreshToken: newRefreshToken, username: returnedUsername } = response.data;

      if (!newAccessToken || !newRefreshToken) {
        return { success: false, error: 'Incomplete authentication response from server' };
      }

      await saveTokens(newAccessToken, newRefreshToken);

      const payload = decodeJwtPayload(newAccessToken);
      const userObj: AuthUser = {
        username: returnedUsername || payload?.username || username,
        fullName: payload?.fullName,
        type: payload?.type || 'access',
      };

      setUser(userObj);
      setToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setIsAuthenticated(true);

      return { success: true };
    } catch (err: unknown) {
      let errorMessage = 'Invalid username or password';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
        errorMessage = axiosErr.response?.data?.error || axiosErr.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (username: string, password: string, fullName?: string) => {
    try {
      const response = await apiClient.post<AuthTokensResponse>('/api/auth/register', {
        username,
        password,
        fullName,
      });

      const { token: newAccessToken, refreshToken: newRefreshToken, username: returnedUsername } = response.data;

      if (newAccessToken && newRefreshToken) {
        await saveTokens(newAccessToken, newRefreshToken);

        const payload = decodeJwtPayload(newAccessToken);
        const userObj: AuthUser = {
          username: returnedUsername || payload?.username || username,
          fullName: fullName || payload?.fullName,
          type: payload?.type || 'access',
        };

        setUser(userObj);
        setToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (err: unknown) {
      let errorMessage = 'Registration failed';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
        errorMessage = axiosErr.response?.data?.error || axiosErr.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

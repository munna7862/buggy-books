import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_ROUTES } from '@buggybooks/contracts';
import { ApiError, apiRequest } from '../api/client';
import { clearTokens, loadTokens, saveTokens } from './tokenStorage';

interface LoginResponse {
  username: string;
  token: string;
  refreshToken: string;
}

interface ProfileResponse {
  username: string;
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; username: string; token: string };

interface AuthContextValue {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Restore a stored session, but only if the backend still accepts the token.
  // Silent refresh arrives in Sprint M1.1; until then an expired token signs the user out.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadTokens();
        if (!stored) {
          if (active) setState({ status: 'signedOut' });
          return;
        }
        const profile = await apiRequest<ProfileResponse>(API_ROUTES.profile, { token: stored.token });
        if (active) setState({ status: 'signedIn', username: profile.username, token: stored.token });
      } catch {
        await clearTokens().catch(() => undefined);
        if (active) setState({ status: 'signedOut' });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiRequest<LoginResponse>(API_ROUTES.login, { body: { username, password } });
    if (!result?.token || !result.refreshToken) {
      throw new ApiError('The server did not return a session token', 500);
    }
    await saveTokens({ token: result.token, refreshToken: result.refreshToken });
    setState({ status: 'signedIn', username: result.username, token: result.token });
  }, []);

  const logout = useCallback(async () => {
    const token = state.status === 'signedIn' ? state.token : null;
    // Best effort: the session ends locally even if the server is unreachable.
    await apiRequest(API_ROUTES.logout, { token }).catch(() => undefined);
    await clearTokens();
    setState({ status: 'signedOut' });
  }, [state]);

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { type ApiRoute, API_ROUTES } from '@buggybooks/contracts';
import { ApiError, apiRequest, type RequestOptions } from '../api/client';
import { clearTokens, loadTokens, saveTokens, type StoredTokens } from './tokenStorage';

interface SessionResponse {
  username: string;
  token: string;
  refreshToken: string;
}

interface ProfileResponse {
  username: string;
}

export type AuthState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; username: string };

export interface RegisterInput {
  username: string;
  password: string;
  fullName?: string;
}

interface AuthContextValue {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Sends the access token, and on rejection refreshes it silently and retries once. */
  authedRequest: <T>(route: ApiRoute, options?: Omit<RequestOptions, 'token'>) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isAuthRejection(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const tokens = useRef<StoredTokens | null>(null);
  const refreshInFlight = useRef<Promise<string> | null>(null);

  const endSession = useCallback(async () => {
    tokens.current = null;
    await clearTokens().catch(() => undefined);
    setState({ status: 'signedOut' });
  }, []);

  const refreshAccessToken = useCallback((): Promise<string> => {
    // Refresh tokens are single use, so concurrent callers must share one refresh.
    refreshInFlight.current ??= (async () => {
      const used = tokens.current?.refreshToken;
      if (!used) throw new ApiError('Not signed in', 401);
      try {
        const result = await apiRequest<SessionResponse>(API_ROUTES.refresh, { body: { refreshToken: used } });
        if (!result?.token || !result.refreshToken) {
          throw new ApiError('The server did not return a session token', 500);
        }
        // Signed out while the refresh was running: don't bring the session back.
        if (tokens.current?.refreshToken !== used) throw new ApiError('Not signed in', 401);
        const next = { token: result.token, refreshToken: result.refreshToken };
        tokens.current = next;
        await saveTokens(next);
        return next.token;
      } catch (err) {
        if (isAuthRejection(err)) await endSession();
        throw err;
      } finally {
        refreshInFlight.current = null;
      }
    })();
    return refreshInFlight.current;
  }, [endSession]);

  const authedRequest = useCallback(
    async <T,>(route: ApiRoute, options: Omit<RequestOptions, 'token'> = {}): Promise<T> => {
      const token = tokens.current?.token;
      if (!token) throw new ApiError('Not signed in', 401);
      try {
        return await apiRequest<T>(route, { ...options, token });
      } catch (err) {
        if (!isAuthRejection(err)) throw err;
      }
      const refreshed = await refreshAccessToken();
      try {
        return await apiRequest<T>(route, { ...options, token: refreshed });
      } catch (err) {
        if (isAuthRejection(err)) await endSession();
        throw err;
      }
    },
    [endSession, refreshAccessToken],
  );

  // Restore a stored session. If the server can't be reached, show the login
  // screen but keep the stored tokens so the next launch can restore the session.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadTokens();
        if (!stored) {
          if (active) setState({ status: 'signedOut' });
          return;
        }
        tokens.current = stored;
        const profile = await authedRequest<ProfileResponse>(API_ROUTES.profile);
        if (active) setState({ status: 'signedIn', username: profile.username });
      } catch {
        if (active) setState({ status: 'signedOut' });
      }
    })();
    return () => {
      active = false;
    };
  }, [authedRequest]);

  const startSession = useCallback(async (result: SessionResponse) => {
    if (!result?.token || !result.refreshToken) {
      throw new ApiError('The server did not return a session token', 500);
    }
    const next = { token: result.token, refreshToken: result.refreshToken };
    tokens.current = next;
    await saveTokens(next);
    setState({ status: 'signedIn', username: result.username });
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      await startSession(await apiRequest<SessionResponse>(API_ROUTES.login, { body: { username, password } }));
    },
    [startSession],
  );

  const register = useCallback(
    async ({ username, password, fullName }: RegisterInput) => {
      await startSession(await apiRequest<SessionResponse>(API_ROUTES.register, { body: { username, password, fullName } }));
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokens.current?.refreshToken;
    // Best effort: the session ends locally even if the server is unreachable.
    await apiRequest(API_ROUTES.logout, { body: { refreshToken } }).catch(() => undefined);
    await endSession();
  }, [endSession]);

  const value = useMemo(
    () => ({ state, login, register, logout, authedRequest }),
    [state, login, register, logout, authedRequest],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

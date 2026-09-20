import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/storage';

type AuthExpiredListener = () => void;
const authExpiredListeners: Set<AuthExpiredListener> = new Set();

export function onAuthExpired(listener: AuthExpiredListener): () => void {
  authExpiredListeners.add(listener);
  return () => {
    authExpiredListeners.delete(listener);
  };
}

function notifyAuthExpired(): void {
  authExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener error
    }
  });
}

/**
 * Resolves the appropriate backend API base URL depending on runtime environment:
 * 1. process.env.EXPO_PUBLIC_API_URL (manual override or CI adb reverse)
 * 2. Physical device LAN IP via Constants.expoConfig?.hostUri
 * 3. Android Emulator (10.0.2.2:4000)
 * 4. iOS Simulator / Web (localhost:4000)
 */
export function getBaseUrl(): string {
  const envApiUrl = (process.env as Record<string, string | undefined>)['EXPO_PUBLIC_API_URL'] ||
    (process.env as Record<string, string | undefined>)['API_URL'];
  if (envApiUrl) {
    return envApiUrl;
  }

  // Check if running in Expo Go or development client with hostUri on physical device
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:4000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Mutex queue state for silent token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Request Interceptor: Attach Bearer token to outgoing requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Avoid attaching expired token to the refresh request itself
    if (config.url?.includes('/api/auth/refresh')) {
      return config;
    }

    try {
      const token = await getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Proceed without token if secure store access fails
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized & 403 Forbidden token expiration with Mutex Queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage = (errorData?.error || errorData?.message || '').toLowerCase();

    // Check if error is due to token expiration/invalidity
    const isTokenError =
      status === 401 ||
      (status === 403 && (errorMessage.includes('token') || errorMessage.includes('invalid')));

    // Do not attempt refresh on auth login, register, or refresh failures
    const isAuthRoute =
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/register') ||
      originalRequest.url?.includes('/api/auth/refresh');

    if (!isTokenError || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is already performing refresh: queue this request until resolution
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient.request(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = await getRefreshToken();

      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      // Use a clean axios instance to bypass interceptors
      const refreshResponse = await axios.post<{
        success?: boolean;
        token: string;
        refreshToken: string;
        username?: string;
      }>(
        `${getBaseUrl()}/api/auth/refresh`,
        { refreshToken: storedRefreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Refresh endpoint returned incomplete token pair');
      }

      await saveTokens(newAccessToken, newRefreshToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      processQueue(null, newAccessToken);
      return apiClient.request(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      notifyAuthExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

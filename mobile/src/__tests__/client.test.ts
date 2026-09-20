import axios from 'axios';
import { apiClient, getBaseUrl, onAuthExpired } from '../api/client';
import * as storage from '../utils/storage';

jest.mock('../utils/storage');
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '192.168.1.100:8081',
  },
}));

describe('Mobile API Client & Refresh Mutex', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalEnv;
  });

  it('resolves baseURL from EXPO_PUBLIC_API_URL when provided', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:4000';
    expect(getBaseUrl()).toBe('http://127.0.0.1:4000');
  });

  it('attaches Authorization Bearer header when access token is present', async () => {
    (storage.getAccessToken as jest.Mock).mockResolvedValueOnce('mock-access-token');

    // Run request interceptor
    const requestInterceptor = (apiClient.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (config: unknown) => Promise<unknown> }>;
    }).handlers[0].fulfilled;

    const config = { headers: {} as Record<string, string>, url: '/api/books' };
    const modifiedConfig = (await requestInterceptor(config)) as typeof config;

    expect(modifiedConfig.headers.Authorization).toBe('Bearer mock-access-token');
  });

  it('does not attach Bearer token to refresh request itself', async () => {
    (storage.getAccessToken as jest.Mock).mockResolvedValueOnce('expired-token');

    const requestInterceptor = (apiClient.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (config: unknown) => Promise<unknown> }>;
    }).handlers[0].fulfilled;

    const config = { headers: {} as Record<string, string>, url: '/api/auth/refresh' };
    const modifiedConfig = (await requestInterceptor(config)) as typeof config;

    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });

  it('intercepts 403 Invalid token and serializes concurrent calls via mutex queue (MOB_AUTH_04)', async () => {
    (storage.getRefreshToken as jest.Mock).mockResolvedValue('mock-refresh-token');
    (storage.saveTokens as jest.Mock).mockResolvedValue(undefined);

    const axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/auth/refresh')) {
        return {
          data: {
            token: 'new-rotated-access-token',
            refreshToken: 'new-rotated-refresh-token',
            username: 'testuser',
          },
        };
      }
      return { data: {} };
    });

    const responseInterceptorError = (apiClient.interceptors.response as unknown as {
      handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>;
    }).handlers[0].rejected;

    const requestSpy = jest.spyOn(apiClient, 'request').mockImplementation(async (cfg) => {
      return { data: 'success', config: cfg, status: 200, statusText: 'OK', headers: {} };
    });

    const mockError1 = {
      config: { headers: {}, url: '/api/cart' },
      response: { status: 403, data: { error: 'Forbidden: Invalid token' } },
    };

    const mockError2 = {
      config: { headers: {}, url: '/api/profile' },
      response: { status: 403, data: { error: 'Forbidden: Invalid token' } },
    };

    // Trigger two simultaneous 403 failures
    const [res1, res2] = await Promise.all([
      responseInterceptorError(mockError1),
      responseInterceptorError(mockError2),
    ]);

    // Mutex should have executed exactly ONE refresh post
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    expect(storage.saveTokens).toHaveBeenCalledWith(
      'new-rotated-access-token',
      'new-rotated-refresh-token'
    );

    expect(res1).toBeDefined();
    expect(res2).toBeDefined();

    axiosPostSpy.mockRestore();
    requestSpy.mockRestore();
  });

  it('purges tokens and dispatches logout on refresh rejection', async () => {
    (storage.getRefreshToken as jest.Mock).mockResolvedValue('bad-refresh-token');
    (storage.clearTokens as jest.Mock).mockResolvedValue(undefined);

    const authExpiredCallback = jest.fn();
    const unsubscribe = onAuthExpired(authExpiredCallback);

    const axiosPostSpy = jest.spyOn(axios, 'post').mockRejectedValueOnce(
      new Error('Token refresh rejected')
    );

    const responseInterceptorError = (apiClient.interceptors.response as unknown as {
      handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>;
    }).handlers[0].rejected;

    const mockError = {
      config: { headers: {}, url: '/api/cart' },
      response: { status: 401, data: { error: 'Unauthorized' } },
    };

    await expect(responseInterceptorError(mockError)).rejects.toThrow();

    expect(storage.clearTokens).toHaveBeenCalled();
    expect(authExpiredCallback).toHaveBeenCalled();

    unsubscribe();
    axiosPostSpy.mockRestore();
  });
});

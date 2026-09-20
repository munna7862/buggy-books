import * as SecureStore from 'expo-secure-store';
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  STORAGE_KEYS,
} from '../utils/storage';
import { decodeJwtPayload } from '../utils/jwt';

declare const Buffer: {
  from: (str: string, encoding?: string) => {
    toString: (encoding?: string) => string;
  };
};

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn(async (key: string) => {
      return store[key] || null;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    __clearMockStore: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
});

describe('Mobile SecureStore Token Storage', () => {
  beforeEach(() => {
    (SecureStore as unknown as { __clearMockStore: () => void }).__clearMockStore();
    jest.clearAllMocks();
  });

  it('persists access and refresh tokens to SecureStore (MOB_AUTH_01)', async () => {
    await saveTokens('jwt-access-abc', 'jwt-refresh-xyz');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      'jwt-access-abc'
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.REFRESH_TOKEN,
      'jwt-refresh-xyz'
    );

    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    expect(accessToken).toBe('jwt-access-abc');
    expect(refreshToken).toBe('jwt-refresh-xyz');
  });

  it('retrieves null when tokens are not set', async () => {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  it('correctly decodes JWT payload', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ username: 'storedUser', fullName: 'Stored User' })).toString('base64');
    const token = `${header}.${payload}.signature`;
    const decoded = decodeJwtPayload(token);
    expect(decoded).toEqual({ username: 'storedUser', fullName: 'Stored User' });
  });

  it('clears stored tokens on logout (MOB_AUTH_05)', async () => {
    await saveTokens('jwt-access-abc', 'jwt-refresh-xyz');
    await clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);

    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});

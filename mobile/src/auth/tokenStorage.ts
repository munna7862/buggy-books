import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'buggybooks.accessToken';
const REFRESH_TOKEN_KEY = 'buggybooks.refreshToken';

export interface StoredTokens {
  token: string;
  refreshToken: string;
}

export async function saveTokens({ token, refreshToken }: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [token, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  return token && refreshToken ? { token, refreshToken } : null;
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

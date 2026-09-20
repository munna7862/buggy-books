import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'buggybooks_token',
  REFRESH_TOKEN: 'buggybooks_refresh_token',
} as const;

/**
 * Persists the access and refresh tokens to hardware-backed secure storage.
 */
export async function saveTokens(token: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

/**
 * Retrieves the stored access token from secure storage.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Retrieves the stored refresh token from secure storage.
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Clears all authentication tokens from secure storage.
 */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN).catch(() => {}),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN).catch(() => {}),
  ]);
}

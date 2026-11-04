// In-memory stand-in for the native Keychain/Keystore used by expo-secure-store.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

// Safe-area insets come from native code; the library ships a Jest mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use import
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

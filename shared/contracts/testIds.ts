/**
 * `testID`s for the mobile app. The app sets these on its elements and
 * the Maestro flows reference them through generated `-e` variables
 * (see `mobile-automation/scripts/maestro-env.ts`), so an ID can never
 * exist in a flow but not in the app.
 *
 * These are the clean baseline IDs. Obfuscated IDs are a Phase M2 chaos
 * option and will be switched on through the chaos config.
 */
export const MOBILE_TEST_IDS = {
  app: {
    loading: 'app-loading',
  },
  login: {
    screen: 'login-screen',
    username: 'login-username',
    password: 'login-password',
    submit: 'login-submit',
    error: 'login-error',
  },
  catalog: {
    screen: 'catalog-screen',
    welcome: 'catalog-welcome',
    bookCount: 'catalog-book-count',
    error: 'catalog-error',
    logout: 'catalog-logout',
  },
} as const;

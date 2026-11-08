/**
 * `testID`s for the mobile app. The app sets these on its elements and
 * the Maestro flows reference them through generated `-e` variables
 * (see `mobile-automation/scripts/maestro-env.ts`), so an ID can never
 * exist in a flow but not in the app.
 *
 * These are the clean baseline IDs. Obfuscated IDs are a Phase M2 chaos
 * option and will be switched on through the chaos config.
 */
/** Android application ID. Used by app.config.ts and as the Maestro `appId`. */
export const MOBILE_APP_ID = 'com.buggybooks.app';

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
    registerLink: 'login-register-link',
  },
  register: {
    screen: 'register-screen',
    fullName: 'register-full-name',
    username: 'register-username',
    password: 'register-password',
    submit: 'register-submit',
    error: 'register-error',
    loginLink: 'register-login-link',
  },
  catalog: {
    screen: 'catalog-screen',
    welcome: 'catalog-welcome',
    bookCount: 'catalog-book-count',
    error: 'catalog-error',
    retry: 'catalog-retry',
    logout: 'catalog-logout',
    search: 'catalog-search',
    list: 'catalog-list',
    empty: 'catalog-empty',
    loadMore: 'catalog-load-more',
  },
  bookDetail: {
    screen: 'book-detail-screen',
    back: 'book-detail-back',
    title: 'book-detail-title',
    author: 'book-detail-author',
    price: 'book-detail-price',
    stock: 'book-detail-stock',
    description: 'book-detail-description',
    error: 'book-detail-error',
    retry: 'book-detail-retry',
  },
} as const;

/** `testID` of a book's row in the catalog list. */
export function bookRowTestId(bookId: string): string {
  return `catalog-book-${bookId}`;
}

import { API_ROUTES, MOBILE_TEST_IDS, SEEDED_USERS } from '@buggybooks/contracts';

export const APP_ID = 'com.buggybooks.app';

/** Converts camelCase to UPPER_SNAKE_CASE, e.g. bookCount -> BOOK_COUNT. */
function toEnvKey(...parts: string[]): string {
  return parts.map((p) => p.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()).join('_');
}

/**
 * Builds the variables the Maestro flows use, all from @buggybooks/contracts:
 * LOGIN_USERNAME, CATALOG_WELCOME, USER_TESTUSER_PASSWORD, RESET_PATH, ...
 */
export function maestroEnv(backendUrl: string): Record<string, string> {
  const env: Record<string, string> = { APP_ID, BACKEND_URL: backendUrl, RESET_PATH: API_ROUTES.testReset.path };

  for (const [screen, ids] of Object.entries(MOBILE_TEST_IDS)) {
    for (const [name, id] of Object.entries(ids)) env[toEnvKey(screen, name)] = id;
  }
  for (const [key, user] of Object.entries(SEEDED_USERS)) {
    env[toEnvKey('user', key, 'username')] = user.username;
    env[toEnvKey('user', key, 'password')] = user.password;
  }
  return env;
}

export function maestroEnvArgs(backendUrl: string): string[] {
  return Object.entries(maestroEnv(backendUrl)).flatMap(([key, value]) => ['-e', `${key}=${value}`]);
}

// `npm run maestro:env` prints the variables, one KEY=value per line.
if (require.main === module) {
  const env = maestroEnv(process.env.BACKEND_URL ?? 'http://localhost:4000');
  for (const [key, value] of Object.entries(env)) {
    process.stdout.write(`${key}=${key.startsWith('USER_') && key.endsWith('_PASSWORD') ? '***' : value}\n`);
  }
}

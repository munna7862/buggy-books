import * as dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
  env: process.env.ENV || 'INTEROP',
  baseUrl: process.env.BASE_URL || "https://buggy-books-fe.onrender.com/",
  apiBaseUrl: process.env.API_BASE_URL || 'https://buggy-books.onrender.com',
  headless: process.env.HEADLESS === 'true',
  browser: process.env.BROWSER || 'chrome',
  USE_SPECIFIC_TESTS: true,
  SUITENAME: process.env.SUITENAME || 'Default'
};

export const getRequiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Add it to playwright-e2e/.env locally or configure it as a GitHub Actions secret.`);
  }

  return value;
};

export const getLoginCredentials = () => ({
  userName: getRequiredEnv('USER_NAME'),
  password: getRequiredEnv('PASSWORD')
});

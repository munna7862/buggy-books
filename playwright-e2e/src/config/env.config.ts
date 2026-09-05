import * as dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
  env: process.env.ENV || 'INTEROP',
  baseUrl: process.env.BASE_URL || "https://buggy-books-fe.onrender.com",
  apiBaseUrl: process.env.API_BASE_URL || 'https://buggy-books.onrender.com',
  headless: process.env.HEADLESS === 'true',
  browser: process.env.BROWSER || 'chrome',
  timeout: parseInt(process.env.ELEMENT_TIMEOUT || '15000', 10),
  SUITENAME: process.env.SUITENAME || 'Default'
};

export const getRequiredEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Add it to playwright-e2e/.env locally or configure it as a GitHub Actions secret.`);
  }

  return value;
};

export const getLoginCredentials = () => ({
  userName: process.env.USER_NAME || 'admin',
  password: process.env.PASSWORD || 'password123'
});

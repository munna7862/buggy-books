import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { envConfig, getLoginCredentials } from '../config/env.config';

const authFile = path.resolve(__dirname, '../../.auth/user.json');

setup('authenticate seed user and cache storage state', async ({ page }) => {
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const { userName, password } = getLoginCredentials();

  // 1. Direct API authentication via page.request (automatically synchronizes cookies into page.context)
  const loginRes = await page.request.post(`${envConfig.apiBaseUrl}/api/login`, {
    data: { username: userName, password },
    headers: { 'x-bypass-rate-limit': 'true' }
  });
  expect(loginRes.ok()).toBeTruthy();

  // 2. Navigate to base URL to establish origin domain and write localStorage auth token
  await page.goto(envConfig.baseUrl);
  await page.evaluate((user) => {
    localStorage.setItem('authUser', user);
  }, userName);

  // 3. Save consolidated storage state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});

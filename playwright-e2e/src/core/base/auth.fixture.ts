import { expect, Page } from '@playwright/test';
import { test as baseTest } from './base.fixture';
import { getLoginCredentials } from '../../config/env.config';

export type AuthFixtures = {
  authenticatedPage: Page;
  seedCredentials: { userName: string; password: string };
};

export const test = baseTest.extend<AuthFixtures>({
  seedCredentials: async ({}, use) => {
    const creds = getLoginCredentials();
    await use(creds);
  },

  authenticatedPage: async ({ page, signUpPage, catalogPage, seedCredentials }, use) => {
    await page.goto('/');
    await catalogPage.clickNavigateLink('Login');
    await signUpPage.login(seedCredentials.userName, seedCredentials.password);
    await use(page);
  },
});

export { expect };

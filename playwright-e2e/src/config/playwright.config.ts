import { defineConfig } from '@playwright/test';
import { envConfig } from './env.config';
import * as path from 'path';

export default defineConfig({
  testDir: '../tests',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  timeout: 300 * 1000,
  retries: 1,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['allure-playwright', {
      resultsDir: path.resolve(__dirname, '../..', 'reports', 'allure-results'),
      suiteTitle: 'Automation Test Suite',
      detail: false,
      environmentInfo: {
        Environment: envConfig.env || 'INTEROP',
        Suite: envConfig.SUITENAME || 'Default',
        OS: process.platform,
        NodeVersion: process.version
      }
    }]
  ],

  use: {
    baseURL: envConfig.baseUrl,
    headless: envConfig.headless,
    viewport: null,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'Google Chrome',
      use: {
        channel: 'chrome',
        launchOptions: {
          args: ['--disable-notifications', '--disable-infobars', '--disable-extensions', '--start-maximized'],
        },
        headless: envConfig.headless
      }
    }
  ],
  outputDir: '../../reports/test-artifacts'
});

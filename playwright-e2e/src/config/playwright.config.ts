import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './env.config';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '../../..');
const backendDir = path.resolve(rootDir, 'backend');
const frontendDir = path.resolve(rootDir, 'frontend');

export default defineConfig({
  testDir: path.resolve(__dirname, '../tests'),
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  timeout: 300 * 1000,
  retries: 1,
  workers: process.env.CI ? 4 : undefined,
  grepInvert: /@quarantine/,

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

  webServer: [
    {
      command: 'node dist/server.js',
      cwd: backendDir,
      port: 4000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        PORT: '4000',
        NODE_ENV: 'development',
        JWT_SECRET: 'local-e2e-seed-secret'
      }
    },
    {
      command: 'npx vite preview --port 5173 --host 127.0.0.1',
      cwd: frontendDir,
      port: 5173,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  ],

  use: {
    baseURL: envConfig.baseUrl,
    headless: envConfig.headless,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],
  outputDir: '../../reports/test-artifacts'
});

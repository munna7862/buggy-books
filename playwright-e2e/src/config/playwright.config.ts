import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './env.config';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '../../..');
const backendDir = path.resolve(rootDir, 'backend');
const frontendDir = path.resolve(rootDir, 'frontend');
const authFile = path.resolve(__dirname, '../../.auth/user.json');

export default defineConfig({
  testDir: path.resolve(__dirname, '../tests'),
  testMatch: ['**/*.spec.ts', '**/*.setup.ts'],
  fullyParallel: true,
  timeout: 300 * 1000,
  retries: 1,
  workers: process.env.CI ? 4 : undefined,
  grepInvert: /@quarantine/,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    },
  },

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

  webServer: (envConfig.baseUrl.includes('127.0.0.1') || envConfig.baseUrl.includes('localhost')) ? [
    {
      command: 'node dist/server.js',
      cwd: backendDir,
      port: 4000,
      timeout: 120 * 1000,
      reuseExistingServer: true,
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
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  ] : undefined,

  use: {
    baseURL: envConfig.baseUrl,
    headless: envConfig.headless,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: authFile,
      },
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        storageState: authFile,
      },
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        storageState: authFile,
      },
    },
    {
      name: 'mobile-chrome',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        storageState: authFile,
      },
    },
    {
      name: 'mobile-safari',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
        storageState: authFile,
      },
    },
  ],
  outputDir: '../../reports/test-artifacts'
});

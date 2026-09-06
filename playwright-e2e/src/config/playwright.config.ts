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
    ['list'],
    ...(process.env.CI ? [
      ['blob', { outputDir: path.resolve(__dirname, '../../blob-report') }] as [string, any],
    ] : [
      ['html', { open: 'never' }] as [string, any],
    ]),
    ['json', {
      outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME
        ? path.resolve(__dirname, '../..', process.env.PLAYWRIGHT_JSON_OUTPUT_NAME)
        : path.resolve(__dirname, '../../test-results/results.json')
    }],
    ['allure-playwright', {
      resultsDir: path.resolve(__dirname, '../../reports/allure-results'),
      suiteTitle: 'Automation Test Suite',
      detail: false,
      environmentInfo: {
        Environment: envConfig.env || 'INTEROP',
        Suite: envConfig.SUITENAME || 'Default',
        OS: process.platform,
        NodeVersion: process.version
      }
    }],
    ['monocart-reporter', {
      name: 'BuggyBooks Automation Test Report',
      outputFile: process.env.MONOCART_REPORT_PATH
        ? path.resolve(__dirname, '../..', process.env.MONOCART_REPORT_PATH)
        : path.resolve(__dirname, '../../reports/monocart-report/index.html'),
      tags: {
        smoke: { style: { background: '#28a745', color: '#fff' }, description: 'Smoke Tests' },
        regression: { style: { background: '#17a2b8', color: '#fff' }, description: 'Regression Tests' },
        chaos: { style: { background: '#dc3545', color: '#fff' }, description: 'Chaos Resilience Tests' },
        visual: { style: { background: '#6f42c1', color: '#fff' }, description: 'Visual Regression Tests' },
        a11y: { style: { background: '#ffc107', color: '#000' }, description: 'Accessibility Scans' },
        quarantine: { style: { background: '#6c757d', color: '#fff' }, description: 'Quarantined Tests' }
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

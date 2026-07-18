import { defineConfig } from '@playwright/test';
import { envConfig } from './env.config';
import * as path from 'path';
import * as fs from 'fs';

function loadTestSuite() {
  const suiteName = envConfig.SUITENAME;
  console.log(`Suite Name: ${suiteName}`);
  console.log(`USE_SPECIFIC_TESTS: ${envConfig.USE_SPECIFIC_TESTS}`);
  const specificTests = [
    "**/playwright-e2e/src/tests/ui/BookCatalog/Test_001_InitialCatalog.spec.ts",
    "**/playwright-e2e/src/tests/ui/Checkout/Test_001_CompleteBookPurchase.spec.ts",
    "**/playwright-e2e/src/tests/ui/Checkout/Test_002_CartPersistenceCheckout.spec.ts",
    "**/playwright-e2e/src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts",
    "**/playwright-e2e/src/tests/ui/UserManagement/Test_002_LoginWithExistingUser.spec.ts",
    "**/playwright-e2e/src/tests/api/BookCatalog/Test_001_BooksApi.spec.ts",
    "**/playwright-e2e/src/tests/api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts",
    "**/playwright-e2e/src/tests/api/CartAndInventory/Test_001_CartAndInventoryApi.spec.ts",
    "**/playwright-e2e/src/tests/api/ChaosAndTesting/Test_001_ChaosAndTestingApi.spec.ts"
  ];
  if (envConfig.USE_SPECIFIC_TESTS === true) {
    console.log('Using specific test configuration');
    return specificTests;
  }
  else if (suiteName) {
    try {
      const suiteFilePath = path.join(__dirname, `../tests/TestSuites/${suiteName}.json`);
      if (fs.existsSync(suiteFilePath)) {
        const suiteData = JSON.parse(fs.readFileSync(suiteFilePath, 'utf-8'));
        console.log(`Loading test suite: ${suiteName}`);
        return suiteData.testFiles || [];
      }
    } catch (e) {
      console.error('Error loading suite', e);
    }
  }
  return ['**/**.spec.ts'];
}

const testSpecs = loadTestSuite();


export default defineConfig({
  testDir: '../tests',
  testMatch: testSpecs,
  fullyParallel: false,  // Enable parallel execution
  timeout: 300 * 1000,
  retries: 1,
  workers: process.env.CI ? 2 : 1,

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
    // viewport: { width: 1920, height: 1080 },
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

import type { Options } from '@wdio/types';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export const sharedConfig: Options.Testrunner = {
  runner: 'local',
  specs: [
    path.join(process.cwd(), 'src/specs/**/*.spec.ts'),
  ],
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 20000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  services: [
    [
      'appium',
      {
        args: {
          relaxedSecurity: true,
          log: path.join(process.cwd(), 'logs', 'appium.log'),
        },
        logPath: './logs',
      },
    ],
  ],
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'reports/allure-results',
        disableWebdriverStepsReporting: false,
        disableWebdriverScreenshotsReporting: false,
        useCucumberStepReporter: false,
      },
    ],
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000,
  },
  beforeSession: () => {
    Logger.info('Starting WebdriverIO Mobile Automation Session');
  },
  beforeTest: (test) => {
    Logger.info(`Executing Mobile Test: [${test.parent}] > ${test.title}`);
  },
  afterTest: async (test, _context, { error }) => {
    if (error) {
      Logger.error(`Test FAILED: ${test.title} - ${error.message}`);
      try {
        const screenshot = await driver.takeScreenshot();
        const allureReporter = await import('@wdio/allure-reporter');
        allureReporter.default.addAttachment(
          'Failure Screenshot',
          Buffer.from(screenshot, 'base64'),
          'image/png'
        );
      } catch (screenshotErr) {
        Logger.warn(`Could not capture screenshot on failure: ${(screenshotErr as Error).message}`);
      }
    } else {
      Logger.info(`Test PASSED: ${test.title}`);
    }
  },
};

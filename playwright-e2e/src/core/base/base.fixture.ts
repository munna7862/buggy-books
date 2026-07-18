import { logger } from '../logger/logger';
import { SignUpPage } from '../../pages/signup-login.page';
import { CatalogPage } from '../../pages/catalog.page';
import { CommonFunctions } from '../../utils/common.util';
import { NetworkInterceptor } from '../network/network.interceptor';
import { writeFile } from 'fs/promises';
import { test as base } from '@playwright/test';
import { captureFailureState } from './failure-hook';

type TestFixtures = {
  signUpPage: SignUpPage;
  catalogPage: CatalogPage;
  commonFunctions: CommonFunctions;
  networkInterceptor: NetworkInterceptor;
};

export const test = base.extend<TestFixtures>({

  networkInterceptor: async ({ context }, use, testInfo) => {
    const interceptor = new NetworkInterceptor(context, 'api-only');
    interceptor.start();
    logger.info('Network interception enabled with mode: api-only');
    await use(interceptor);
    await interceptor.stop();
    const networkEntries = interceptor.getEntries();
    const outputPath = testInfo.outputPath('network-log.json');
    const networkLog = JSON.stringify(networkEntries, null, 2);
    await writeFile(outputPath, networkLog, 'utf-8');
    await testInfo.attach('network-log', {
      body: Buffer.from(networkLog),
      contentType: 'application/json'
    });
    logger.info(`Captured ${networkEntries.length} network calls. Artifact: ${outputPath}`);
  },

  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },

  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },

  commonFunctions: async ({ }, use) => {
    await use(new CommonFunctions());
  }

});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await captureFailureState(page, testInfo);
  }
});




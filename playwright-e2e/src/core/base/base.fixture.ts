import { logger } from '../logger/logger';
import { SignUpPage } from '../../pages/signup-login.page';
import { CatalogPage } from '../../pages/catalog.page';
import { BookDetailPage } from '../../pages/book-detail.page';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';
import { ProfilePage } from '../../pages/profile.page';
import { ChaosDashboardPage } from '../../pages/chaos-dashboard.page';
import { NotificationCenterComponent } from '../../pages/notification-center.component';
import { CommonFunctions } from '../../utils/common.util';
import defaultApiUtil, { ApiUtil } from '../../utils/api.util';
import { envConfig } from '../../config/env.config';
import { NetworkInterceptor } from '../network/network.interceptor';
import { writeFile } from 'fs/promises';
import { test as base, expect, APIRequestContext } from '@playwright/test';
import { captureFailureState } from './failure-hook';
import axios from 'axios';

export { expect };

type TestFixtures = {
  signUpPage: SignUpPage;
  catalogPage: CatalogPage;
  bookDetailPage: BookDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  profilePage: ProfilePage;
  chaosDashboardPage: ChaosDashboardPage;
  notificationCenter: NotificationCenterComponent;
  commonFunctions: CommonFunctions;
  networkInterceptor: NetworkInterceptor;
  testSessionId: string;
  apiUtil: ApiUtil;
  sessionIsolation: void;
  request: APIRequestContext;
};

export const test = base.extend<TestFixtures>({

  testSessionId: async ({}, use, testInfo) => {
    const rawId = `pw-w${testInfo.workerIndex}-${testInfo.parallelIndex}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await use(rawId);
  },

  request: async ({ playwright, testSessionId }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: envConfig.apiBaseUrl,
      extraHTTPHeaders: {
        'x-test-session-id': testSessionId,
        'x-bypass-rate-limit': 'true',
      },
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  apiUtil: async ({ testSessionId }, use) => {
    const apiInstance = new ApiUtil(testSessionId);
    defaultApiUtil.setSessionId(testSessionId);
    await use(apiInstance);
  },

  sessionIsolation: [async ({ context, testSessionId }, use) => {
    await context.setExtraHTTPHeaders({
      'x-test-session-id': testSessionId
    });
    defaultApiUtil.setSessionId(testSessionId);
    logger.info(`Session isolation fixture active for worker with x-test-session-id: ${testSessionId}`);
    
    await use();

    // Session teardown: Clean up backend ephemeral session
    try {
      const apiBase = envConfig.apiBaseUrl || 'http://localhost:4000';
      await axios.delete(`${apiBase}/api/test/session/${testSessionId}`, {
        headers: { 'x-bypass-rate-limit': 'true', 'x-test-session-id': testSessionId },
        timeout: 5000
      });
      logger.info(`Cleaned up ephemeral test session: ${testSessionId}`);
    } catch {
      // Backend may be offline or mock mode; non-blocking
    }
  }, { auto: true }],

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

  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  chaosDashboardPage: async ({ page }, use) => {
    await use(new ChaosDashboardPage(page));
  },

  notificationCenter: async ({ page }, use) => {
    await use(new NotificationCenterComponent(page));
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

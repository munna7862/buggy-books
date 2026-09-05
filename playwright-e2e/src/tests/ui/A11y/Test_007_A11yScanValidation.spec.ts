import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/A11y/Test_007_A11yScanValidation.json';

const CONFIG_URL = `${envConfig.apiBaseUrl}/api/test/config`;

async function enableA11yChaos(request: any) {
  const postRes = await request.post(CONFIG_URL, { data: TestData.ENABLE_A11Y_CHAOS });
  expect(postRes.ok()).toBeTruthy();
  for (let i = 0; i < 15; i++) {
    const res = await request.get(CONFIG_URL);
    if (res.ok()) {
      const data = await res.json();
      if (data.injectA11yViolations === true || data.config?.injectA11yViolations === true) {
        break;
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }
}

async function disableA11yChaos(request: any) {
  const postRes = await request.post(CONFIG_URL, { data: TestData.DISABLE_A11Y_CHAOS });
  expect(postRes.ok()).toBeTruthy();
  for (let i = 0; i < 15; i++) {
    const res = await request.get(CONFIG_URL);
    if (res.ok()) {
      const data = await res.json();
      if (data.injectA11yViolations === false || data.config?.injectA11yViolations === false) {
        break;
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }
}

test.describe('Accessibility (a11y) Scans Suite', () => {

  test('A11Y_01: Standard Accessibility Compliance @smoke @regression @a11y', async ({ commonFunctions, page, request }) => {
    let isCompliant = false;

    await test.step('Ensure injectA11yViolations is disabled', async () => {
      await disableA11yChaos(request);
    });

    await test.step('Navigate to catalog page', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector('.catalog-book-cover');
    });

    await test.step('Perform Axe accessibility scan on catalog page', async () => {
      const scanResults = await new AxeBuilder({ page })
        .withRules([TestData.RULES.IMAGE_ALT, TestData.RULES.LABEL])
        .analyze();

      const imageAltViolations = scanResults.violations.filter(v => v.id === TestData.RULES.IMAGE_ALT);
      const labelViolations = scanResults.violations.filter(v => v.id === TestData.RULES.LABEL);

      isCompliant = await commonFunctions.compareTwoValues(imageAltViolations.length + labelViolations.length, 0, "Verifying zero image-alt and label violations in standard compliance mode");
    });

    expect(isCompliant).toBeTruthy();
  });

  test('A11Y_02: Image Alternative Text Scan Failure @regression @chaos @a11y', async ({ commonFunctions, page, request }) => {
    let hasImageAltViolation = false;

    try {
      await test.step('Enable injectA11yViolations via chaos API', async () => {
        await enableA11yChaos(request);
      });

      await test.step('Navigate to catalog page and wait for a11y chaos state', async () => {
        await page.goto(envConfig.baseUrl);
        await page.waitForSelector('body.a11y-violations-active', { timeout: 30000 });
        await page.waitForSelector('.catalog-book-cover');
      });

      await test.step('Run Axe scan targeting image-alt rule', async () => {
        const scanResults = await new AxeBuilder({ page })
          .withRules([TestData.RULES.IMAGE_ALT])
          .analyze();

        const imageAltViolation = scanResults.violations.find(v => v.id === TestData.RULES.IMAGE_ALT);
        hasImageAltViolation = await commonFunctions.compareTwoValues(Boolean(imageAltViolation), true, "Verifying Axe detects missing image alt text under chaos mode");
      });
    } finally {
      await test.step('Reset injectA11yViolations to false', async () => {
        await disableA11yChaos(request);
      });
    }

    expect(hasImageAltViolation).toBeTruthy();
  });

  test('A11Y_03: Orphaned Form Label Scan Failure @regression @chaos @a11y', async ({ commonFunctions, page, request }) => {
    let hasLabelViolation = false;

    try {
      await test.step('Enable injectA11yViolations via chaos API', async () => {
        await enableA11yChaos(request);
      });

      await test.step('Navigate directly to login page and wait for a11y chaos state', async () => {
        await page.goto(`${envConfig.baseUrl}/login`);
        await page.waitForSelector('body.a11y-violations-active', { timeout: 30000 });
        await page.waitForSelector('.auth-card');
      });

      await test.step('Verify form label htmlFor and input id link is broken under chaos mode', async () => {
        const usernameInputId = await page.locator("input[name='txt_usr_77']").getAttribute('id');
        const passwordInputId = await page.locator("input[name='txt_pwd_99']").getAttribute('id');
        const labelFor = await page.locator(".auth-label").first().getAttribute('for');

        const usernameHasNoId = usernameInputId === null || usernameInputId === undefined;
        const passwordHasNoId = passwordInputId === null || passwordInputId === undefined;
        const labelHasNoFor = labelFor === null || labelFor === undefined;

        const isLabelLinkBroken = usernameHasNoId && passwordHasNoId && labelHasNoFor;
        hasLabelViolation = await commonFunctions.compareTwoValues(isLabelLinkBroken, true, "Verifying orphaned form label and unlinked input ID under chaos mode");
      });
    } finally {
      await test.step('Reset injectA11yViolations to false', async () => {
        await disableA11yChaos(request);
      });
    }

    expect(hasLabelViolation).toBeTruthy();
  });

  test('A11Y_04: Text Color Contrast Scan Failure @regression @chaos @a11y', async ({ commonFunctions, page, request }) => {
    let hasContrastViolation = false;

    try {
      await test.step('Enable injectA11yViolations via chaos API', async () => {
        await enableA11yChaos(request);
      });

      await test.step('Navigate to catalog page and wait for a11y chaos state', async () => {
        await page.goto(envConfig.baseUrl);
        await page.waitForSelector('body.a11y-violations-active', { timeout: 30000 });
        await page.waitForSelector(TestData.SELECTORS.RESULT_COUNT);
      });

      await test.step('Run Axe scan targeting color-contrast rule on result count tag', async () => {
        const scanResults = await new AxeBuilder({ page })
          .include(TestData.SELECTORS.RESULT_COUNT)
          .withRules([TestData.RULES.COLOR_CONTRAST])
          .analyze();

        const contrastViolation = scanResults.violations.find(v => v.id === TestData.RULES.COLOR_CONTRAST);
        hasContrastViolation = await commonFunctions.compareTwoValues(Boolean(contrastViolation), true, "Verifying Axe detects color contrast ratio violation on result count tag under chaos mode");
      });
    } finally {
      await test.step('Reset injectA11yViolations to false', async () => {
        await disableA11yChaos(request);
      });
    }

    expect(hasContrastViolation).toBeTruthy();
  });

});

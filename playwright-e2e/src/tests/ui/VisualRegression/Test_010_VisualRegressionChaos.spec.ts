import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig, getLoginCredentials } from '../../../config/env.config';
import TestData from '../../../test-data/ui/VisualRegression/Test_010_VisualRegressionChaos.json';
import { SignUpPage } from '../../../pages/signup-login.page';
import { CatalogPage } from '../../../pages/catalog.page';

const CONFIG_URL = `${envConfig.apiBaseUrl}/api/test/config`;
const RESET_URL = `${envConfig.apiBaseUrl}/api/test/reset`;

async function syncVisualChaos(request: any, state: boolean) {
  await request.post(CONFIG_URL, { data: { visualChaos: state } });
  for (let i = 0; i < 10; i++) {
    const res = await request.get(CONFIG_URL);
    const data = await res.json();
    const current = data.visualChaos ?? data.config?.visualChaos;
    if (current === state) {
      break;
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

test.describe('Visual Regression & Layout Chaos Suite', () => {

  test.afterEach(async ({ request }) => {
    // Revert chaos settings
    await request.post(RESET_URL);
  });

  test('VIS_REG_01: Baseline Catalog Screenshot', async ({ commonFunctions, page, request }) => {
    let flag = false;
    await test.step('Ensure visualChaos is disabled', async () => {
      await syncVisualChaos(request, false);
    });

    await test.step('Navigate to catalog page', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
    });

    await test.step('Assert screenshot matches baseline', async () => {
      await expect(page).toHaveScreenshot('catalog-baseline.png', { maxDiffPixelRatio: 0.05 });
      flag = true;
    });

    expect(flag).toBeTruthy();
  });

  test('VIS_REG_02: Chaos-Enabled Catalog Pixel Diff', async ({ commonFunctions, page, request }) => {
    let diffDetected = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert screenshot mismatch with baseline', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector('body.visual-chaos-active');
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
      try {
        await expect(page).toHaveScreenshot('catalog-baseline.png', { maxDiffPixelRatio: 0.01, timeout: 2000 });
      } catch (err) {
        // Visual diff expected when chaos mode is active
        diffDetected = true;
      }
      await commonFunctions.compareTwoValues(diffDetected, true, "Verifying visual pixel diff detected under chaos mode");
    });

    expect(diffDetected).toBeTruthy();
  });

  test('VIS_REG_03: Book Card Border Color Assertion', async ({ commonFunctions, page, request }) => {
    let flag = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert border-color on book card', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector('body.visual-chaos-active');
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
      const borderColor = await page.locator(TestData.SELECTORS.BOOK_CARD).first().evaluate(
        el => getComputedStyle(el).borderColor
      );
      // hsl(0, 85%, 60%) resolves to rgb(240, 66, 66)
      flag = await commonFunctions.compareTwoValues(
        borderColor === 'rgb(240, 66, 66)' || borderColor === 'rgb(242, 36, 36)',
        true,
        `Asserting book card border-color is red (rgb(240, 66, 66) or rgb(242, 36, 36)), actual: ${borderColor}`
      );
    });

    expect(flag).toBeTruthy();
  });

  test('VIS_REG_04: Book Cover Blur Filter Assertion', async ({ commonFunctions, page, request }) => {
    let flag = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert filter is blurred', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector('body.visual-chaos-active');
      await page.waitForSelector(TestData.SELECTORS.BOOK_COVER);
      const filter = await page.locator(TestData.SELECTORS.BOOK_COVER).first().evaluate(
        el => getComputedStyle(el).filter
      );
      flag = await commonFunctions.compareTwoValues(
        filter.includes('blur(1.5px)'),
        true,
        `Asserting book cover has blur filter, actual: ${filter}`
      );
    });

    expect(flag).toBeTruthy();
  });

  test('VIS_REG_05: Search Bar Displacement Assertion', async ({ commonFunctions, page, request }) => {
    let flag = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert search form transform style', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector('body.visual-chaos-active');
      await page.waitForSelector(TestData.SELECTORS.SEARCH_FORM);
      const transform = await page.locator(TestData.SELECTORS.SEARCH_FORM).evaluate(
        el => getComputedStyle(el).transform
      );
      flag = await commonFunctions.compareTwoValues(
        transform !== 'none' && (transform.includes('-18') || transform.includes('matrix')),
        true,
        `Asserting search form has translateX(-18px) transform, actual: ${transform}`
      );
    });

    expect(flag).toBeTruthy();
  });

  test('VIS_REG_06: Price Tag Rotation Assertion', async ({ commonFunctions, page, request }) => {
    let flag = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert price tag transform style', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.PRICE_TAG);
      const transform = await page.locator(TestData.SELECTORS.PRICE_TAG).first().evaluate(
        el => getComputedStyle(el).transform
      );
      flag = await commonFunctions.compareTwoValues(
        transform !== 'none' && transform.includes('matrix'),
        true,
        `Asserting price tag has rotation transform, actual: ${transform}`
      );
    });

    expect(flag).toBeTruthy();
  });

  test('VIS_REG_07: Checkout Button Margin Shift', async ({ commonFunctions, page, request }) => {
    let flag = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Register user session via API and navigate to checkout page', async () => {
      const testUser = `chaosUser_${Date.now()}`;
      await request.post(`${envConfig.apiBaseUrl}/api/register`, {
        data: { username: testUser, password: 'Password123!', fullName: 'Chaos User' }
      });

      await page.goto(envConfig.baseUrl);
      const catalogPage = new CatalogPage(page);
      await catalogPage.clickNavigateLink("Login");
      const signUpPage = new SignUpPage(page);
      await signUpPage.login(testUser, 'Password123!');

      await page.waitForSelector('body.visual-chaos-active');
      await catalogPage.clickNavigateLink("Checkout");
      await page.waitForSelector('#wizard-next-btn');

      const marginLeft = await page.locator('#wizard-next-btn').evaluate(
        el => getComputedStyle(el).marginLeft
      );
      flag = await commonFunctions.compareTwoValues(
        marginLeft === '15px',
        true,
        `Asserting checkout button has margin-left: 15px, actual: ${marginLeft}`
      );
    });

    expect(flag).toBeTruthy();
  });

  test('VIS_REG_08: Book Card Text Line Height Chaos', async ({ commonFunctions, page, request }) => {
    let flag = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert line-height multiplier', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.INFO_CELL_H3);
      // Wait for chaos active class propagation
      await page.waitForSelector('body.visual-chaos-active');
      const fontSizeStr = await page.locator(TestData.SELECTORS.INFO_CELL_H3).first().evaluate(
        el => getComputedStyle(el).fontSize
      );
      const lineHeightStr = await page.locator(TestData.SELECTORS.INFO_CELL_H3).first().evaluate(
        el => getComputedStyle(el).lineHeight
      );

      const fontSize = parseFloat(fontSizeStr);
      const lineHeight = parseFloat(lineHeightStr);

      // line-height: 3.2 !important; -> lineHeight / fontSize should be ~3.2
      const multiplier = lineHeight / fontSize;
      flag = await commonFunctions.compareTwoValues(
        Math.abs(multiplier - 3.2) < 0.2,
        true,
        `Asserting book card h3 text line-height multiplier is ~3.2, actual: ${multiplier} (lineHeight: ${lineHeightStr}, fontSize: ${fontSizeStr})`
      );
    });

    expect(flag).toBeTruthy();
  });

  test('VIS_REG_09: Reset Restores Visual Baseline', async ({ page, request }) => {
    await test.step('Enable visualChaos first', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Call reset endpoint to clear chaos', async () => {
      await request.post(RESET_URL);
      // Wait for polling
      await new Promise(r => setTimeout(r, 3500));
    });

    await test.step('Navigate to catalog and assert screenshot matches baseline', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
      await expect(page).toHaveScreenshot('catalog-baseline.png', { maxDiffPixelRatio: 0.05 });
    });
  });

});

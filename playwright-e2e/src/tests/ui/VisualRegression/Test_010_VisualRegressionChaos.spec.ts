import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import { SignUpPage } from '../../../pages/signup-login.page';
import { CheckoutPage } from '../../../pages/checkout.page';

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
  // Visual baseline comparison currently calibrated for Desktop Chromium
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'Visual baseline comparison currently calibrated for Desktop Chromium');

  // Use clean unauthenticated storage state for visual baseline & explicit login test
  test.use({ storageState: { cookies: [], origins: [] } });

  test.afterEach(async ({ request }) => {
    // Revert chaos settings
    await request.post(RESET_URL);
  });

  test('VIS_REG_01: Baseline Catalog Screenshot @regression @visual', async ({ page, request, catalogPage }) => {
    await test.step('Ensure visualChaos is disabled', async () => {
      await syncVisualChaos(request, false);
    });

    await test.step('Navigate to catalog page', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForBookCardSelector();
    });

    await test.step('Assert screenshot matches baseline', async () => {
      await expect(page).toHaveScreenshot('catalog-baseline.png', { maxDiffPixelRatio: 0.05 });
    });
  });

  test('VIS_REG_02: Chaos-Enabled Catalog Pixel Diff @regression @chaos', async ({ commonFunctions, page, request, catalogPage }) => {
    let diffDetected = false;
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert screenshot mismatch with baseline', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForVisualChaosActive();
      await catalogPage.waitForBookCardSelector();
      try {
        await expect(page).toHaveScreenshot('catalog-baseline.png', { maxDiffPixelRatio: 0.0001, timeout: 2000 });
      } catch {
        // Visual diff expected when chaos mode is active
        diffDetected = true;
      }
      await commonFunctions.verifyValue(diffDetected, true, "Verifying visual pixel diff detected under chaos mode");
    });
  });

  test('VIS_REG_03: Book Card Border Color Assertion @regression @chaos', async ({ commonFunctions, page, request, catalogPage }) => {
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert border-color on book card', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForVisualChaosActive();
      await catalogPage.waitForBookCardSelector();
      const borderColor = await catalogPage.getFirstBookCardBorderColor();

      // hsl(0, 85%, 60%) or visual chaos variations resolve to reddish color (red channel >= 200)
      const redMatch = borderColor.match(/rgba?\((\d+)/);
      const redChannel = redMatch ? parseInt(redMatch[1], 10) : 0;
      await commonFunctions.verifyCondition(
        redChannel >= 200,
        `Asserting book card border-color is red (red >= 200), actual: ${borderColor}`
      );
    });
  });

  test('VIS_REG_04: Book Cover Blur Filter Assertion @regression @chaos', async ({ commonFunctions, page, request, catalogPage }) => {
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert filter is blurred', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForVisualChaosActive();
      await catalogPage.waitForBookCardSelector();
      const filter = await catalogPage.getFirstCoverFilter();
      await commonFunctions.verifyCondition(
        filter.includes('blur(1.5px)'),
        `Asserting book cover has blur filter, actual: ${filter}`
      );
    });
  });

  test('VIS_REG_05: Search Bar Displacement Assertion @regression @chaos', async ({ commonFunctions, page, request, catalogPage }) => {
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert search form transform style', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForVisualChaosActive();
      await catalogPage.waitForBookCardSelector();
      const transform = await catalogPage.getSearchFormTransform();
      await commonFunctions.verifyCondition(
        transform !== 'none' && (transform.includes('-18') || transform.includes('matrix')),
        `Asserting search form has translateX(-18px) transform, actual: ${transform}`
      );
    });
  });

  test('VIS_REG_06: Price Tag Rotation Assertion @regression @chaos', async ({ commonFunctions, page, request, catalogPage }) => {
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert price tag transform style', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForVisualChaosActive();
      await catalogPage.waitForBookCardSelector();
      const transform = await catalogPage.getFirstPriceTagTransform();
      await commonFunctions.verifyCondition(
        transform !== 'none' && transform.includes('matrix'),
        `Asserting price tag has rotation transform, actual: ${transform}`
      );
    });
  });

  test('VIS_REG_07: Checkout Button Margin Shift @regression @chaos', async ({ commonFunctions, page, request, catalogPage }) => {
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Register user session via API and navigate to checkout page', async () => {
      const testUser = `chaosUser_${Date.now()}`;
      await request.post(`${envConfig.apiBaseUrl}/api/register`, {
        data: { username: testUser, password: 'Password123!', fullName: 'Chaos User' }
      });

      await page.goto(envConfig.baseUrl);
      await catalogPage.clickNavigateLink("Login");
      const signUpPage = new SignUpPage(page);
      await signUpPage.login(testUser, 'Password123!');

      await catalogPage.waitForVisualChaosActive();
      await catalogPage.clickNavigateLink("Checkout");
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.waitForNextStepButton();

      const marginLeft = await checkoutPage.getNextStepButtonMarginLeft();
      await commonFunctions.verifyCondition(
        marginLeft === '15px',
        `Asserting checkout button has margin-left: 15px, actual: ${marginLeft}`
      );
    });
  });

  test('VIS_REG_08: Book Card Text Line Height Chaos @regression @chaos', async ({ commonFunctions, page, request, catalogPage }) => {
    await test.step('Enable visualChaos', async () => {
      await syncVisualChaos(request, true);
    });

    await test.step('Navigate to catalog and assert line-height multiplier', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForVisualChaosActive();
      await catalogPage.waitForBookCardSelector();
      const { fontSize: fontSizeStr, lineHeight: lineHeightStr } = await catalogPage.getFirstBookCardH3Styles();

      const fontSize = parseFloat(fontSizeStr);
      const lineHeight = parseFloat(lineHeightStr);

      // line-height: 3.2 !important; -> lineHeight / fontSize should be ~3.2
      const multiplier = lineHeight / fontSize;
      await commonFunctions.verifyCondition(
        Math.abs(multiplier - 3.2) < 0.2,
        `Asserting book card h3 text line-height multiplier is ~3.2, actual: ${multiplier} (lineHeight: ${lineHeightStr}, fontSize: ${fontSizeStr})`
      );
    });
  });

  test('VIS_REG_09: Reset Restores Visual Baseline @regression @chaos', async ({ page, request, catalogPage }) => {
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
      await catalogPage.waitForBookCardSelector();
      await expect(page).toHaveScreenshot('catalog-baseline.png', { maxDiffPixelRatio: 0.05 });
    });
  });

});

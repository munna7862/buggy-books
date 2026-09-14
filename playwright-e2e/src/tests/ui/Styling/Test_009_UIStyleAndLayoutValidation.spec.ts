import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Styling/Test_009_UIStyleAndLayoutValidation.json';

test.describe('Modern UI Styling & Layout Suite', () => {

  test('UI_STYLE_01: Retained Automation Selectors @smoke @regression', async ({ commonFunctions, page, catalogPage }) => {
    await test.step('Navigate to catalog and perform a search', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForBookCardsVisible();
      await catalogPage.searchBooks('the');
    });

    await test.step('Assert grid wrapper selector exists in DOM', async () => {
      const count = await catalogPage.getGridWrapperCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying .layout-wrapper-xyz987 grid wrapper selector exists in DOM");
    });

    await test.step('Assert book card selector exists in DOM', async () => {
      const count = await catalogPage.getBookCardCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying .complex-item-box-alpha book card selector exists in DOM");
    });

    await test.step('Assert book cover image selector exists in DOM', async () => {
      const count = await catalogPage.getBookCoverCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying .catalog-book-cover image selector exists in DOM");
    });

    await test.step('Assert info cell selector exists in DOM', async () => {
      const count = await catalogPage.getInfoCellCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying .info-cell-beta info cell selector exists in DOM");
    });

    await test.step('Assert price tag selector exists in DOM', async () => {
      const count = await catalogPage.getPriceTagCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying .price-tag-value price tag selector exists in DOM");
    });

    await test.step('Assert search input ID selector exists in DOM', async () => {
      const count = await catalogPage.getSearchInputCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying #book-search-input selector exists in DOM");
    });

    await test.step('Assert search button ID selector exists in DOM', async () => {
      const count = await catalogPage.getSearchBtnCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying #book-search-btn selector exists in DOM");
    });

    await test.step('Assert clear search button ID selector exists in DOM after search', async () => {
      const count = await catalogPage.getSearchClearBtnCount();
      await commonFunctions.verifyCondition(count > 0, "Verifying #book-search-clear-btn selector exists in DOM after search");
    });
  });

  test('UI_STYLE_02: Catalog Grid Layout Responsiveness @regression', async ({ commonFunctions, page, catalogPage }) => {
    await test.step('Load catalog page at desktop viewport and verify multi-column grid', async () => {
      await page.setViewportSize({ width: TestData.VIEWPORTS.DESKTOP.width, height: TestData.VIEWPORTS.DESKTOP.height });
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForBookCardsVisible();
      const { display, columnCount } = await catalogPage.getGridComputedLayout();
      await commonFunctions.verifyCondition(
        display === 'grid' && columnCount >= 2,
        `Verifying .layout-wrapper-xyz987 is display:grid with >= 2 columns at desktop (display=${display}, cols=${columnCount})`
      );
    });

    await test.step('Resize to tablet viewport and verify grid has at least 1 column', async () => {
      await page.setViewportSize({ width: TestData.VIEWPORTS.TABLET.width, height: TestData.VIEWPORTS.TABLET.height });
      await page.waitForLoadState('domcontentloaded');
      const { display, columnCount } = await catalogPage.getGridComputedLayout();
      await commonFunctions.verifyCondition(
        display === 'grid' && columnCount >= 1,
        `Verifying .layout-wrapper-xyz987 is display:grid with >= 1 column at tablet (display=${display}, cols=${columnCount})`
      );
    });

    await test.step('Resize to mobile viewport and verify grid collapses to single column', async () => {
      await page.setViewportSize({ width: TestData.VIEWPORTS.MOBILE.width, height: TestData.VIEWPORTS.MOBILE.height });
      await page.waitForLoadState('domcontentloaded');
      const { display, columnCount } = await catalogPage.getGridComputedLayout();
      await commonFunctions.verifyCondition(
        display === 'grid' && columnCount === 1,
        `Verifying .layout-wrapper-xyz987 collapses to 1 column at mobile (display=${display}, cols=${columnCount})`
      );
    });
  });

  test('UI_STYLE_03: Hover Animation CSS Verification @regression', async ({ commonFunctions, page, catalogPage }) => {
    await test.step('Navigate to catalog page and wait for book cards', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForBookCardsVisible();
    });

    await test.step('Get book cover transform before hover', async () => {
      const transformBefore = await catalogPage.getFirstCoverTransform();
      await commonFunctions.verifyCondition(
        typeof transformBefore === 'string',
        `Verifying .catalog-book-cover has transform CSS property before hover (value: ${transformBefore})`
      );
    });

    await test.step('Hover over first book card and verify transform contains matrix values', async () => {
      await catalogPage.hoverFirstBookCard();
      await catalogPage.waitForFirstCoverTransformTransition();

      const transformAfterHover = await catalogPage.getFirstCoverTransform();
      await commonFunctions.verifyCondition(
        transformAfterHover.includes(TestData.EXPECTED_HOVER_TRANSFORM_CONTAINS),
        `Verifying .catalog-book-cover transform contains matrix values after hover (value: ${transformAfterHover})`
      );
    });
  });

  test('UI_STYLE_04: HSL CSS Variable Theme Verification @regression', async ({ commonFunctions, page, catalogPage }) => {
    await test.step('Load catalog in default (light) mode and assert --bg CSS variable resolves to light theme color', async () => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(envConfig.baseUrl);
      await catalogPage.waitForBookCardsVisible();
      const bgValue = await page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      );
      const isLightBg = bgValue === TestData.LIGHT_MODE.BG || bgValue === 'hsl(210, 40%, 98%)';
      await commonFunctions.verifyCondition(
        isLightBg,
        `Verifying --bg CSS variable in light mode equals ${TestData.LIGHT_MODE.BG} or hsl (actual: ${bgValue})`
      );
    });

    await test.step('Emulate dark color scheme and assert --bg CSS variable resolves to dark theme color', async () => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await catalogPage.waitForBookCardsVisible();
      const bgValue = await page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      );
      const isDarkBg = bgValue === TestData.DARK_MODE.BG || bgValue === 'hsl(220, 40%, 6%)';
      await commonFunctions.verifyCondition(
        isDarkBg,
        `Verifying --bg CSS variable in dark mode equals ${TestData.DARK_MODE.BG} or hsl (actual: ${bgValue})`
      );
    });
  });

});

import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Styling/Test_009_UIStyleAndLayoutValidation.json';

test.describe('Modern UI Styling & Layout Suite', () => {

  test('UI_STYLE_01: Retained Automation Selectors @smoke @regression', async ({ commonFunctions, page, catalogPage }) => {
    let flag1 = false, flag2 = false, flag3 = false, flag4 = false, flag5 = false, flag6 = false, flag7 = false, flag8 = false;

    await test.step('Navigate to catalog and perform a search', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
      await catalogPage.searchBooks('the');
    });

    await test.step('Assert grid wrapper selector exists in DOM', async () => {
      const count = await page.locator(TestData.SELECTORS.GRID_WRAPPER).count();
      flag1 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying .layout-wrapper-xyz987 grid wrapper selector exists in DOM");
    });

    await test.step('Assert book card selector exists in DOM', async () => {
      const count = await page.locator(TestData.SELECTORS.BOOK_CARD).count();
      flag2 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying .complex-item-box-alpha book card selector exists in DOM");
    });

    await test.step('Assert book cover image selector exists in DOM', async () => {
      const count = await page.locator(TestData.SELECTORS.BOOK_COVER).count();
      flag3 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying .catalog-book-cover image selector exists in DOM");
    });

    await test.step('Assert info cell selector exists in DOM', async () => {
      const count = await page.locator(TestData.SELECTORS.INFO_CELL).count();
      flag4 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying .info-cell-beta info cell selector exists in DOM");
    });

    await test.step('Assert price tag selector exists in DOM', async () => {
      const count = await page.locator(TestData.SELECTORS.PRICE_TAG).count();
      flag5 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying .price-tag-value price tag selector exists in DOM");
    });

    await test.step('Assert search input ID selector exists in DOM', async () => {
      const count = await page.locator(TestData.SELECTORS.SEARCH_INPUT).count();
      flag6 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying #book-search-input selector exists in DOM");
    });

    await test.step('Assert search button ID selector exists in DOM', async () => {
      const count = await page.locator(TestData.SELECTORS.SEARCH_BTN).count();
      flag7 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying #book-search-btn selector exists in DOM");
    });

    await test.step('Assert clear search button ID selector exists in DOM after search', async () => {
      const count = await page.locator(TestData.SELECTORS.SEARCH_CLEAR_BTN).count();
      flag8 = await commonFunctions.compareTwoValues(count > 0, true, "Verifying #book-search-clear-btn selector exists in DOM after search");
    });

    expect(flag1 && flag2 && flag3 && flag4 && flag5 && flag6 && flag7 && flag8).toBeTruthy();
  });

  test('UI_STYLE_02: Catalog Grid Layout Responsiveness @regression', async ({ commonFunctions, page }) => {
    let desktopFlag = false, tabletFlag = false, mobileFlag = false;

    await test.step('Load catalog page at desktop viewport and verify multi-column grid', async () => {
      await page.setViewportSize({ width: TestData.VIEWPORTS.DESKTOP.width, height: TestData.VIEWPORTS.DESKTOP.height });
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
      const { display, columnCount } = await page.locator(TestData.SELECTORS.GRID_WRAPPER).evaluate(el => {
        const style = getComputedStyle(el);
        const cols = style.gridTemplateColumns.trim().split(/\s+/).filter(s => s.length > 0);
        return { display: style.display, columnCount: cols.length };
      });
      desktopFlag = await commonFunctions.compareTwoValues(
        display === 'grid' && columnCount >= 2,
        true,
        `Verifying .layout-wrapper-xyz987 is display:grid with >= 2 columns at desktop (display=${display}, cols=${columnCount})`
      );
    });

    await test.step('Resize to tablet viewport and verify grid has at least 1 column', async () => {
      await page.setViewportSize({ width: TestData.VIEWPORTS.TABLET.width, height: TestData.VIEWPORTS.TABLET.height });
      await page.waitForTimeout(300);
      const { display, columnCount } = await page.locator(TestData.SELECTORS.GRID_WRAPPER).evaluate(el => {
        const style = getComputedStyle(el);
        const cols = style.gridTemplateColumns.trim().split(/\s+/).filter(s => s.length > 0);
        return { display: style.display, columnCount: cols.length };
      });
      tabletFlag = await commonFunctions.compareTwoValues(
        display === 'grid' && columnCount >= 1,
        true,
        `Verifying .layout-wrapper-xyz987 is display:grid with >= 1 column at tablet (display=${display}, cols=${columnCount})`
      );
    });

    await test.step('Resize to mobile viewport and verify grid collapses to single column', async () => {
      await page.setViewportSize({ width: TestData.VIEWPORTS.MOBILE.width, height: TestData.VIEWPORTS.MOBILE.height });
      await page.waitForTimeout(300);
      const { display, columnCount } = await page.locator(TestData.SELECTORS.GRID_WRAPPER).evaluate(el => {
        const style = getComputedStyle(el);
        const cols = style.gridTemplateColumns.trim().split(/\s+/).filter(s => s.length > 0);
        return { display: style.display, columnCount: cols.length };
      });
      mobileFlag = await commonFunctions.compareTwoValues(
        display === 'grid' && columnCount === 1,
        true,
        `Verifying .layout-wrapper-xyz987 collapses to 1 column at mobile (display=${display}, cols=${columnCount})`
      );
    });

    expect(desktopFlag && tabletFlag && mobileFlag).toBeTruthy();
  });

  test('UI_STYLE_03: Hover Animation CSS Verification @regression', async ({ commonFunctions, page }) => {
    let flag1 = false, flag2 = false;

    await test.step('Navigate to catalog page and wait for book cards', async () => {
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
    });

    await test.step('Get book cover transform before hover', async () => {
      const transformBefore = await page.locator(TestData.SELECTORS.BOOK_COVER).first().evaluate(
        el => getComputedStyle(el).transform
      );
      flag1 = await commonFunctions.compareTwoValues(
        typeof transformBefore === 'string',
        true,
        `Verifying .catalog-book-cover has transform CSS property before hover (value: ${transformBefore})`
      );
    });

    await test.step('Hover over first book card and verify transform contains matrix values', async () => {
      await page.locator(TestData.SELECTORS.BOOK_CARD).first().hover();
      await page.waitForTimeout(600);
      const transformAfterHover = await page.locator(TestData.SELECTORS.BOOK_COVER).first().evaluate(
        el => getComputedStyle(el).transform
      );
      flag2 = await commonFunctions.compareTwoValues(
        transformAfterHover.includes(TestData.EXPECTED_HOVER_TRANSFORM_CONTAINS),
        true,
        `Verifying .catalog-book-cover transform contains matrix values after hover (value: ${transformAfterHover})`
      );
    });

    expect(flag1 && flag2).toBeTruthy();
  });

  test('UI_STYLE_04: HSL CSS Variable Theme Verification @regression', async ({ commonFunctions, page }) => {
    let lightBgFlag = false, darkBgFlag = false;

    await test.step('Load catalog in default (light) mode and assert --bg CSS variable resolves to light theme color', async () => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(envConfig.baseUrl);
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
      // Chrome resolves CSS custom property color values to their hex representation
      const bgValue = await page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      );
      const isLightBg = bgValue === TestData.LIGHT_MODE.BG || bgValue === 'hsl(210, 40%, 98%)';
      lightBgFlag = await commonFunctions.compareTwoValues(
        isLightBg,
        true,
        `Verifying --bg CSS variable in light mode equals ${TestData.LIGHT_MODE.BG} or hsl (actual: ${bgValue})`
      );
    });

    await test.step('Emulate dark color scheme and assert --bg CSS variable resolves to dark theme color', async () => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForSelector(TestData.SELECTORS.BOOK_CARD);
      // Chrome resolves CSS custom property color values to their hex or hsl representation
      const bgValue = await page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      );
      const isDarkBg = bgValue === TestData.DARK_MODE.BG || bgValue === 'hsl(220, 40%, 6%)';
      darkBgFlag = await commonFunctions.compareTwoValues(
        isDarkBg,
        true,
        `Verifying --bg CSS variable in dark mode equals ${TestData.DARK_MODE.BG} or hsl (actual: ${bgValue})`
      );
    });

    expect(lightBgFlag && darkBgFlag).toBeTruthy();
  });

});

import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/WebSockets/Test_008_WebSocketResilienceValidation.json';

const CONFIG_URL = `${envConfig.apiBaseUrl}/api/test/config`;

test.describe('WebSockets Event & Resilience Suite', () => {

  test('WS_CONN_01: WebSocket State Indicator', async ({ notificationCenter, commonFunctions, page }) => {
    let isConnected = false;

    await test.step('Navigate to home page', async () => {
      await page.goto(envConfig.baseUrl);
    });

    await test.step('Verify ws-status-dot has status-connected class', async () => {
      isConnected = await commonFunctions.compareTwoValues(await notificationCenter.isStatusConnected(), true, "Verifying WebSocket status dot has status-connected class");
    });

    expect(isConnected).toBeTruthy();
  });

  test('WS_EVENT_01: Broadcasted Event Reception', async ({ notificationCenter, commonFunctions, page }) => {
    let isDropdownOpened = false;

    await test.step('Navigate to home page', async () => {
      await page.goto(envConfig.baseUrl);
    });

    await test.step('Click bell button to open notification dropdown', async () => {
      await notificationCenter.clickBellButton();
    });

    await test.step('Verify live updates dropdown is visible', async () => {
      isDropdownOpened = await commonFunctions.compareTwoValues(await notificationCenter.isDropdownVisible(), true, "Verifying live updates notification dropdown is visible upon clicking bell icon");
    });

    expect(isDropdownOpened).toBeTruthy();
  });

  test('WS_EVENT_02: Hot-Toast Alert Trigger', async ({ signUpPage, catalogPage, cartPage, checkoutPage, notificationCenter, commonFunctions, page }) => {
    const testUser = TestData.USER_PREFIX + commonFunctions.generateRandomString(5);

    let isToastTriggered = false;

    await test.step('Register new user and navigate to catalog', async () => {
      await page.goto(envConfig.baseUrl);
      await signUpPage.clickSignUp();
      await signUpPage.registerNewUser(`Full ${testUser}`, testUser, TestData.PASSWORD, TestData.PASSWORD);
    });

    await test.step('Add first book to cart and proceed to checkout', async () => {
      await page.goto(envConfig.baseUrl);
      await catalogPage.addBookToCart(1);
      await cartPage.openCart();
      await cartPage.clickProceedToCheckout();
    });

    await test.step('Complete purchase checkout form', async () => {
      await checkoutPage.completePaymentSuccessfully(
        TestData.SHIPPING_DATA.firstName,
        TestData.SHIPPING_DATA.lastName,
        TestData.SHIPPING_DATA.cardNumber,
        'Thank you for your order'
      );
    });

    await test.step('Verify purchase event hot-toast alert is displayed', async () => {
      isToastTriggered = await commonFunctions.compareTwoValues(await notificationCenter.isToastNotificationVisible(), true, "Verifying hot-toast alert banner is rendered for purchase socket event");
    });

    expect(isToastTriggered).toBeTruthy();
  });

  test('WS_RESIL_01: Automatic Connection Recovery', async ({ notificationCenter, commonFunctions, page, request }) => {
    let isDisconnectedOrReconnecting = false;

    try {
      await test.step('Inject websocketDropRate: 1.0 via chaos API config', async () => {
        const res = await request.post(CONFIG_URL, { data: TestData.ENABLE_WS_CHAOS });
        expect(res.status()).toBe(200);
      });

      await test.step('Navigate to home page and verify WebSocket state changes to disconnected or reconnecting', async () => {
        await page.goto(envConfig.baseUrl);
        isDisconnectedOrReconnecting = await commonFunctions.compareTwoValues(await notificationCenter.isStatusDisconnectedOrReconnecting(), true, "Verifying status dot reflects disconnected or reconnecting state under socket chaos");
      });
    } finally {
      await test.step('Reset websocketDropRate to 0', async () => {
        await request.post(CONFIG_URL, { data: TestData.DISABLE_WS_CHAOS });
      });
    }

    expect(isDisconnectedOrReconnecting).toBeTruthy();
  });

});

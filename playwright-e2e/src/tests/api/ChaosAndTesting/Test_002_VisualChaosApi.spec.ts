import { test, expect } from '../../../core/base/base.fixture';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/ChaosAndTesting/Test_002_VisualChaosApi.json';

const commonUtil = new CommonFunctions();

test.describe('Visual Chaos Configuration API Suite', () => {

  test('API_VIS_01: Toggle visualChaos Config via API @smoke @regression @chaos', async ({ request }) => {
    let isStatusOk = false;
    let isVisualChaosTrue = false;

    try {
      const configRes = await request.post('/api/test/config', {
        data: TestData.TOGGLE_PAYLOAD
      });
      const data = await configRes.json();

      isStatusOk = await commonUtil.compareTwoValues(configRes.status(), 200, "Verifying POST /api/test/config status is 200");
      isVisualChaosTrue = await commonUtil.compareTwoValues(data.config.visualChaos, true, "Verifying visualChaos field is true in response config");
    } finally {
      await request.post('/api/test/config', {
        data: { visualChaos: false }
      });
    }

    expect(isStatusOk && isVisualChaosTrue).toBeTruthy();
  });

  test('API_VIS_02: Default visualChaos is False @smoke @regression', async ({ request }) => {
    let isStatusOk = false;
    let isVisualChaosFalse = false;

    const resetRes = await request.post('/api/test/reset');
    expect(resetRes.status()).toBe(200);

    const configRes = await request.get('/api/test/config');
    const data = await configRes.json();

    isStatusOk = await commonUtil.compareTwoValues(configRes.status(), 200, "Verifying GET /api/test/config status is 200");
    isVisualChaosFalse = await commonUtil.compareTwoValues(data.visualChaos, false, "Verifying visualChaos default value is false");

    expect(isStatusOk && isVisualChaosFalse).toBeTruthy();
  });

  test('API_VIS_03: Invalid Type Rejected @regression', async ({ request }) => {
    let isStatus400 = false;
    let hasValidationError = false;

    const configRes = await request.post('/api/test/config', {
      data: TestData.INVALID_TYPE_PAYLOAD
    });

    isStatus400 = await commonUtil.compareTwoValues(configRes.status(), 400, "Verifying 400 Bad Request returned for invalid data type");

    const errorData = await configRes.json();
    const errorText = JSON.stringify(errorData);
    const isValidErr = errorText.toLowerCase().includes('expected boolean') || errorText.toLowerCase().includes('invalid') || errorText.toLowerCase().includes('validation failed') || errorText.toLowerCase().includes('bad request');
    hasValidationError = await commonUtil.compareTwoValues(isValidErr, true, "Verifying response contains validation error message");

    expect(isStatus400 && hasValidationError).toBeTruthy();
  });

  test('API_VIS_04: Combine with Other Chaos Params @regression @chaos', async ({ request }) => {
    let isStatusOk = false;
    let isVisualChaosSaved = false;
    let isCheckoutRateSaved = false;

    try {
      const configRes = await request.post('/api/test/config', {
        data: TestData.COMBINED_PAYLOAD
      });
      const data = await configRes.json();

      isStatusOk = await commonUtil.compareTwoValues(configRes.status(), 200, "Verifying POST /api/test/config status is 200");
      isVisualChaosSaved = await commonUtil.compareTwoValues(data.config.visualChaos, true, "Verifying visualChaos saved as true");
      isCheckoutRateSaved = await commonUtil.compareTwoValues(data.config.checkoutFailureRate, 0.5, "Verifying checkoutFailureRate saved as 0.5");
    } finally {
      await request.post('/api/test/config', {
        data: TestData.RESET_PAYLOAD
      });
    }

    expect(isStatusOk && isVisualChaosSaved && isCheckoutRateSaved).toBeTruthy();
  });

});

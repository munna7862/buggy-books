import { test, expect } from '@playwright/test';
import { envConfig } from '../../../config/env.config';
import apiUtil from '../../../utils/api.util';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/ChaosAndTesting/Test_002_VisualChaosApi.json';

const commonUtil = new CommonFunctions();
const CONFIG_URL = `${envConfig.apiBaseUrl}/api/test/config`;
const RESET_URL = `${envConfig.apiBaseUrl}/api/test/reset`;

test.describe('Visual Chaos Configuration API Suite', () => {

  test('API_VIS_01: Toggle visualChaos Config via API @smoke @regression @chaos', async () => {
    let isStatusOk = false;
    let isVisualChaosTrue = false;

    try {
      const configRes = await apiUtil.makeRequest({
        method: 'POST',
        url: CONFIG_URL,
        data: TestData.TOGGLE_PAYLOAD,
        logMessage: 'Toggle visualChaos to true',
        responseType: 'full'
      });

      isStatusOk = await commonUtil.compareTwoValues(configRes.status, 200, "Verifying POST /api/test/config status is 200");
      isVisualChaosTrue = await commonUtil.compareTwoValues(configRes.data.config.visualChaos, true, "Verifying visualChaos field is true in response config");
    } finally {
      await apiUtil.makeRequest({
        method: 'POST',
        url: CONFIG_URL,
        data: { visualChaos: false },
        logMessage: 'Reset visualChaos to false',
        responseType: 'full'
      });
    }

    expect(isStatusOk && isVisualChaosTrue).toBeTruthy();
  });

  test('API_VIS_02: Default visualChaos is False @smoke @regression', async () => {
    let isStatusOk = false;
    let isVisualChaosFalse = false;

    const resetRes = await apiUtil.makeRequest({
      method: 'POST',
      url: RESET_URL,
      logMessage: 'Call POST /api/test/reset',
      responseType: 'full'
    });
    expect(resetRes.status).toBe(200);

    const configRes = await apiUtil.makeRequest({
      method: 'GET',
      url: CONFIG_URL,
      logMessage: 'Get chaos config post-reset',
      responseType: 'full'
    });

    isStatusOk = await commonUtil.compareTwoValues(configRes.status, 200, "Verifying GET /api/test/config status is 200");
    isVisualChaosFalse = await commonUtil.compareTwoValues(configRes.data.visualChaos, false, "Verifying visualChaos default value is false");

    expect(isStatusOk && isVisualChaosFalse).toBeTruthy();
  });

  test('API_VIS_03: Invalid Type Rejected @regression', async () => {
    let isStatus400 = false;
    let hasValidationError = false;

    const configRes = await apiUtil.makeRequest({
      method: 'POST',
      url: CONFIG_URL,
      data: TestData.INVALID_TYPE_PAYLOAD,
      logMessage: 'POST /api/test/config with invalid string type for visualChaos',
      responseType: 'full'
    });

    isStatus400 = await commonUtil.compareTwoValues(configRes.status, 400, "Verifying 400 Bad Request returned for invalid data type");

    const errorText = JSON.stringify(configRes.data);
    const isValidErr = errorText.toLowerCase().includes('expected boolean') || errorText.toLowerCase().includes('invalid') || errorText.toLowerCase().includes('bad request');
    hasValidationError = await commonUtil.compareTwoValues(isValidErr, true, "Verifying response contains validation error message");

    expect(isStatus400 && hasValidationError).toBeTruthy();
  });

  test('API_VIS_04: Combine with Other Chaos Params @regression @chaos', async () => {
    let isStatusOk = false;
    let isVisualChaosSaved = false;
    let isCheckoutRateSaved = false;

    try {
      const configRes = await apiUtil.makeRequest({
        method: 'POST',
        url: CONFIG_URL,
        data: TestData.COMBINED_PAYLOAD,
        logMessage: 'Configure visualChaos and checkoutFailureRate together',
        responseType: 'full'
      });

      isStatusOk = await commonUtil.compareTwoValues(configRes.status, 200, "Verifying POST /api/test/config status is 200");
      isVisualChaosSaved = await commonUtil.compareTwoValues(configRes.data.config.visualChaos, true, "Verifying visualChaos saved as true");
      isCheckoutRateSaved = await commonUtil.compareTwoValues(configRes.data.config.checkoutFailureRate, 0.5, "Verifying checkoutFailureRate saved as 0.5");
    } finally {
      await apiUtil.makeRequest({
        method: 'POST',
        url: CONFIG_URL,
        data: TestData.RESET_PAYLOAD,
        logMessage: 'Reset chaos config parameters to default',
        responseType: 'full'
      });
    }

    expect(isStatusOk && isVisualChaosSaved && isCheckoutRateSaved).toBeTruthy();
  });

});

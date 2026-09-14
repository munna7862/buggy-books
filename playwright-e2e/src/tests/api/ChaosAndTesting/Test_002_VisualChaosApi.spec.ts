import { test, expect } from '@playwright/test';
import { CommonFunctions } from '../../../utils/common.util';
import TestData from '../../../test-data/api/ChaosAndTesting/Test_002_VisualChaosApi.json';

const commonUtil = new CommonFunctions();

test.describe('Visual Chaos Configuration API Suite', () => {

  test('API_VIS_01: Toggle visualChaos Config via API @smoke @regression @chaos', async ({ request }) => {
    try {
      const configRes = await request.post('/api/test/config', {
        data: TestData.TOGGLE_PAYLOAD
      });
      const data = await configRes.json();

      await commonUtil.logMessage('INFO', 'Verifying POST /api/test/config status is 200');
      expect(configRes.status()).toBe(200);

      await commonUtil.logMessage('INFO', 'Verifying visualChaos field is true in response config');
      expect(data.config.visualChaos).toBe(true);
    } finally {
      await request.post('/api/test/config', {
        data: { visualChaos: false }
      });
    }
  });

  test('API_VIS_02: Default visualChaos is False @smoke @regression', async ({ request }) => {
    const resetRes = await request.post('/api/test/reset');
    expect(resetRes.status()).toBe(200);

    const configRes = await request.get('/api/test/config');
    const data = await configRes.json();

    await commonUtil.logMessage('INFO', 'Verifying GET /api/test/config status is 200');
    expect(configRes.status()).toBe(200);

    await commonUtil.logMessage('INFO', 'Verifying visualChaos default value is false');
    expect(data.visualChaos).toBe(false);
  });

  test('API_VIS_03: Invalid Type Rejected @regression', async ({ request }) => {
    const configRes = await request.post('/api/test/config', {
      data: TestData.INVALID_TYPE_PAYLOAD
    });

    await commonUtil.logMessage('INFO', 'Verifying 400 Bad Request returned for invalid data type');
    expect(configRes.status()).toBe(400);

    const errorData = await configRes.json();
    const errorText = JSON.stringify(errorData).toLowerCase();
    const isValidErr = errorText.includes('expected boolean') || errorText.includes('invalid') || errorText.includes('validation failed') || errorText.includes('bad request');
    expect(isValidErr).toBe(true);
  });

  test('API_VIS_04: Combine with Other Chaos Params @regression @chaos', async ({ request }) => {
    try {
      const configRes = await request.post('/api/test/config', {
        data: TestData.COMBINED_PAYLOAD
      });
      const data = await configRes.json();

      await commonUtil.logMessage('INFO', 'Verifying POST /api/test/config status is 200');
      expect(configRes.status()).toBe(200);

      await commonUtil.logMessage('INFO', 'Verifying visualChaos saved as true');
      expect(data.config.visualChaos).toBe(true);

      await commonUtil.logMessage('INFO', 'Verifying checkoutFailureRate saved as 0.5');
      expect(data.config.checkoutFailureRate).toBe(0.5);
    } finally {
      await request.post('/api/test/config', {
        data: TestData.RESET_PAYLOAD
      });
    }
  });

});

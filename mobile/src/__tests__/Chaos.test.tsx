import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ChaosScreen } from '../screens/ChaosScreen';
import { apiClient } from '../api/client';
import type { ChaosConfig } from '@buggybooks/types';

const mockChaosConfig: ChaosConfig = {
  checkoutFailureRate: 0.15,
  inventoryDelayMs: 3000,
  jwtExpirySeconds: 900,
  websocketDropRate: 0.0,
  uploadFailureRate: 0.0,
  injectA11yViolations: false,
  visualChaos: false,
  inventoryLockingRate: 0.25,
};

describe('ChaosScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  it('fetches chaos configuration on mount and renders current values', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockChaosConfig,
    });

    const { getByTestId, getAllByText } = render(<ChaosScreen />);

    await waitFor(() => {
      expect(getByTestId('val-checkout-failure')).toBeTruthy();
      expect(getAllByText('15%').length).toBeGreaterThanOrEqual(1);
      expect(getByTestId('val-inventory-delay')).toBeTruthy();
      expect(getAllByText('3000ms').length).toBeGreaterThanOrEqual(1);
      expect(getByTestId('val-locking-rate')).toBeTruthy();
      expect(getAllByText('25%').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('adjusts checkout failure rate with stepper and preset buttons', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockChaosConfig,
    });

    const { getByTestId } = render(<ChaosScreen />);

    await waitFor(() => {
      expect(getByTestId('val-checkout-failure')).toBeTruthy();
    });

    // Press + 5%
    fireEvent.press(getByTestId('btn-inc-checkout-failure'));
    expect(getByTestId('val-checkout-failure').props.children).toEqual([20, '%']);

    // Press 50% preset
    fireEvent.press(getByTestId('preset-checkout-50'));
    expect(getByTestId('val-checkout-failure').props.children).toEqual([50, '%']);

  });

  it('adjusts inventory delay with stepper and preset buttons', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockChaosConfig,
    });

    const { getByTestId } = render(<ChaosScreen />);

    await waitFor(() => {
      expect(getByTestId('val-inventory-delay')).toBeTruthy();
    });

    // Press - 500ms
    fireEvent.press(getByTestId('btn-dec-inventory-delay'));
    expect(getByTestId('val-inventory-delay').props.children).toEqual([2500, 'ms']);

    // Press 1s preset
    fireEvent.press(getByTestId('preset-delay-1000'));
    expect(getByTestId('val-inventory-delay').props.children).toEqual([1000, 'ms']);
  });

  it('saves updated chaos configuration and displays confirmation banner', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockChaosConfig,
    });

    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        config: {
          ...mockChaosConfig,
          checkoutFailureRate: 0.5,
        },
      },
    });

    const { getByTestId, getByText } = render(<ChaosScreen />);

    await waitFor(() => {
      expect(getByTestId('val-checkout-failure')).toBeTruthy();
    });

    // Select 50% preset
    fireEvent.press(getByTestId('preset-checkout-50'));

    // Save
    fireEvent.press(getByTestId('btn-save-chaos'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/test/config',
        expect.objectContaining({
          checkoutFailureRate: 0.5,
        })
      );
      expect(getByTestId('chaos-banner')).toBeTruthy();
      expect(getByText('✓ Chaos configuration saved successfully!')).toBeTruthy();
    });
  });

  it('resets database and chaos configuration to defaults upon confirmation', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockChaosConfig,
    });

    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Test state reset successfully',
      },
    });

    const { getByTestId, getByText } = render(<ChaosScreen />);

    await waitFor(() => {
      expect(getByTestId('btn-reset-chaos')).toBeTruthy();
    });

    fireEvent.press(getByTestId('btn-reset-chaos'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Reset Database & Chaos',
      expect.stringContaining('clear all test carts'),
      expect.any(Array)
    );

    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const resetCall = alertCalls.find((c) => c[0] === 'Reset Database & Chaos');
    const confirmBtn = resetCall[2].find((b: any) => b.text === 'Reset Everything');

    await confirmBtn.onPress();

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/test/reset');
      expect(getByTestId('chaos-banner')).toBeTruthy();
      expect(getByText('✓ Test database and chaos config reset to defaults!')).toBeTruthy();
    });
  });

  it('toggles simulated offline connection dropout (MOB-B5)', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockChaosConfig,
    });

    const { getByTestId, getByText } = render(<ChaosScreen />);

    await waitFor(() => {
      expect(getByTestId('toggle_simulated_offline')).toBeTruthy();
      expect(getByText('ONLINE')).toBeTruthy();
    });

    fireEvent(getByTestId('toggle_simulated_offline'), 'valueChange', true);
    expect(getByText('OFFLINE')).toBeTruthy();
  });
});

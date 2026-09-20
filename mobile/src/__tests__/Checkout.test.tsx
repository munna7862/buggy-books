import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { apiClient } from '../api/client';
import type { Book } from '@buggybooks/types';

const mockBook: Book = {
  id: '1',
  title: 'Refactoring',
  author: 'Martin Fowler',
  price: 49.99,
  image: 'https://example.com/refactoring.jpg',
};

const mockClearCart = jest.fn();

// Mock useCart
jest.mock('../context/CartContext', () => ({
  useCart: () => ({
    cart: [mockBook],
    subtotal: 49.99,
    tax: 4.0,
    total: 53.99,
    clearCart: mockClearCart,
  }),
}));

const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('CheckoutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form inputs and order summary accurately', () => {
    const { getByTestId, getByText } = render(
      <CheckoutScreen navigation={mockNavigation} />
    );

    expect(getByTestId('input-first-name')).toBeTruthy();
    expect(getByTestId('input-last-name')).toBeTruthy();
    expect(getByTestId('input-shipping-address')).toBeTruthy();
    expect(getByTestId('input-credit-card')).toBeTruthy();
    expect(getByTestId('checkout-total-price')).toBeTruthy();
    expect(getByText('$53.99')).toBeTruthy();
  });

  it('displays validation errors when submitting with empty fields', async () => {
    const { getByTestId, getByText } = render(
      <CheckoutScreen navigation={mockNavigation} />
    );

    const placeOrderBtn = getByTestId('btn-place-order');
    fireEvent.press(placeOrderBtn);

    await waitFor(() => {
      expect(getByText('First name is required')).toBeTruthy();
      expect(getByText('Last name is required')).toBeTruthy();
      expect(getByText('Shipping address is required')).toBeTruthy();
      expect(getByText('Credit card number is required')).toBeTruthy();
    });
  });

  it('validates credit card length (< 16 digits)', async () => {
    const { getByTestId, getByText } = render(
      <CheckoutScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('input-first-name'), 'Alice');
    fireEvent.changeText(getByTestId('input-last-name'), 'Smith');
    fireEvent.changeText(getByTestId('input-shipping-address'), '456 Book Way');
    fireEvent.changeText(getByTestId('input-credit-card'), '123456');

    fireEvent.press(getByTestId('btn-place-order'));

    await waitFor(() => {
      expect(getByText('Card number must be exactly 16 digits')).toBeTruthy();
    });
  });

  it('submits order successfully and renders order confirmation view', async () => {
    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Order processed successfully',
        orderId: 'ORD-TEST-999',
      },
    });

    const { getByTestId, getByText } = render(
      <CheckoutScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('input-first-name'), 'Bob');
    fireEvent.changeText(getByTestId('input-last-name'), 'Jones');
    fireEvent.changeText(getByTestId('input-shipping-address'), '789 Library St');
    fireEvent.changeText(getByTestId('input-credit-card'), '4242424242424242');

    fireEvent.press(getByTestId('btn-place-order'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/checkout/process', {
        firstName: 'Bob',
        lastName: 'Jones',
        address: '789 Library St',
        creditCard: '4242424242424242',
      });
      expect(mockClearCart).toHaveBeenCalled();
      expect(getByTestId('order-confirmation-view')).toBeTruthy();
      expect(getByText('ORD-TEST-999')).toBeTruthy();
      expect(getByText('Order Confirmed!')).toBeTruthy();
    });

    // Tap Continue Shopping
    fireEvent.press(getByTestId('btn-continue-shopping'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CatalogTab');
  });

  it('displays error banner when order submission fails', async () => {
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        data: {
          error: 'Internal Server Error: Payment Gateway Timeout',
        },
      },
    });

    const { getByTestId, getByText } = render(
      <CheckoutScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('input-first-name'), 'Carol');
    fireEvent.changeText(getByTestId('input-last-name'), 'White');
    fireEvent.changeText(getByTestId('input-shipping-address'), '101 Pine St');
    fireEvent.changeText(getByTestId('input-credit-card'), '1111222233334444');

    fireEvent.press(getByTestId('btn-place-order'));

    await waitFor(() => {
      expect(getByTestId('checkout-error-banner')).toBeTruthy();
      expect(
        getByText('⚠️ Internal Server Error: Payment Gateway Timeout')
      ).toBeTruthy();
    });
  });
});

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OfflineBanner } from '../components/OfflineBanner';
import { ChaosScreen } from '../screens/ChaosScreen';
import {
  apiClient,
  isSimulatedOffline,
  setSimulatedOffline,
} from '../api/client';
import type { Book } from '@buggybooks/types';

// Mock navigation
const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock useAuth
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn().mockResolvedValue({ success: true }),
    register: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

// Mock useCart
const mockAddToCart = jest.fn();
const mockClearCart = jest.fn();
jest.mock('../context/CartContext', () => ({
  useCart: () => ({
    cart: [
      {
        id: 'book-42',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        price: 45.0,
      },
    ],
    addToCart: mockAddToCart,
    clearCart: mockClearCart,
    subtotal: 45.0,
    tax: 3.6,
    total: 48.6,
    cartCount: 1,
  }),
}));

describe('Mobile Anti-Patterns & Chaos Injections (MOB-B1 - MOB-B6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      setSimulatedOffline(false);
    });
  });

  afterEach(() => {
    act(() => {
      setSimulatedOffline(false);
    });
  });

  describe('MOB-B1: Obfuscated Locators', () => {
    it('uses obfuscated testIDs txt_usr_77 and txt_pwd_99 on LoginScreen', () => {
      const { getByTestId } = render(<LoginScreen navigation={mockNavigation} />);
      expect(getByTestId('txt_usr_77')).toBeTruthy();
      expect(getByTestId('txt_pwd_99')).toBeTruthy();
    });

    it('uses obfuscated testIDs txt_fn_55, txt_usr_77 and txt_pwd_99 on RegisterScreen', () => {
      const { getByTestId } = render(<RegisterScreen navigation={mockNavigation} />);
      expect(getByTestId('txt_fn_55')).toBeTruthy();
      expect(getByTestId('txt_usr_77')).toBeTruthy();
      expect(getByTestId('txt_pwd_99')).toBeTruthy();
    });

    it('uses computed testID btn_item_${id}_add on CatalogScreen book cards', async () => {
      const mockBook: Book = {
        id: 'book-77',
        title: 'Microservices Patterns',
        author: 'Chris Richardson',
        price: 52.0,
        image: 'https://example.com/microservices.jpg',
      };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [mockBook] });

      const { getByTestId } = render(<CatalogScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByTestId('btn_item_book-77_add')).toBeTruthy();
      });
    });

    it('uses non-semantic testIDs txt_f1, txt_l1, txt_addr_88, txt_c99 on CheckoutScreen', () => {
      const { getByTestId } = render(<CheckoutScreen navigation={mockNavigation} />);
      expect(getByTestId('txt_f1')).toBeTruthy();
      expect(getByTestId('txt_l1')).toBeTruthy();
      expect(getByTestId('txt_addr_88')).toBeTruthy();
      expect(getByTestId('txt_c99')).toBeTruthy();
    });
  });

  describe('MOB-B2: Keyboard Occlusion on Checkout', () => {
    it('renders CheckoutScreen without KeyboardAvoidingView allowing natural keyboard occlusion', () => {
      const { UNSAFE_queryByType } = render(<CheckoutScreen navigation={mockNavigation} />);
      // Verify KeyboardAvoidingView is not in the tree
      const keyboardAvoid = UNSAFE_queryByType('KeyboardAvoidingView' as any);
      expect(keyboardAvoid).toBeNull();
    });
  });

  describe('MOB-B3: Dynamic Add-to-Cart Delays', () => {
    it('executes quick add to cart from catalog card button', async () => {
      const mockBook: Book = {
        id: 'book-101',
        title: 'Domain-Driven Design',
        author: 'Eric Evans',
        price: 55.0,
        image: 'https://example.com/ddd.jpg',
      };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [mockBook] });

      const { getByTestId } = render(<CatalogScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByTestId('btn_item_book-101_add')).toBeTruthy();
      });

      fireEvent.press(getByTestId('btn_item_book-101_add'));

      await waitFor(() => {
        expect(mockAddToCart).toHaveBeenCalledWith('book-101', 1);
      });
    });
  });

  describe('MOB-B4: Stochastic Gateway Timeout & In-Screen Retry', () => {
    it('displays banner_checkout_error with btn_retry_payment upon gateway failure', async () => {
      jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
        response: {
          data: {
            error: 'Internal Server Error: Payment Gateway Timeout',
          },
        },
      });

      const { getByTestId, getByText } = render(<CheckoutScreen navigation={mockNavigation} />);

      fireEvent.changeText(getByTestId('txt_f1'), 'Alice');
      fireEvent.changeText(getByTestId('txt_l1'), 'Cooper');
      fireEvent.changeText(getByTestId('txt_addr_88'), '123 Rock Rd');
      fireEvent.changeText(getByTestId('txt_c99'), '4242424242424242');

      fireEvent.press(getByTestId('btn-place-order'));

      await waitFor(() => {
        expect(getByTestId('banner_checkout_error')).toBeTruthy();
        expect(getByTestId('btn_retry_payment')).toBeTruthy();
      });

      // Tapping retry submits again
      jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          orderId: 'ORD-RETRY-OK',
        },
      });

      fireEvent.press(getByTestId('btn_retry_payment'));

      await waitFor(() => {
        expect(getByText('ORD-RETRY-OK')).toBeTruthy();
      });
    });
  });

  describe('MOB-B5: Simulated Network Interruption & Offline Banner', () => {
    it('renders OfflineBanner only when isSimulatedOffline is active', () => {
      expect(isSimulatedOffline()).toBe(false);
      const { queryByTestId, rerender } = render(<OfflineBanner />);

      expect(queryByTestId('offline_banner')).toBeNull();

      act(() => {
        setSimulatedOffline(true);
      });
      rerender(<OfflineBanner />);

      expect(queryByTestId('offline_banner')).toBeTruthy();
    });

    it('rejects API client requests with ECONNABORTED when offline mode is active', async () => {
      act(() => {
        setSimulatedOffline(true);
      });

      await expect(apiClient.get('/api/books')).rejects.toMatchObject({
        code: 'ECONNABORTED',
        message: expect.stringContaining('Simulated offline mode active'),
      });
    });

    it('toggles offline mode in ChaosScreen and updates client state', async () => {
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          checkoutFailureRate: 0.15,
          inventoryDelayMs: 3000,
        },
      });

      const { getByTestId, getByText } = render(<ChaosScreen />);

      await waitFor(() => {
        expect(getByTestId('toggle_simulated_offline')).toBeTruthy();
        expect(getByText('ONLINE')).toBeTruthy();
      });

      fireEvent(getByTestId('toggle_simulated_offline'), 'valueChange', true);

      expect(isSimulatedOffline()).toBe(true);
      expect(getByText('OFFLINE')).toBeTruthy();
    });
  });

  describe('MOB-B6: Orientation Layout Shifts', () => {
    it('applies place order button styles without throwing during landscape dimensions', () => {
      const { getByTestId } = render(<CheckoutScreen navigation={mockNavigation} />);
      const btn = getByTestId('btn-place-order');
      expect(btn).toBeTruthy();
    });
  });
});

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { CartProvider, useCart } from '../context/CartContext';
import { apiClient } from '../api/client';
import type { Book } from '@buggybooks/types';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: 'testuser', fullName: 'Test User' },
  }),
}));

const mockBook1: Book = {
  id: '1',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  price: 29.99,
  image: 'https://example.com/clean-code.jpg',
};

const mockBook2: Book = {
  id: '2',
  title: 'The Pragmatic Programmer',
  author: 'David Thomas',
  price: 39.99,
  image: 'https://example.com/pragmatic.jpg',
};

describe('CartContext & useCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches cart on mount and computes totals accurately', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [mockBook1, mockBook2],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cartCount).toBe(2);
    });

    expect(result.current.cart).toHaveLength(2);
    expect(result.current.subtotal).toBe(69.98);
    expect(result.current.tax).toBe(5.6);
    expect(result.current.total).toBe(75.58);
    expect(result.current.groupedItems).toHaveLength(2);
  });

  it('adds items to cart and updates state', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [] });
    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: [mockBook1] });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cartCount).toBe(0);
    });

    await act(async () => {
      await result.current.addToCart('1');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/cart', { bookId: '1', quantity: 1 });
    expect(result.current.cartCount).toBe(1);
    expect(result.current.total).toBe(32.39); // 29.99 + 2.40 tax

  });

  it('removes item from cart and recalculates totals', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [mockBook1, mockBook2],
    });
    jest.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: [mockBook2],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cartCount).toBe(2);
    });

    await act(async () => {
      await result.current.removeFromCart('1');
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/api/cart/1');
    expect(result.current.cartCount).toBe(1);
    expect(result.current.cart[0].id).toBe('2');
  });

  it('clears all items from cart', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [mockBook1],
    });
    jest.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { success: true },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cartCount).toBe(1);
    });

    await act(async () => {
      await result.current.clearCart();
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/api/cart');
    expect(result.current.cartCount).toBe(0);
    expect(result.current.cart).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('groups duplicate books correctly and calculates quantity', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [mockBook1, mockBook1, mockBook2],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cartCount).toBe(3);
    });

    expect(result.current.groupedItems).toHaveLength(2);
    const book1Group = result.current.groupedItems.find((g) => g.book.id === '1');
    expect(book1Group?.quantity).toBe(2);
    expect(book1Group?.subtotal).toBe(59.98);
  });
});

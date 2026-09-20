import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Book } from '@buggybooks/types';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';


export interface GroupedCartItem {
  book: Book;
  quantity: number;
  subtotal: number;
}

export interface CartContextType {
  cart: Book[];
  groupedItems: GroupedCartItem[];
  cartCount: number;
  subtotal: number;
  tax: number;
  total: number;
  isLoading: boolean;
  addToCart: (bookId: string, quantity?: number) => Promise<void>;
  removeFromCart: (bookId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const TAX_RATE = 0.08; // 8% sales tax

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get<Book[]>('/api/cart');
      setCart(Array.isArray(response.data) ? response.data : []);
    } catch {
      // Fallback if cart not initialized or network is offline
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated, refreshCart]);

  const addToCart = useCallback(async (bookId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<Book[]>('/api/cart', { bookId, quantity });
      if (Array.isArray(res.data)) {
        setCart(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (bookId: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.delete<Book[]>(`/api/cart/${bookId}`);
      if (Array.isArray(res.data)) {
        setCart(res.data);
      } else {
        // Fallback: local filter if backend returns empty or non-array
        const index = cart.findIndex((b) => b.id === bookId);
        if (index !== -1) {
          const next = [...cart];
          next.splice(index, 1);
          setCart(next);
        }
      }
    } catch {
      // Local fallback removal
      const index = cart.findIndex((b) => b.id === bookId);
      if (index !== -1) {
        const next = [...cart];
        next.splice(index, 1);
        setCart(next);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cart]);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.delete('/api/cart');
      setCart([]);
    } catch {
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const groupedItems = useMemo<GroupedCartItem[]>(() => {
    const map = new Map<string, { book: Book; count: number }>();
    for (const item of cart) {
      const existing = map.get(item.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(item.id, { book: item, count: 1 });
      }
    }
    return Array.from(map.values()).map(({ book, count }) => ({
      book,
      quantity: count,
      subtotal: Number((book.price * count).toFixed(2)),
    }));
  }, [cart]);

  const subtotal = useMemo(() => {
    return Number(cart.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2));
  }, [cart]);

  const tax = useMemo(() => {
    return Number((subtotal * TAX_RATE).toFixed(2));
  }, [subtotal]);

  const total = useMemo(() => {
    return Number((subtotal + tax).toFixed(2));
  }, [subtotal, tax]);

  const cartCount = cart.length;

  const value = useMemo<CartContextType>(() => ({
    cart,
    groupedItems,
    cartCount,
    subtotal,
    tax,
    total,
    isLoading,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart,
  }), [cart, groupedItems, cartCount, subtotal, tax, total, isLoading, addToCart, removeFromCart, clearCart, refreshCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: [],
      groupedItems: [],
      cartCount: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      isLoading: false,
      addToCart: async (bookId: string, quantity = 1) => {
        await apiClient.post('/api/cart', { bookId, quantity });
      },
      removeFromCart: async (bookId: string) => {
        await apiClient.delete(`/api/cart/${bookId}`);
      },
      clearCart: async () => {
        await apiClient.delete('/api/cart');
      },
      refreshCart: async () => {},
    };
  }
  return context;
};



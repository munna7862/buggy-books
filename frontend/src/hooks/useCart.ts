import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import type { CartItem } from '@buggybooks/types';
import { useAuth } from '../AuthContext';

export function useCart() {
  let isAuthenticated = true;
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
  } catch (e) {
    // Default to true when used outside AuthProvider (e.g. in some unit tests)
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const items = await api.getCart();
      setCart(items);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = useCallback(async (bookId: string) => {
    setAddingId(bookId);
    // Simulate natural catalog processing lag
    const delay = Math.floor(Math.random() * 1500) + 500;
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const updatedCart = await api.addToCart(bookId);
          setCart(updatedCart);
          toast.success('Added to cart!');
          resolve();
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || 'Failed to add to cart');
          reject(err);
        } finally {
          setAddingId(null);
        }
      }, delay);
    });
  }, []);

  const removeFromCart = useCallback(async (bookId: string) => {
    setRemovingId(bookId);
    try {
      const updatedCart = await api.removeFromCart(bookId);
      setCart(updatedCart);
      toast.success('Item removed from cart');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setClearing(true);
    try {
      await api.clearCart();
      setCart([]);
      toast.success('Cart cleared');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to clear cart');
    } finally {
      setClearing(false);
    }
  }, []);

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return {
    cart,
    loading,
    addingId,
    removingId,
    clearing,
    total,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart
  };
}
export type { CartItem };

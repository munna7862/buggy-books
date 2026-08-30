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
  } catch {
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
    } catch (err: unknown) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let ignore = false;
    api.getCart()
      .then((items) => {
        if (!ignore) setCart(items);
      })
      .catch((err: unknown) => {
        if (!ignore) console.error('Failed to fetch cart:', err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

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
        } catch (err: unknown) {
          console.error(err);
          const message = err instanceof Error ? err.message : 'Failed to add to cart';
          toast.error(message);
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
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to remove item';
      toast.error(message);
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
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to clear cart';
      toast.error(message);
    } finally {
      setClearing(false);
    }
  }, []);

  const visibleCart = isAuthenticated ? cart : [];
  const total = visibleCart.reduce((acc, item) => acc + item.price, 0);

  return {
    cart: visibleCart,
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

import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  title: string;
  price: number;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    api.getCart().then(setCart).catch(console.error);
  }, []);

  const handleRemove = async (bookId: string) => {
    setRemovingId(bookId);
    try {
      const updatedCart = await api.removeFromCart(bookId);
      setCart(updatedCart);
      toast.success('Item removed from cart');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await api.clearCart();
      setCart([]);
      toast.success('Cart cleared');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear cart');
    } finally {
      setClearing(false);
    }
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div>
      <h1>Your Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <ul className="cart-list">
            {cart.map((item, i) => (
              <li key={`${item.id}-${i}`} className="cart-item">
                <span>{item.title}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>${item.price.toFixed(2)}</span>
                  <button
                    className="cart-remove-btn"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                  >
                    {removingId === item.id ? '...' : '✕'}
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <h3 className="cart-total-header">Total: ${total.toFixed(2)}</h3>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              className="cart-clear-btn"
              onClick={handleClearAll}
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
            <Link to="/checkout" style={{ textDecoration: 'none' }}>
              <button className="action-btn-primary">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

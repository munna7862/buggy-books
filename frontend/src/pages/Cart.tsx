import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

interface CartItem {
  id: string;
  title: string;
  price: number;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    api.getCart().then(setCart).catch(console.error);
  }, []);

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
                <span>{item.title}</span> <span>${item.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <h3 className="cart-total-header">Total: ${total.toFixed(2)}</h3>
          <Link to="/checkout" style={{ textDecoration: 'none' }}>
            <button className="action-btn-primary">
              Proceed to Checkout
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

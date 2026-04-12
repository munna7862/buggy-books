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
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {cart.map((item, i) => (
              <li key={`${item.id}-${i}`} style={{ padding: '0.5rem', borderBottom: '1px solid #ccc' }}>
                {item.title} - ${item.price.toFixed(2)}
              </li>
            ))}
          </ul>
          <h3>Total: ${total.toFixed(2)}</h3>
          <Link to="/checkout">
            <button style={{ padding: '10px 20px', background: 'blue', color: 'white', cursor: 'pointer' }}>
              Proceed to Checkout
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

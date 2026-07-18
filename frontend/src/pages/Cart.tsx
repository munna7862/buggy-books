import { useCart } from '../hooks/useCart';
import { Link } from 'react-router-dom';

export default function Cart() {
  const {
    cart,
    removingId,
    clearing,
    total,
    removeFromCart,
    clearCart
  } = useCart();

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
                    onClick={() => removeFromCart(item.id)}
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
              onClick={clearCart}
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

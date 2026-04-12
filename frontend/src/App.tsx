import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { useEffect } from 'react';
import { api } from './api';

function App() {
  
  // Dummy auto-login on startup for testing convenience
  useEffect(() => {
    api.login('testuser', 'password').catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container" style={{ fontFamily: 'sans-serif' }}>
        <header style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', gap: '1rem' }}>
          <h2>BuggyBooks</h2>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/">Catalog</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/checkout">Checkout</Link>
          </nav>
        </header>

        <main style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App;

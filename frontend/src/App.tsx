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
      <div className="app-container">
        <header className="glass-nav">
          <Link to="/" style={{textDecoration: 'none'}}>
            <h2 className="nav-brand">BuggyBooks</h2>
          </Link>
          <nav className="nav-links">
            <Link to="/" className="nav-link">Catalog</Link>
            <Link to="/cart" className="nav-link">Cart</Link>
            <Link to="/checkout" className="nav-link">Checkout</Link>
          </nav>
        </header>

        <main className="main-content">
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

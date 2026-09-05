import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import BookDetail from './pages/BookDetail';
import Profile from './pages/Profile';
import ChaosDashboard from './pages/ChaosDashboard';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import NotificationCenter from './components/NotificationCenter';
import { ChaosProvider } from './ChaosContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="glass-nav">
      <Link to="/" style={{textDecoration: 'none'}} onClick={closeMobileMenu}>
        <h2 className="nav-brand">BuggyBooks</h2>
      </Link>
      <button
        className="mobile-menu-btn"
        id="mobile-menu-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        <span className="hamburger-icon" />
      </button>
      <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/" className="nav-link" onClick={closeMobileMenu}>Catalog</Link>
        <Link to="/admin/chaos" className="nav-link" id="nav-chaos-link" onClick={closeMobileMenu}>Chaos Control</Link>
        {isAuthenticated ? (
          <>
            <Link to="/cart" className="nav-link" onClick={closeMobileMenu}>Cart</Link>
            <Link to="/checkout" className="nav-link" onClick={closeMobileMenu}>Checkout</Link>
            <Link to="/profile" className="nav-link" id="nav-profile-link" onClick={closeMobileMenu}>Profile</Link>
            <button
              onClick={() => { logout(); closeMobileMenu(); }}
              className="nav-link"
              style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem'}}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link" onClick={closeMobileMenu}>Login</Link>
            <Link to="/register" className="nav-link" onClick={closeMobileMenu}>Sign Up</Link>
          </>
        )}
        <NotificationCenter />
      </nav>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChaosProvider>
        <BrowserRouter>
          <div className="app-container">
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: 'var(--bg)',
              color: 'var(--text-h)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              fontFamily: 'var(--sans)'
            }
          }} />
          
          <Header />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/chaos" element={<ChaosDashboard />} />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      </ChaosProvider>
    </AuthProvider>
  )
}

export default App;

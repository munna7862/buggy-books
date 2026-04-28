import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="glass-nav">
      <Link to="/" style={{textDecoration: 'none'}}>
        <h2 className="nav-brand">BuggyBooks</h2>
      </Link>
      <nav className="nav-links">
        <Link to="/" className="nav-link">Catalog</Link>
        {isAuthenticated ? (
          <>
            <Link to="/cart" className="nav-link">Cart</Link>
            <Link to="/checkout" className="nav-link">Checkout</Link>
            <button onClick={logout} className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem'}}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link">Login</Link>
        )}
      </nav>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
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
              <Route path="/login" element={<Login />} />
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
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;

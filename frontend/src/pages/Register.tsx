import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Password Strength
  const [strength, setStrength] = useState({ score: 0, label: '' });

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Calculate password strength
    let score = 0;
    if (password.length > 5) score += 1;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Normalize to max 4
    score = Math.min(4, score);
    
    let label = '';
    if (password.length === 0) label = '';
    else if (score <= 1) label = 'weak';
    else if (score === 2) label = 'fair';
    else if (score === 3) label = 'good';
    else label = 'strong';
    
    setStrength({ score, label });
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Backend ignores full name currently, but we provide it for realism
      const data = await api.register(username, password);
      toast.success('Welcome to BuggyBooks! 🎉');
      if (data.token) {
        login(data.token);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Join BuggyBooks</h1>
          <p className="auth-subtitle">Create an account to start your journey.</p>
        </div>
        
        {error && (
          <div className="error-banner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Full Name</label>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Username</label>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="johndoe88"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            {password.length > 0 && (
              <div style={{ marginTop: '0.25rem' }}>
                <div className="pwd-strength-container">
                  <div className={`pwd-bar ${strength.score >= 1 ? `active-${strength.label}` : ''}`}></div>
                  <div className={`pwd-bar ${strength.score >= 2 ? `active-${strength.label}` : ''}`}></div>
                  <div className={`pwd-bar ${strength.score >= 3 ? `active-${strength.label}` : ''}`}></div>
                  <div className={`pwd-bar ${strength.score >= 4 ? `active-${strength.label}` : ''}`}></div>
                </div>
                <div className={`pwd-text ${strength.label}`}>
                  {strength.label.charAt(0).toUpperCase() + strength.label.slice(1)}
                </div>
              </div>
            )}
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Confirm Password</label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className="spinner"></span> Creating account...</>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.login(username, password);
      if (data.token) {
        login(data.token);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Login to BuggyBooks</h1>
      
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Form intentionally uses anti-pattern generic classes for automation hurdle */}
      <form onSubmit={handleSubmit} className="form-container-xyz">
        <div className="input-group-rnd-9182">
          <label className="lbl-t1">Username</label>
          <input 
            type="text" 
            name="txt_usr_77" 
            className="input-field-general" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
        </div>

        <div className="input-group-rnd-9182">
          <label className="lbl-t1">Password</label>
          <input 
            type="password" 
            name="txt_pwd_99" 
            className="input-field-general secure-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>

        <button 
          type="submit" 
          name="btn_submit_login_rnd"
          className="submit-action-btn primary-x2"
          disabled={isLoading}
        >
          {isLoading ? (
            <><span className="spinner"></span> Authenticating...</>
          ) : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

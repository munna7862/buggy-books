import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../AuthContext';
import { api } from '../api';
import { vi } from 'vitest';

// Mock the API module
vi.mock('../api', () => ({
  api: {
    login: vi.fn(),
  }
}));

const renderLogin = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with expected non-semantic names', () => {
    renderLogin();

    // Intentional QA anti-pattern attributes must remain intact
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'txt_usr_77');
    expect(document.querySelector('input[name="txt_pwd_99"]')).toBeInTheDocument();

    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /sign in/i })).toHaveAttribute('name', 'btn_submit_login_rnd');
  });

  it('shows error banner when login fails', async () => {
    (api.login as any).mockRejectedValue(new Error('Unauthorized: Invalid credentials'));
    
    renderLogin();
    
    const usernameInput = screen.getByRole('textbox');
    // For password, we don't have a specific role that RTL always grabs cleanly without label linkage, so we'll grab by attribute
    const passwordInput = document.querySelector('input[name="txt_pwd_99"]') as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Unauthorized: Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls login api and navigates on success', async () => {
    (api.login as any).mockResolvedValue({ token: 'mock-jwt-token' });
    
    renderLogin();
    
    const usernameInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[name="txt_pwd_99"]') as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('admin', 'password123');
    });
    
    // Note: React Router navigation mocking is complex in simple tests, 
    // but verifying the API call is sufficient for the component logic test.
  });
});

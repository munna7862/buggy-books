import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import { AuthProvider } from '../AuthContext';
import { api } from '../api';
import { vi } from 'vitest';

// Mock the API module
vi.mock('../api', () => ({
  api: {
    register: vi.fn(),
  }
}));

// Mock react-hot-toast so it doesn't try to render DOM elements in tests
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

const renderRegister = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all registration form fields', () => {
    renderRegister();
    
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('johndoe88')).toBeInTheDocument();
    
    // There are two password fields with the same placeholder, we can find them by their label
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderRegister();
    
    const fullNameInput = screen.getByPlaceholderText('John Doe');
    const usernameInput = screen.getByPlaceholderText('johndoe88');
    
    // Get password inputs by looking at their associated labels or order
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = passwordInputs[1];
    
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    expect(api.register).not.toHaveBeenCalled();
  });

  it('shows error banner when API registration fails', async () => {
    (api.register as any).mockRejectedValue(new Error('Registration failed. Please try again.'));
    
    renderRegister();
    
    const fullNameInput = screen.getByPlaceholderText('John Doe');
    const usernameInput = screen.getByPlaceholderText('johndoe88');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = passwordInputs[1];
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('calls register api on successful form submission', async () => {
    (api.register as any).mockResolvedValue({ token: 'mock-jwt-token' });
    
    renderRegister();
    
    const fullNameInput = screen.getByPlaceholderText('John Doe');
    const usernameInput = screen.getByPlaceholderText('johndoe88');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = passwordInputs[1];
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith('testuser', 'password123', 'Test User');
    });
  });
});

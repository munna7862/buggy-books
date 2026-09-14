import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

export type NavigateCallback = (path: string) => void;

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  setNavigateHandler: (handler: NavigateCallback | null) => void;
}

const AUTH_USER_KEY = 'authUser';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onNavigate?: NavigateCallback;
}> = ({ children, onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(AUTH_USER_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(AUTH_USER_KEY));
  const navigateRef = useRef<NavigateCallback | null>(onNavigate || null);

  useEffect(() => {
    if (onNavigate) {
      navigateRef.current = onNavigate;
    }
  }, [onNavigate]);

  const setNavigateHandler = useCallback((handler: NavigateCallback | null) => {
    navigateRef.current = handler;
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      try {
        localStorage.removeItem(AUTH_USER_KEY);
      } catch {
        // ignore storage errors
      }
      setIsAuthenticated(false);
      setUsername(null);

      if (navigateRef.current) {
        navigateRef.current('/login');
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:navigate', { detail: { path: '/login' } }));
      }
    };

    if (typeof api?.onUnauthorized === 'function') {
      api.onUnauthorized(handleUnauthorized);
    }
    return () => {
      if (typeof api?.onUnauthorized === 'function') {
        api.onUnauthorized(null);
      }
    };
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      if (savedUser) {
        setIsAuthenticated(true);
        setUsername(savedUser);
      } else {
        setIsAuthenticated(false);
        setUsername(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback((user: string) => {
    localStorage.setItem(AUTH_USER_KEY, user);
    setIsAuthenticated(true);
    setUsername(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      console.error('Logout API failed, proceeding with local clear');
    }
    localStorage.removeItem(AUTH_USER_KEY);
    setIsAuthenticated(false);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, setNavigateHandler }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


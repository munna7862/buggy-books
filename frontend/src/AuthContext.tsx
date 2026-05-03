import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

const AUTH_USER_KEY = 'authUser';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    if (savedUser) {
      setIsAuthenticated(true);
      setUsername(savedUser);
    } else {
      setIsAuthenticated(false);
      setUsername(null);
    }
  }, []);

  const login = useCallback((user: string) => {
    localStorage.setItem(AUTH_USER_KEY, user);
    setIsAuthenticated(true);
    setUsername(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error('Logout API failed, proceeding with local clear');
    }
    localStorage.removeItem(AUTH_USER_KEY);
    setIsAuthenticated(false);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
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

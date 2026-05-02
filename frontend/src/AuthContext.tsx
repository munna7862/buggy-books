import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const TOKEN_KEY = 'dummyAccessToken';

/**
 * Decodes a JWT and checks whether it is structurally valid and not expired.
 * No signature verification — this is client-side protection only.
 */
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/**
 * Reads the 'username' claim from a JWT payload without verifying the signature.
 */
const getUsernameFromToken = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username ?? null;
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && isTokenValid(token)) {
      setIsAuthenticated(true);
      setUsername(getUsernameFromToken(token));
    } else {
      // Token missing or expired — clean up stale storage
      localStorage.removeItem(TOKEN_KEY);
      setIsAuthenticated(false);
      setUsername(null);
    }
  }, []);

  const login = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setIsAuthenticated(true);
    setUsername(getUsernameFromToken(token));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
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

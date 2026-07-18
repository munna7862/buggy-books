import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { config } from '../config';

const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
  const isProd = config.isProduction;
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 3600000 // 1 hour
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth/refresh',
    maxAge: 30 * 24 * 3600 * 1000 // 30 days
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  setAuthCookies(res, result.token, result.refreshToken);
  res.json({ message: 'Login successful', username: result.username });
};

export const register = async (req: Request, res: Response) => {
  const { username, password, fullName } = req.body;
  const result = await authService.register(username, password, fullName);
  setAuthCookies(res, result.token, result.refreshToken);
  res.status(201).json({ message: 'Registration successful', username: result.username });
};

export const logout = (req: Request, res: Response) => {
  const username = req.user?.username;
  res.clearCookie('token');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  logger.info(`User logged out: ${username || 'anonymous'}`, { username });
  res.json({ message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  const result = authService.refresh(refreshToken);
  
  const isProd = config.isProduction;
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 3600000 // 1 hour
  });

  res.json({ success: true, username: result.username });
};

export const resetUsers = () => {
  authService.resetUsers();
};

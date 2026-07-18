import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_SECRET } from '../config';

import { storage } from '../data/storage';
import { logger } from '../utils/logger';
import { chaosStore } from '../data/chaosStore';
import type { UserRecord } from '@buggybooks/types';

const SALT_ROUNDS = 10;

const defaultUsers: Record<string, UserRecord> = {
  admin: { passwordHash: bcrypt.hashSync('password123', SALT_ROUNDS) },
  testuser: { passwordHash: bcrypt.hashSync('buggybooks', SALT_ROUNDS) },
};

const MOCK_USERS: Record<string, UserRecord> = storage.get('users') || defaultUsers;

const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === 'production';
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

  if (!username || !password) {
    logger.warn('Login attempt failed: Missing username or password');
    return res.status(400).json({ error: 'Bad Request: Username and password required' });
  }

  const user = MOCK_USERS[username];
  if (!user) {
    logger.warn(`Login attempt failed: Invalid credentials for user ${username}`, { attemptedUsername: username });
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (isValid) {
    const expiry = chaosStore.getConfig().jwtExpirySeconds;
    const token = jwt.sign({ username, type: 'access' }, JWT_SECRET, { expiresIn: expiry });
    const refreshToken = jwt.sign({ username, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
    setAuthCookies(res, token, refreshToken);
    logger.info(`User login successful: ${username}`, { username });
    res.json({ message: 'Login successful', username });
  } else {
    logger.warn(`Login attempt failed: Invalid credentials for user ${username}`, { attemptedUsername: username });
    res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { username, password, fullName } = req.body;

  if (!username || !password) {
    logger.warn('Registration attempt failed: Missing username or password');
    return res.status(400).json({ error: 'Bad Request: Username and password required' });
  }

  if (MOCK_USERS[username]) {
    logger.warn(`Registration attempt failed: Username ${username} already exists`, { attemptedUsername: username });
    return res.status(409).json({ error: 'Conflict: Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  MOCK_USERS[username] = { passwordHash, fullName };
  storage.set('users', MOCK_USERS);

  const expiry = chaosStore.getConfig().jwtExpirySeconds;
  const token = jwt.sign({ username, type: 'access' }, JWT_SECRET, { expiresIn: expiry });
  const refreshToken = jwt.sign({ username, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
  setAuthCookies(res, token, refreshToken);
  logger.info(`User registration successful: ${username}`, { username });
  res.status(201).json({ message: 'Registration successful', username });
};

export const logout = (req: Request, res: Response) => {
  const username = req.user?.username;
  res.clearCookie('token');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  logger.info(`User logged out: ${username || 'anonymous'}`, { username });
  res.json({ message: 'Logged out successfully' });
};

export const refresh = (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    logger.warn('Refresh failed: Missing refresh token cookie');
    return res.status(401).json({ error: 'Unauthorized: Refresh token required' });
  }

  jwt.verify(refreshToken, JWT_SECRET, (err: any, decoded: any) => {
    if (err || decoded?.type !== 'refresh') {
      logger.warn('Refresh failed: Invalid or expired refresh token');
      return res.status(403).json({ error: 'Forbidden: Invalid refresh token' });
    }

    const username = decoded.username;
    const expiry = chaosStore.getConfig().jwtExpirySeconds;
    
    const newToken = jwt.sign({ username, type: 'access' }, JWT_SECRET, { expiresIn: expiry });
    
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 3600000 // 1 hour
    });

    logger.info(`Token silently refreshed for user: ${username}`, { username });
    res.json({ success: true, username });
  });
};

export const resetUsers = () => {
  for (const username in MOCK_USERS) {
    if (!defaultUsers[username]) {
      delete MOCK_USERS[username];
    }
  }
  storage.set('users', MOCK_USERS);
};

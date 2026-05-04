import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_SECRET } from '../config';

import { storage } from '../data/storage';

const SALT_ROUNDS = 10;

interface UserRecord {
  passwordHash: string;
  fullName?: string;
}

const defaultUsers: Record<string, UserRecord> = {
  admin: { passwordHash: bcrypt.hashSync('password123', SALT_ROUNDS) },
  testuser: { passwordHash: bcrypt.hashSync('buggybooks', SALT_ROUNDS) },
};

const MOCK_USERS: Record<string, UserRecord> = storage.get('users') || defaultUsers;

const setAuthCookie = (res: Response, token: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 3600000 // 1 hour
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Bad Request: Username and password required' });
  }

  const user = MOCK_USERS[username];
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (isValid) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    setAuthCookie(res, token);
    res.json({ message: 'Login successful', username });
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { username, password, fullName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Bad Request: Username and password required' });
  }

  if (MOCK_USERS[username]) {
    return res.status(409).json({ error: 'Conflict: Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  MOCK_USERS[username] = { passwordHash, fullName };
  storage.set('users', MOCK_USERS);

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  setAuthCookie(res, token);
  res.status(201).json({ message: 'Registration successful', username });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_SECRET } from '../config';

const SALT_ROUNDS = 10;

// Seed users with pre-hashed passwords so bcrypt works consistently from startup.
// Original plain-text values: admin→password123, testuser→buggybooks
// These hashes were generated with bcrypt saltRounds=10
interface UserRecord {
  passwordHash: string;
  fullName?: string;
}

const MOCK_USERS: Record<string, UserRecord> = {
  admin: { passwordHash: bcrypt.hashSync('password123', SALT_ROUNDS) },
  testuser: { passwordHash: bcrypt.hashSync('buggybooks', SALT_ROUNDS) },
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
    res.json({ token });
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

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.status(201).json({ token, message: 'Registration successful' });
};

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'super-secret-buggy-key';

const MOCK_USERS: Record<string, string> = {
  'admin': 'password123',
  'testuser': 'buggybooks'
};

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Bad Request: Username and password required' });
  }

  if (MOCK_USERS[username] === password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }
};

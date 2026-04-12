import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const router = Router();
const DB_FILE = path.join(__dirname, '../data/db.json');
const SECRET_KEY = 'super-secret-buggy-key';

// Helper to read DB
const readDB = () => {
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Middleware to authenticate cart operations
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token required' });
  }

  jwt.verify(token, SECRET_KEY, (err) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    next();
  });
};

// 1. GET /api/books (Standard)
router.get('/books', (req, res) => {
  const db = readDB();
  res.json(db.books);
});

// 2. POST /api/login (Mock JWT)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(400).json({ error: 'Username and password required' });
  }
});

// 3. GET /api/cart (Requires JWT)
router.get('/cart', authenticateToken, (req, res) => {
  const db = readDB();
  res.json(db.cart);
});

// 4. POST /api/cart (Requires JWT)
router.post('/cart', authenticateToken, (req, res) => {
  const { bookId } = req.body;
  const db = readDB();
  const book = db.books.find((b: any) => b.id === bookId);
  
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  db.cart.push(book);
  writeDB(db);
  res.json(db.cart);
});

// 5. POST /api/checkout/process (Flaky Endpoint)
router.post('/checkout/process', authenticateToken, (req, res) => {
  // 15% chance to fail
  if (Math.random() < 0.15) {
    return res.status(500).json({ error: 'Internal Server Error: Payment Gateway Timeout' });
  }
  
  // Success -> empty cart
  const db = readDB();
  db.cart = [];
  writeDB(db);
  res.json({ success: true, message: 'Order processed successfully' });
});

// 6. GET /api/inventory/report (Heavy Endpoint)
router.get('/inventory/report', (req, res) => {
  // 3 second delay to simulate heavy database load
  setTimeout(() => {
    const db = readDB();
    res.json({
      totalBooks: db.books.length,
      totalValue: db.books.reduce((acc: number, b: any) => acc + b.price, 0),
      timestamp: new Date().toISOString()
    });
  }, 3000);
});

// DELETE /api/cart (Clear cart manually for testing convenience)
router.delete('/cart', authenticateToken, (req, res) => {
    const db = readDB();
    db.cart = [];
    writeDB(db);
    res.json({ success: true });
});

export default router;

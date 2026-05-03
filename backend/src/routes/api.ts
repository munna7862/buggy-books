import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

import * as bookController from '../controllers/bookController';
import * as authController from '../controllers/authController';
import * as cartController from '../controllers/cartController';
import * as checkoutController from '../controllers/checkoutController';
import * as testController from '../controllers/testController';

const router = Router();

// Middleware to authenticate operations
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    next();
  });
};

// --- Standard API Routes ---
router.get('/books', bookController.getBooks);
router.get('/books/:id', bookController.getBookById);
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

router.get('/cart', authenticateToken, cartController.getCart);
router.post('/cart', authenticateToken, cartController.addToCart);
router.delete('/cart', authenticateToken, cartController.clearCart);
router.delete('/cart/:bookId', authenticateToken, cartController.removeFromCart);

router.post('/checkout/process', authenticateToken, checkoutController.processCheckout);
router.get('/orders', authenticateToken, checkoutController.getOrders);

router.get('/inventory/report', bookController.getInventoryReport);

// --- Testing / Chaos API Routes ---
router.post('/test/config', testController.updateConfig);
router.post('/test/reset', testController.resetData);

export default router;

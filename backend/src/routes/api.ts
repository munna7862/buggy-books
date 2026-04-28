import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import * as bookController from '../controllers/bookController';
import * as authController from '../controllers/authController';
import * as cartController from '../controllers/cartController';
import * as checkoutController from '../controllers/checkoutController';
import * as testController from '../controllers/testController';

const router = Router();
const SECRET_KEY = 'super-secret-buggy-key';

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

// --- Standard API Routes ---
router.get('/books', bookController.getBooks);
router.post('/login', authController.login);

router.get('/cart', authenticateToken, cartController.getCart);
router.post('/cart', authenticateToken, cartController.addToCart);
router.delete('/cart', authenticateToken, cartController.clearCart);

router.post('/checkout/process', authenticateToken, checkoutController.processCheckout);
router.get('/inventory/report', bookController.getInventoryReport);

// --- Testing / Chaos API Routes ---
router.post('/test/config', testController.updateConfig);
router.post('/test/reset', testController.resetData);

export default router;

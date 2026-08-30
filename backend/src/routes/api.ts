import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { loggerStore } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

import * as bookController from '../controllers/bookController';
import * as authController from '../controllers/authController';
import * as cartController from '../controllers/cartController';
import * as checkoutController from '../controllers/checkoutController';
import * as testController from '../controllers/testController';
import * as profileController from '../controllers/profileController';

const router = Router();

export interface AuthUser {
  username: string;
  type?: string;
  fullName?: string;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

// Middleware to authenticate operations
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as AuthUser;
    if (!user || user.type !== 'access') {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = user;

    const store = loggerStore.getStore();
    if (store && user.username) {
      store.username = user.username;
    }

    next();
  } catch {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

// --- Standard API Routes ---
router.get('/books', asyncHandler(bookController.getBooks));
router.get('/books/:id', asyncHandler(bookController.getBookById));
router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));
router.post('/logout', asyncHandler(authController.logout));
router.post('/auth/refresh', asyncHandler(authController.refresh));

router.get('/cart', authenticateToken, asyncHandler(cartController.getCart));
router.post('/cart', authenticateToken, asyncHandler(cartController.addToCart));
router.delete('/cart', authenticateToken, asyncHandler(cartController.clearCart));
router.delete('/cart/:bookId', authenticateToken, asyncHandler(cartController.removeFromCart));

router.post('/checkout/process', authenticateToken, asyncHandler(checkoutController.processCheckout));
router.get('/orders', authenticateToken, asyncHandler(checkoutController.getOrders));

router.get('/inventory/report', asyncHandler(bookController.getInventoryReport));

router.get('/profile', authenticateToken, asyncHandler(profileController.getProfile));
router.post('/profile/upload', profileController.handleAvatarUpload, authenticateToken, asyncHandler(profileController.uploadAvatar));

// --- Testing / Chaos API Routes ---
router.get('/test/config', asyncHandler(testController.getConfig));
router.post('/test/config', asyncHandler(testController.updateConfig));
router.post('/test/reset', asyncHandler(testController.resetData));
router.delete('/test/session/:id', asyncHandler(testController.deleteSession));

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { monitorEventLoopDelay } from 'perf_hooks';
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
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

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

interface GlobalWithGC {
  gc?: () => void;
}

// Runtime Telemetry & Event Loop Delay Observability (resolution: 20ms)
const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
eventLoopDelay.enable();

let lastCpuUsage = process.cpuUsage();
let lastCpuTime = process.hrtime.bigint();

function getEventLoopMetrics() {
  const toMs = (ns: number) => (Number.isFinite(ns) && ns >= 0 ? Number((ns / 1e6).toFixed(3)) : 0.0);
  return {
    min: toMs(eventLoopDelay.min),
    max: toMs(eventLoopDelay.max),
    mean: toMs(eventLoopDelay.mean),
    p50: toMs(eventLoopDelay.percentile(50)),
    p90: toMs(eventLoopDelay.percentile(90)),
    p95: toMs(eventLoopDelay.percentile(95)),
    p99: toMs(eventLoopDelay.percentile(99)),
  };
}

function getCpuMetrics() {
  const currentUsage = process.cpuUsage(lastCpuUsage);
  const currentTime = process.hrtime.bigint();
  const elapsedMicros = Number(currentTime - lastCpuTime) / 1000;

  lastCpuUsage = process.cpuUsage();
  lastCpuTime = currentTime;

  const userMicros = currentUsage.user;
  const systemMicros = currentUsage.system;
  const totalMicros = userMicros + systemMicros;
  const percent = elapsedMicros > 0 ? (totalMicros / elapsedMicros) * 100 : 0.0;

  return {
    percent: Math.min(100.0, Math.max(0.0, Number(percent.toFixed(2)))),
    userMicros,
    systemMicros,
  };
}

function getActiveHandlesCount(): number {
  const proc = process as unknown as { _getActiveHandles?: () => unknown[] };
  if (typeof proc._getActiveHandles === 'function') {
    try {
      const handles = proc._getActiveHandles();
      return Array.isArray(handles) ? handles.length : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

const getDiagnosticsPayload = () => {
  const globalWithGC = global as unknown as GlobalWithGC;
  if (typeof globalWithGC.gc === 'function') {
    try {
      globalWithGC.gc();
    } catch {
      // ignore
    }
  }
  const mem = process.memoryUsage();
  return {
    status: 'ok',
    uptime: process.uptime(),
    memory: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
    },
    eventLoop: getEventLoopMetrics(),
    cpu: getCpuMetrics(),
    handles: {
      active: getActiveHandlesCount(),
    },
    timestamp: new Date().toISOString(),
  };
};

router.get('/health', (req: Request, res: Response) => {
  res.json(getDiagnosticsPayload());
});

router.get('/metrics', (req: Request, res: Response) => {
  res.json(getDiagnosticsPayload());
});

router.get('/profile', authenticateToken, asyncHandler(profileController.getProfile));
router.post('/profile/upload', authenticateToken, profileController.handleAvatarUpload, asyncHandler(profileController.uploadAvatar));

// --- Testing / Chaos API Routes ---
router.get('/test/config', asyncHandler(testController.getConfig));
router.post('/test/config', asyncHandler(testController.updateConfig));
router.post('/test/reset', asyncHandler(testController.resetData));
router.post('/test/books/:id/stock', asyncHandler(testController.setBookStock));
router.delete('/test/session/:id', asyncHandler(testController.deleteSession));

export default router;

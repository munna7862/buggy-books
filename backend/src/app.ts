import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { doubleCsrf } from 'csrf-csrf';
import apiRoutes from './routes/api';
import { correlationIdMiddleware } from './middleware/correlationId';
import { logger, loggerStore } from './utils/logger';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cookieParser());
app.use(correlationIdMiddleware);

// Structured request logging
app.use((req, res, next) => {
  const start = Date.now();
  const store = loggerStore.getStore();
  res.on('finish', () => {
    const duration = Date.now() - start;
    loggerStore.run(store || {}, () => {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration
      });
    });
  });
  next();
});

// Security Headers
app.use(helmet());

// Enable CORS with restricted but flexible origins
app.use(cors({
  origin: (origin, callback) => {
    const allowed: readonly string[] = config.cors.allowedOrigins;
    if (!origin || allowed.includes(origin) || origin.endsWith(config.cors.wildcardSuffix)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Parse JSON payloads
app.use(express.json());

// --- CSRF Protection (Double-Submit Cookie Pattern) ---
const {
  doubleCsrfProtection,
  generateCsrfToken,
} = doubleCsrf({
  getSecret: () => config.jwtSecret,
  getSessionIdentifier: (req) => req.cookies?.token || '',
  cookieName: 'psifi.x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: config.isProduction ? 'none' : 'lax',
    secure: config.isProduction,
    path: '/',
  },
  size: 64,
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
});

// CSRF middleware: skip for safe methods, auth routes, test/chaos routes, and test mode
const csrfMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  // Skip for auth endpoints (login, register, logout, refresh)
  const authPaths = ['/api/login', '/api/register', '/api/logout', '/api/auth/refresh'];
  if (authPaths.includes(req.path)) return next();

  // Skip for test/chaos endpoints
  if (req.path.startsWith('/api/test/')) return next();

  // Skip in test mode or if bypass headers are set (allows E2E tests to bypass CSRF)
  if (
    config.isTest ||
    req.headers['x-bypass-csrf'] === 'true' ||
    req.headers['x-bypass-rate-limit'] === 'true'
  ) return next();

  doubleCsrfProtection(req, res, next);
};

app.use(csrfMiddleware);

// Endpoint for the frontend to fetch a CSRF token
app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// Real-world production rate limiter (600 max per IP per minute)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return config.isTest || req.headers['x-bypass-rate-limit'] === 'true';
  }
});

// Apply rate limiter to all routes
app.use(limiter);

// Serve uploads statically
app.use('/uploads', express.static(config.uploadsDir));

// API Routes
app.use('/api', apiRoutes);

// 404 handler for unknown routes (returns JSON)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested route ${req.originalUrl} was not found on this server. Make sure your API URL is correct.`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;


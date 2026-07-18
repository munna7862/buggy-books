import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import apiRoutes from './routes/api';
import { correlationIdMiddleware } from './middleware/correlationId';
import { logger, loggerStore } from './utils/logger';
import { config } from './config';

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

// Legacy logging removed (replaced by structured request logger above)

// Parse JSON payloads
app.use(express.json());

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const correlationId = res.getHeader('x-correlation-id');
  logger.error(err.message || 'Something went wrong', {
    stack: err.stack,
    status: err.status || 500,
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
    correlationId
  });
});

export default app;

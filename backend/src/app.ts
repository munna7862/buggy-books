import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api';

const app = express();

app.use(cookieParser());

// Security Headers
app.use(helmet());

// Enable CORS with restricted but flexible origins
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://buggy-books-fe.onrender.com' // Your specific Render URL
    ];
    
    // Allow requests with no origin (like mobile apps or curl) 
    // or origins that match our list or are render subdomains
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Add request logging (only if not in test env)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Parse JSON payloads
app.use(express.json());

// Basic rate limiter (60 max per IP per minute)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all routes
app.use(limiter);

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
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

export default app;

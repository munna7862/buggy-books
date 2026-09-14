import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`FATAL: Environment variable ${key} is not set. Add it to your .env file.`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: requireEnv('JWT_SECRET'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  cors: {
    // Configurable list of allowed origins, with sensible defaults and environment override
    allowedOrigins: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://buggy-books-fe.onrender.com',
      ...(process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
        : [])
    ]
  },
  
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 600, // production rate limit standard
  },
  
  uploadsDir: path.resolve(__dirname, '../uploads'),
} as const;

// Backward-compatible named exports
export const JWT_SECRET = config.jwtSecret;

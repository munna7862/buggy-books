import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS
app.use(cors());

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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

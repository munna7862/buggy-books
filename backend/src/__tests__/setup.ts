// This file runs before all Jest test suites.
// It ensures the JWT_SECRET env var is present so config.ts doesn't throw.
import dotenv from 'dotenv';
dotenv.config();

// Fallback for CI environments where a .env file may not exist
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-only-jwt-secret';
}

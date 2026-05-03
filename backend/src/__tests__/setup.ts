// This file runs before all Jest test suites.
// It ensures the JWT_SECRET env var is present so config.ts doesn't throw.
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';

// Fallback for CI environments where a .env file may not exist
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-only-jwt-secret';
}

const testDbPath = path.join(__dirname, '../../db.test.json');
try {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
} catch (e) {
  // ignore
}

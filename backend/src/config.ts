import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Add it to your .env file.');
}

export const JWT_SECRET: string = secret;

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { config, JWT_SECRET } from '../config';
import { chaosStore } from '../data/chaosStore';
import { logger } from '../utils/logger';
import { storage } from '../data/storage';
import { UnauthorizedError, NotFoundError, BadRequestError, InternalServerError } from '../errors/app-error';

// Ensure uploads folder exists inside workspace root (outside src/ to avoid build triggers)
const UPLOADS_DIR = config.uploadsDir;
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine
const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    let username = 'anonymous';
    try {
      const token = req.cookies?.token;
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.username) {
          username = decoded.username;
        }
      }
    } catch (err) {
      // fallback
    }
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${username}-${Date.now()}${ext}`);
  }
});

// Configure multer limits and format filters
const uploadConfig = multer({
  storage: storageEngine,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, and PNG images are allowed!'));
  }
}).single('avatar');

// Wrapper middleware to intercept and format Multer errors
export const handleAvatarUpload = (req: Request, res: Response, next: any) => {
  uploadConfig(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new BadRequestError('Bad Request: File size exceeds the 2MB limit'));
      }
      return next(new BadRequestError(`Bad Request: ${err.message}`));
    }
    next();
  });
};

export const getProfile = (req: Request, res: Response) => {
  const username = req.user?.username;

  if (!username) {
    throw new UnauthorizedError('Unauthorized: Session required');
  }

  const defaultUsers: Record<string, any> = {
    admin: { fullName: 'Admin User' },
    testuser: { fullName: 'Test User' }
  };
  const users = storage.get('users') || defaultUsers;
  const user = users[username];

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    username,
    fullName: user.fullName || (username === 'admin' ? 'Admin User' : username === 'testuser' ? 'Test User' : 'Anonymous User'),
    avatarUrl: user.avatarUrl || null
  });
};

export const uploadAvatar = (req: Request, res: Response) => {
  const username = req.user?.username;

  if (!username) {
    logger.warn('Avatar upload failed: Unauthenticated user');
    throw new UnauthorizedError('Unauthorized: Session required');
  }

  // Chaos failure injection
  const failureRate = chaosStore.getConfig().uploadFailureRate;
  if (failureRate > 0 && Math.random() < failureRate) {
    logger.warn(`Chaos: Simulating profile upload failure for user ${username} (rate: ${failureRate})`);
    throw new InternalServerError('Internal Server Error: Upload service failed');
  }

  if (!req.file) {
    logger.warn(`Avatar upload failed: Missing file in payload for user ${username}`);
    throw new BadRequestError('Bad Request: No file uploaded');
  }

  const defaultUsers: Record<string, any> = {
    admin: { fullName: 'Admin User' },
    testuser: { fullName: 'Test User' }
  };
  const users = storage.get('users') || defaultUsers;
  if (!users[username]) {
    throw new NotFoundError('User not found');
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  users[username].avatarUrl = fileUrl;
  storage.set('users', users);

  logger.info(`Avatar uploaded successfully for user: ${username} -> ${fileUrl}`, { username, fileUrl });
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    avatarUrl: fileUrl
  });
};

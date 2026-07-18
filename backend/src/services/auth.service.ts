import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config, JWT_SECRET } from '../config';
import { chaosStore } from '../data/chaosStore';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/user.repository';
import { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } from '../errors/app-error';

const SALT_ROUNDS = 10;

class AuthService {
  public async login(username?: string, password?: string) {
    if (!username || !password) {
      logger.warn('Login attempt failed: Missing username or password');
      throw new BadRequestError('Bad Request: Username and password required');
    }

    const user = userRepository.findByUsername(username);
    if (!user) {
      logger.warn(`Login attempt failed: Invalid credentials for user ${username}`, { attemptedUsername: username });
      throw new UnauthorizedError('Unauthorized: Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      logger.warn(`Login attempt failed: Invalid credentials for user ${username}`, { attemptedUsername: username });
      throw new UnauthorizedError('Unauthorized: Invalid credentials');
    }

    const expiry = chaosStore.getConfig().jwtExpirySeconds;
    const token = jwt.sign({ username, type: 'access' }, JWT_SECRET, { expiresIn: expiry });
    const refreshToken = jwt.sign({ username, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });

    logger.info(`User login successful: ${username}`, { username });
    return { token, refreshToken, username };
  }

  public async register(username?: string, password?: string, fullName?: string) {
    if (!username || !password) {
      logger.warn('Registration attempt failed: Missing username or password');
      throw new BadRequestError('Bad Request: Username and password required');
    }

    const existingUser = userRepository.findByUsername(username);
    if (existingUser) {
      logger.warn(`Registration attempt failed: Username ${username} already exists`, { attemptedUsername: username });
      throw new ConflictError('Conflict: Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    userRepository.save(username, { passwordHash, fullName });

    const expiry = chaosStore.getConfig().jwtExpirySeconds;
    const token = jwt.sign({ username, type: 'access' }, JWT_SECRET, { expiresIn: expiry });
    const refreshToken = jwt.sign({ username, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });

    logger.info(`User registration successful: ${username}`, { username });
    return { token, refreshToken, username };
  }

  public refresh(refreshToken?: string) {
    if (!refreshToken) {
      logger.warn('Refresh failed: Missing refresh token cookie');
      throw new UnauthorizedError('Unauthorized: Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
      if (decoded?.type !== 'refresh') {
        throw new ForbiddenError('Forbidden: Invalid refresh token');
      }

      const username = decoded.username;
      const expiry = chaosStore.getConfig().jwtExpirySeconds;
      const newToken = jwt.sign({ username, type: 'access' }, JWT_SECRET, { expiresIn: expiry });

      logger.info(`Token silently refreshed for user: ${username}`, { username });
      return { token: newToken, username };
    } catch (err) {
      logger.warn('Refresh failed: Invalid or expired refresh token');
      throw new ForbiddenError('Forbidden: Invalid refresh token');
    }
  }

  public resetUsers() {
    userRepository.reset();
  }
}

export const authService = new AuthService();

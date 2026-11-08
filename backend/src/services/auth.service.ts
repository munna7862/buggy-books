import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_SECRET } from '../config';
import { chaosStore } from '../data/chaosStore';
import { refreshTokenStore } from '../data/refreshTokenStore';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/user.repository';
import { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } from '../errors/app-error';

const SALT_ROUNDS = 10;

/**
 * A replay this soon after rotation is treated as a client race (for example two
 * browser tabs refreshing at once), not theft, so it does not revoke the family.
 */
export const REFRESH_REUSE_GRACE_MS = 10_000;

interface RefreshClaims {
  username?: string;
  type?: string;
  family?: string;
  jti?: string;
  exp?: number;
}

class AuthService {
  private issueTokens(username: string, family: string = randomUUID()) {
    const expiry = chaosStore.getConfig().jwtExpirySeconds;
    const token = jwt.sign({ username, type: 'access' }, JWT_SECRET, { expiresIn: expiry });
    const refreshToken = jwt.sign({ username, type: 'refresh', family }, JWT_SECRET, {
      expiresIn: '30d',
      jwtid: randomUUID(),
    });
    return { token, refreshToken, username };
  }

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

    logger.info(`User login successful: ${username}`, { username });
    return this.issueTokens(username);
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

    logger.info(`User registration successful: ${username}`, { username });
    return this.issueTokens(username);
  }

  public refresh(refreshToken?: string) {
    if (!refreshToken) {
      logger.warn('Refresh failed: Missing refresh token');
      throw new UnauthorizedError('Unauthorized: Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as RefreshClaims;
      if (decoded?.type !== 'refresh' || !decoded?.username) {
        throw new ForbiddenError('Forbidden: Invalid refresh token');
      }

      const username = decoded.username;
      const { family, jti, exp } = decoded;

      // Tokens issued before reuse detection have no family or jti; they rotate into a new family.
      if (family && jti) {
        if (refreshTokenStore.isFamilyRevoked(family)) {
          throw new ForbiddenError('Forbidden: Invalid refresh token');
        }
        const consumedAt = refreshTokenStore.getConsumedAt(jti);
        if (consumedAt !== undefined && Date.now() - consumedAt > REFRESH_REUSE_GRACE_MS) {
          refreshTokenStore.revokeFamily(family);
          logger.warn(`Refresh token reuse detected for user: ${username}`, { username });
          throw new ForbiddenError('Forbidden: Invalid refresh token');
        }
        if (consumedAt === undefined) {
          refreshTokenStore.consume(jti, (exp ?? 0) * 1000);
        }
      }

      logger.info(`Token silently refreshed for user: ${username}`, { username });
      return this.issueTokens(username, family);
    } catch {
      logger.warn('Refresh failed: Invalid or expired refresh token');
      throw new ForbiddenError('Forbidden: Invalid refresh token');
    }
  }

  /** Ends the session the refresh token belongs to. Invalid tokens are ignored. */
  public logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const { family } = jwt.verify(refreshToken, JWT_SECRET) as RefreshClaims;
      if (family) refreshTokenStore.revokeFamily(family);
    } catch {
      logger.warn('Logout received an invalid refresh token');
    }
  }

  public resetUsers() {
    userRepository.reset();
    refreshTokenStore.reset();
  }
}

export const authService = new AuthService();

import { userRepository } from '../repositories/user.repository';
import { chaosStore } from '../data/chaosStore';
import { logger } from '../utils/logger';
import { UnauthorizedError, NotFoundError, BadRequestError, InternalServerError } from '../errors/app-error';

class ProfileService {
  public getProfile(username?: string) {
    if (!username) {
      throw new UnauthorizedError('Unauthorized: Session required');
    }

    const user = userRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      username,
      fullName: user.fullName || (username === 'admin' ? 'Admin User' : username === 'testuser' ? 'Test User' : 'Anonymous User'),
      avatarUrl: user.avatarUrl || null
    };
  }

  public uploadAvatar(username?: string, filename?: string) {
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

    if (!filename) {
      logger.warn(`Avatar upload failed: Missing file in payload for user ${username}`);
      throw new BadRequestError('Bad Request: No file uploaded');
    }

    const user = userRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const fileUrl = `/uploads/${filename}`;
    user.avatarUrl = fileUrl;
    userRepository.save(username, user);

    logger.info(`Avatar uploaded successfully for user: ${username} -> ${fileUrl}`, { username, fileUrl });
    return { avatarUrl: fileUrl };
  }
}

export const profileService = new ProfileService();

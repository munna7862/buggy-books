import { storage } from '../data/storage';
import type { UserRecord } from '@buggybooks/types';
import bcrypt from 'bcrypt';
import { BadRequestError } from '../errors/app-error';

const SALT_ROUNDS = 10;

const defaultUsers: Record<string, UserRecord> = {
  admin: { passwordHash: bcrypt.hashSync('password123', SALT_ROUNDS) },
  testuser: { passwordHash: bcrypt.hashSync('buggybooks', SALT_ROUNDS) },
};

// Dangerous property names that could lead to prototype pollution
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

class UserRepository {
  private getUsersMap(): Record<string, UserRecord> {
    return storage.get('users') || defaultUsers;
  }

  private saveUsersMap(users: Record<string, UserRecord>) {
    storage.set('users', users);
  }

  /**
   * Guard against prototype-pollution attacks.
   * Rejects keys like '__proto__', 'constructor', 'prototype' that could
   * modify Object.prototype when used in bracket-access lookups.
   */
  private isSafeKey(key: string): boolean {
    return !UNSAFE_KEYS.has(key);
  }

  public findByUsername(username: string): UserRecord | undefined {
    if (!this.isSafeKey(username)) return undefined;
    const users = this.getUsersMap();
    if (!Object.prototype.hasOwnProperty.call(users, username)) return undefined;
    return users[username];
  }

  public save(username: string, record: UserRecord): void {
    if (!this.isSafeKey(username)) {
      throw new BadRequestError('Bad Request: Invalid username');
    }
    const users = this.getUsersMap();
    users[username] = record;
    this.saveUsersMap(users);
  }

  public reset(): void {
    const users = this.getUsersMap();
    for (const username in users) {
      if (!defaultUsers[username]) {
        delete users[username];
      } else {
        users[username] = { ...defaultUsers[username] };
      }
    }
    this.saveUsersMap(users);
  }
}

export const userRepository = new UserRepository();
export type { UserRecord };
export { defaultUsers };


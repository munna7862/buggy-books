import { storage } from '../data/storage';
import type { UserRecord } from '@buggybooks/types';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const defaultUsers: Record<string, UserRecord> = {
  admin: { passwordHash: bcrypt.hashSync('password123', SALT_ROUNDS) },
  testuser: { passwordHash: bcrypt.hashSync('buggybooks', SALT_ROUNDS) },
};

class UserRepository {
  private getUsersMap(): Record<string, UserRecord> {
    return storage.get('users') || defaultUsers;
  }

  private saveUsersMap(users: Record<string, UserRecord>) {
    storage.set('users', users);
  }

  public findByUsername(username: string): UserRecord | undefined {
    const users = this.getUsersMap();
    return users[username];
  }

  public save(username: string, record: UserRecord): void {
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

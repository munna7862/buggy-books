import fs from 'fs';
import path from 'path';
import { AsyncLocalStorage } from 'async_hooks';
import { config } from '../config';
import type { ChaosConfig, UserRecord } from '@buggybooks/types';
import type { AppData } from './dataStore';

const filename = config.isTest
  ? (process.env.JEST_WORKER_ID ? `db.test.${process.env.JEST_WORKER_ID}.json` : 'db.test.json')
  : 'db.json';

export const DB_PATH = path.join(__dirname, '../../', filename);

export interface DbSchema {
  users: Record<string, UserRecord> | null;
  dataStore: AppData | null;
  chaosStore: ChaosConfig | null;
}

export interface SessionRecord {
  schema: DbSchema;
  createdAt: number;
  lastAccessedAt: number;
}

export const sessionStorageContext = new AsyncLocalStorage<{ sessionId?: string }>();

export class SessionStorageManager {
  private sessions = new Map<string, SessionRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultTtlMs: number;
  private readonly maxSessions: number;

  constructor(ttlMs: number = 30 * 60 * 1000, maxSessions: number = 1000) {
    this.defaultTtlMs = ttlMs;
    this.maxSessions = maxSessions;
    this.startCleanupInterval();
  }

  public getSession(sessionId: string, seedSupplier?: () => DbSchema): DbSchema {
    let session = this.sessions.get(sessionId);
    if (!session) {
      if (this.sessions.size >= this.maxSessions) {
        this.evictLeastRecentlyUsedSession();
      }
      const initialSchema: DbSchema = seedSupplier
        ? seedSupplier()
        : {
            users: null,
            dataStore: null,
            chaosStore: null,
          };
      session = {
        schema: initialSchema,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastAccessedAt = Date.now();
      // Re-insert into Map to maintain strict LRU order
      this.sessions.delete(sessionId);
      this.sessions.set(sessionId, session);
    }
    return session.schema;
  }

  public evictLeastRecentlyUsedSession(): string | null {
    const oldestKey = this.sessions.keys().next().value;
    if (oldestKey !== undefined) {
      this.sessions.delete(oldestKey);
      return oldestKey;
    }
    return null;
  }

  public getMaxSessions(): number {
    return this.maxSessions;
  }

  public hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  public clearAllSessions(): void {
    this.sessions.clear();
  }

  public getActiveSessionCount(): number {
    return this.sessions.size;
  }

  public cleanupExpiredSessions(ttlMs?: number): number {
    const threshold = Date.now() - (ttlMs ?? this.defaultTtlMs);
    let purged = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (session.lastAccessedAt < threshold) {
        this.sessions.delete(id);
        purged++;
      }
    }
    return purged;
  }

  public startCleanupInterval(intervalMs: number = 60 * 1000): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, intervalMs);
    if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const sessionStorageManager = new SessionStorageManager();

class Storage {
  private data: DbSchema = {
    users: null,
    dataStore: null,
    chaosStore: null,
  };

  private isWriting = false;
  private needsSubsequentWrite = false;
  private writeResolvers: Array<() => void> = [];
  private writeRejecters: Array<(err: unknown) => void> = [];

  constructor() {
    if (config.isTest && process.env.JEST_WORKER_ID) {
      // Seed the worker-specific test database from db.test.json if it doesn't exist yet
      if (!fs.existsSync(DB_PATH)) {
        const seedPath = path.join(__dirname, '../../db.test.json');
        if (fs.existsSync(seedPath)) {
          try {
            fs.copyFileSync(seedPath, DB_PATH);
          } catch (err) {
            console.error(`Failed to seed ${filename} from db.test.json`, err);
          }
        }
      }
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error(`Failed to parse ${filename}`, err);
      }
    }
  }

  private getActiveSessionId(explicitSessionId?: string): string | undefined {
    return explicitSessionId ?? sessionStorageContext.getStore()?.sessionId;
  }

  public createSeedClone(): DbSchema {
    return {
      users: this.data.users ? JSON.parse(JSON.stringify(this.data.users)) : null,
      dataStore: this.data.dataStore ? JSON.parse(JSON.stringify(this.data.dataStore)) : null,
      chaosStore: this.data.chaosStore ? JSON.parse(JSON.stringify(this.data.chaosStore)) : null,
    };
  }

  public get<K extends keyof DbSchema>(key: K, explicitSessionId?: string): DbSchema[K] {
    const sessionId = this.getActiveSessionId(explicitSessionId);
    if (sessionId) {
      const sessionSchema = sessionStorageManager.getSession(sessionId, () => this.createSeedClone());
      return sessionSchema[key];
    }
    return this.data[key];
  }

  public set<K extends keyof DbSchema>(key: K, value: DbSchema[K], explicitSessionId?: string): void {
    const sessionId = this.getActiveSessionId(explicitSessionId);
    if (sessionId) {
      const sessionSchema = sessionStorageManager.getSession(sessionId, () => this.createSeedClone());
      sessionSchema[key] = value;
      return;
    }
    this.data[key] = value;
    this.enqueueSave();
  }

  public hasSession(sessionId: string): boolean {
    return sessionStorageManager.hasSession(sessionId);
  }

  public deleteSession(sessionId: string): boolean {
    return sessionStorageManager.deleteSession(sessionId);
  }

  public clearAllSessions(): void {
    sessionStorageManager.clearAllSessions();
  }

  public getActiveSessionCount(): number {
    return sessionStorageManager.getActiveSessionCount();
  }

  public cleanupExpiredSessions(ttlMs?: number): number {
    return sessionStorageManager.cleanupExpiredSessions(ttlMs);
  }

  public async flush(): Promise<void> {
    if (!this.isWriting && !this.needsSubsequentWrite) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      this.writeResolvers.push(resolve);
      this.writeRejecters.push(reject);
    });
  }

  private enqueueSave(): void {
    if (this.isWriting) {
      this.needsSubsequentWrite = true;
      return;
    }
    this.processWriteQueue();
  }

  private async processWriteQueue(): Promise<void> {
    this.isWriting = true;
    try {
      while (true) {
        this.needsSubsequentWrite = false;
        await this.performWriteWithRetry();
        if (!this.needsSubsequentWrite) {
          break;
        }
      }
    } finally {
      this.isWriting = false;
      const resolvers = this.writeResolvers;
      this.writeResolvers = [];
      this.writeRejecters = [];
      for (const resolve of resolvers) {
        resolve();
      }
      if (this.needsSubsequentWrite) {
        this.processWriteQueue();
      }
    }
  }

  private async performWriteWithRetry(): Promise<void> {
    const tempFile = `${DB_PATH}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    const content = JSON.stringify(this.data, null, 2);

    try {
      await fs.promises.writeFile(tempFile, content, 'utf-8');

      let attempts = 0;
      const maxAttempts = 4; // 1 initial attempt + 3 retries with jitter
      let lastError: unknown = null;

      while (attempts < maxAttempts) {
        try {
          await fs.promises.rename(tempFile, DB_PATH);
          return; // Atomic rename successful!
        } catch (renameErr: unknown) {
          attempts++;
          lastError = renameErr;
          const code = typeof renameErr === 'object' && renameErr !== null && 'code' in renameErr
            ? (renameErr as { code: string }).code
            : undefined;

          const isLockError = code === 'EPERM' || code === 'EBUSY' || code === 'EEXIST' || code === 'EACCES';
          if (isLockError) {
            // Windows file locking fallback: copyFile + unlink
            try {
              await fs.promises.copyFile(tempFile, DB_PATH);
              return; // Fallback copy succeeded!
            } catch (copyErr: unknown) {
              lastError = copyErr;
            }
          }

          if (attempts < maxAttempts) {
            const jitter = Math.floor(Math.random() * 25);
            const delay = Math.pow(2, attempts) * 15 + jitter;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Suppress filesystem errors during Jest worker process exit/teardown
      const errorCode = typeof lastError === 'object' && lastError !== null && 'code' in lastError
        ? (lastError as { code: string }).code
        : undefined;
      const isTeardownError = errorCode === 'ENOENT' || errorCode === 'EPERM' || errorCode === 'EBUSY';
      if (!(config.isTest && isTeardownError)) {
        console.error(`Failed to write ${filename} asynchronously after ${maxAttempts} attempts`, lastError);
      }
    } finally {
      // Ensure tempFile is unlinked if it still exists
      try {
        if (fs.existsSync(tempFile)) {
          await fs.promises.unlink(tempFile);
        }
      } catch {
        // Silently ignore temp file cleanup errors during teardown
      }
    }
  }
}

export const storage = new Storage();

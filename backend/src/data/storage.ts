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

  constructor(ttlMs: number = 30 * 60 * 1000) {
    this.defaultTtlMs = ttlMs;
    this.startCleanupInterval();
  }

  public getSession(sessionId: string, seedSupplier?: () => DbSchema): DbSchema {
    let session = this.sessions.get(sessionId);
    if (!session) {
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
    }
    return session.schema;
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
    if (this.cleanupInterval.unref) {
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
  private pendingWrite: (() => void) | null = null;

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
    while (this.isWriting || this.pendingWrite) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private enqueueSave() {
    if (this.isWriting) {
      if (!this.pendingWrite) {
        this.pendingWrite = () => {
          this.performWrite();
        };
      }
      return;
    }

    this.performWrite();
  }

  private async performWrite() {
    this.isWriting = true;
    try {
      const content = JSON.stringify(this.data, null, 2);
      const TEMP_DB_PATH = `${DB_PATH}.tmp`;
      await fs.promises.writeFile(TEMP_DB_PATH, content, 'utf-8');
      await fs.promises.rename(TEMP_DB_PATH, DB_PATH);
    } catch (err: unknown) {
      // Suppress filesystem errors during Jest worker process exit/teardown
      const errorCode = typeof err === 'object' && err !== null && 'code' in err ? (err as { code: string }).code : undefined;
      const isTeardownError = errorCode === 'ENOENT' || errorCode === 'EPERM' || errorCode === 'EBUSY';
      if (!(config.isTest && isTeardownError)) {
        console.error(`Failed to write ${filename} asynchronously`, err);
      }
    } finally {
      this.isWriting = false;
      if (this.pendingWrite) {
        const nextWrite = this.pendingWrite;
        this.pendingWrite = null;
        nextWrite();
      }
    }
  }
}

export const storage = new Storage();

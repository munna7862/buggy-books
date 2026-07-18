import fs from 'fs';
import path from 'path';
import { config } from '../config';

const filename = config.isTest
  ? (process.env.JEST_WORKER_ID ? `db.test.${process.env.JEST_WORKER_ID}.json` : 'db.test.json')
  : 'db.json';

export const DB_PATH = path.join(__dirname, '../../', filename);

export interface DbSchema {
  users: Record<string, any> | null;
  dataStore: any | null;
  chaosStore: any | null;
}

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

  public get<K extends keyof DbSchema>(key: K): DbSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DbSchema>(key: K, value: DbSchema[K]): void {
    this.data[key] = value;
    this.enqueueSave();
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
    } catch (err: any) {
      // Suppress filesystem errors during Jest worker process exit/teardown
      const isTeardownError = err.code === 'ENOENT' || err.code === 'EPERM' || err.code === 'EBUSY';
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

import fs from 'fs';
import path from 'path';

const filename = process.env.NODE_ENV === 'test' ? 'db.test.json' : 'db.json';
const DB_PATH = path.join(__dirname, '../../', filename);

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

  constructor() {
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error('Failed to parse db.json', err);
      }
    }
  }

  public get<K extends keyof DbSchema>(key: K): DbSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DbSchema>(key: K, value: DbSchema[K]): void {
    this.data[key] = value;
    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json', err);
    }
  }
}

export const storage = new Storage();

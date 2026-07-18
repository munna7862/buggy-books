import { storage, DB_PATH } from '../data/storage';
import fs from 'fs';

describe('Storage Persistence Unit Tests', () => {
  beforeEach(() => {
    // Reset storage data cache before each test
    storage.set('users', null);
    storage.set('dataStore', null);
    storage.set('chaosStore', null);
  });

  afterAll(async () => {
    // Wait for any pending write operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    // Clean up worker-specific test database file if it is a worker database
    if (DB_PATH.includes('db.test.') && !DB_PATH.endsWith('db.test.json') && fs.existsSync(DB_PATH)) {
      try {
        fs.unlinkSync(DB_PATH);
        if (fs.existsSync(`${DB_PATH}.tmp`)) {
          fs.unlinkSync(`${DB_PATH}.tmp`);
        }
      } catch (err) {
        console.error('Failed to clean up temp test DB file', err);
      }
    }
  });

  it('should successfully get and set values', async () => {
    const testData = { foo: 'bar' };
    storage.set('chaosStore', testData);
    
    // In-memory retrieval is instantaneous and synchronous
    expect(storage.get('chaosStore')).toEqual(testData);

    // Wait a brief period for the async file write to finish
    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify it was actually written to the file system
    const fileContent = await fs.promises.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed.chaosStore).toEqual(testData);
  });

  it('should handle rapid concurrent sets and serialize the latest state correctly', async () => {
    const iterations = 50;
    
    // Perform multiple set operations concurrently
    for (let i = 0; i < iterations; i++) {
      storage.set('chaosStore', { val: i });
    }

    // Immediately, the in-memory value should reflect the final one
    expect(storage.get('chaosStore')).toEqual({ val: iterations - 1 });

    // Wait for the queue to finish writing (50 iterations might take a tiny bit of time)
    await new Promise(resolve => setTimeout(resolve, 400));

    // Read file directly to verify it has the final state and did not corrupt/error
    const fileContent = await fs.promises.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed.chaosStore).toEqual({ val: iterations - 1 });
  });

  it('should not block the event loop or throw during parallel writes', async () => {
    const beforeTime = Date.now();

    for (let i = 0; i < 100; i++) {
      storage.set('users', { userIndex: i });
    }

    const duration = Date.now() - beforeTime;
    // Calling set 100 times synchronously is immediate in JS, should be < 50ms
    expect(duration).toBeLessThan(100);

    // Allow the asynchronous writes to execute
    await new Promise(resolve => setTimeout(resolve, 400));

    // Ensure the final state is preserved
    expect(storage.get('users')).toEqual({ userIndex: 99 });
    
    const fileContent = await fs.promises.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed.users).toEqual({ userIndex: 99 });
  });
});

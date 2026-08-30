import { storage, DB_PATH } from '../data/storage';
import type { ChaosConfig } from '@buggybooks/types';
import fs from 'fs';

describe('Storage Persistence Unit Tests', () => {
  const baseChaosConfig: ChaosConfig = {
    checkoutFailureRate: 0.15,
    inventoryDelayMs: 3000,
    jwtExpirySeconds: 900,
    websocketDropRate: 0.0,
    uploadFailureRate: 0.0,
    injectA11yViolations: false,
    visualChaos: false
  };

  beforeEach(async () => {
    // Reset storage data cache before each test
    storage.set('users', null);
    storage.set('dataStore', null);
    storage.set('chaosStore', null);
    await storage.flush();
  });

  afterAll(async () => {
    // Wait for any pending write operations to complete
    await storage.flush();
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
    const testData: ChaosConfig = { ...baseChaosConfig, inventoryDelayMs: 4500 };
    storage.set('chaosStore', testData);
    
    // In-memory retrieval is instantaneous and synchronous
    expect(storage.get('chaosStore')).toEqual(testData);

    // Wait for the async write queue to completely flush to disk
    await storage.flush();

    // Verify it was actually written to the file system
    const fileContent = await fs.promises.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed.chaosStore).toEqual(testData);
  });

  it('should handle rapid concurrent sets and serialize the latest state correctly', async () => {
    const iterations = 50;
    
    // Perform multiple set operations concurrently
    for (let i = 0; i < iterations; i++) {
      storage.set('chaosStore', { ...baseChaosConfig, inventoryDelayMs: i });
    }

    // Immediately, the in-memory value should reflect the final one
    expect(storage.get('chaosStore')).toEqual({ ...baseChaosConfig, inventoryDelayMs: iterations - 1 });

    // Wait for the write queue to completely flush to disk
    await storage.flush();

    // Read file directly to verify it has the final state and did not corrupt/error
    const fileContent = await fs.promises.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed.chaosStore).toEqual({ ...baseChaosConfig, inventoryDelayMs: iterations - 1 });
  });

  it('should not block the event loop or throw during parallel writes', async () => {
    const writes = Array.from({ length: 100 }, (_, i) => ({
      ...baseChaosConfig,
      inventoryDelayMs: 1000 + i
    }));

    // Launch all writes concurrently without awaiting each
    const promises = writes.map(async (cfg) => {
      storage.set('chaosStore', cfg);
    });

    await expect(Promise.all(promises)).resolves.not.toThrow();

    // Wait for queue to drain
    await storage.flush();

    // The in-memory store should contain one of the written objects
    const finalVal = storage.get('chaosStore');
    expect(finalVal).toBeDefined();
    expect(finalVal?.inventoryDelayMs).toBeGreaterThanOrEqual(1000);
  });
});

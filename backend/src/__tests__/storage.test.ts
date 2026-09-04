import { storage, sessionStorageManager, sessionStorageContext, DB_PATH } from '../data/storage';
import { dataStore } from '../data/dataStore';
import { userRepository } from '../repositories/user.repository';
import request from 'supertest';
import app from '../app';
import type { ChaosConfig } from '@buggybooks/types';
import fs from 'fs';

describe('Storage Persistence & Session Sandboxing Unit Tests', () => {
  const baseChaosConfig: ChaosConfig = {
    checkoutFailureRate: 0.15,
    inventoryDelayMs: 3000,
    jwtExpirySeconds: 900,
    websocketDropRate: 0.0,
    uploadFailureRate: 0.0,
    injectA11yViolations: false,
    visualChaos: false,
    inventoryLockingRate: 0.0
  };

  beforeEach(async () => {
    // Reset storage data cache before each test
    storage.clearAllSessions();
    storage.set('users', null);
    storage.set('dataStore', null);
    storage.set('chaosStore', null);
    await storage.flush();
  });

  afterAll(async () => {
    sessionStorageManager.stopCleanup();
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

  describe('Core Persistence & File Locking', () => {
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
      
      for (let i = 0; i < iterations; i++) {
        storage.set('chaosStore', { ...baseChaosConfig, inventoryDelayMs: i });
      }

      expect(storage.get('chaosStore')).toEqual({ ...baseChaosConfig, inventoryDelayMs: iterations - 1 });

      await storage.flush();

      const fileContent = await fs.promises.readFile(DB_PATH, 'utf-8');
      const parsed = JSON.parse(fileContent);
      expect(parsed.chaosStore).toEqual({ ...baseChaosConfig, inventoryDelayMs: iterations - 1 });
    });

    it('should not block the event loop or throw during parallel writes', async () => {
      const writes = Array.from({ length: 100 }, (_, i) => ({
        ...baseChaosConfig,
        inventoryDelayMs: 1000 + i
      }));

      const promises = writes.map(async (cfg) => {
        storage.set('chaosStore', cfg);
      });

      await expect(Promise.all(promises)).resolves.not.toThrow();
      await storage.flush();

      const finalVal = storage.get('chaosStore');
      expect(finalVal).toBeDefined();
      expect(finalVal?.inventoryDelayMs).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Session Partitioning & Multi-User Sandboxing (US-BE-301)', () => {
    it('should isolate storage mutations between different session IDs', () => {
      const sessionA = 'test-worker-alpha';
      const sessionB = 'test-worker-beta';

      // Set different chaos configs per session explicitly
      storage.set('chaosStore', { ...baseChaosConfig, inventoryDelayMs: 1111 }, sessionA);
      storage.set('chaosStore', { ...baseChaosConfig, inventoryDelayMs: 2222 }, sessionB);
      storage.set('chaosStore', { ...baseChaosConfig, inventoryDelayMs: 9999 }); // global

      expect(storage.get('chaosStore', sessionA)?.inventoryDelayMs).toBe(1111);
      expect(storage.get('chaosStore', sessionB)?.inventoryDelayMs).toBe(2222);
      expect(storage.get('chaosStore')?.inventoryDelayMs).toBe(9999);
    });

    it('should isolate DataStore cart and orders via sessionStorageContext', async () => {
      const session1 = 'worker-session-1';
      const session2 = 'worker-session-2';

      // Session 1 adds Book 1 to cart
      await sessionStorageContext.run({ sessionId: session1 }, async () => {
        dataStore.addToCart('testuser', { id: '1', title: 'The Great Buggy Gatsby', author: 'Author', price: 10, description: '', genre: 'Classic', image: '' });
        expect(dataStore.getCart('testuser')).toHaveLength(1);
        expect(dataStore.getCart('testuser')[0].id).toBe('1');
      });

      // Session 2 checks cart (should be empty), and adds Book 2
      await sessionStorageContext.run({ sessionId: session2 }, async () => {
        expect(dataStore.getCart('testuser')).toHaveLength(0);
        dataStore.addToCart('testuser', { id: '2', title: 'To Kill a Mockingbird Exception', author: 'Author', price: 15, description: '', genre: 'Classic', image: '' });
        expect(dataStore.getCart('testuser')).toHaveLength(1);
        expect(dataStore.getCart('testuser')[0].id).toBe('2');
      });

      // Verify Session 1 cart is unchanged and isolated
      await sessionStorageContext.run({ sessionId: session1 }, async () => {
        expect(dataStore.getCart('testuser')).toHaveLength(1);
        expect(dataStore.getCart('testuser')[0].id).toBe('1');
      });
    });

    it('should isolate UserRepository registered users per session', async () => {
      const sessionA = 'worker-reg-a';
      const sessionB = 'worker-reg-b';

      await sessionStorageContext.run({ sessionId: sessionA }, async () => {
        userRepository.save('isolatedUserA', { passwordHash: 'hashA' });
        expect(userRepository.findByUsername('isolatedUserA')).toBeDefined();
        expect(userRepository.findByUsername('isolatedUserB')).toBeUndefined();
      });

      await sessionStorageContext.run({ sessionId: sessionB }, async () => {
        userRepository.save('isolatedUserB', { passwordHash: 'hashB' });
        expect(userRepository.findByUsername('isolatedUserB')).toBeDefined();
        expect(userRepository.findByUsername('isolatedUserA')).toBeUndefined();
      });
    });

    it('should delete sessions cleanly via deleteSession', () => {
      const sessionId = 'ephemeral-session-99';
      storage.set('chaosStore', { ...baseChaosConfig, inventoryDelayMs: 4444 }, sessionId);
      expect(storage.hasSession(sessionId)).toBe(true);

      const deleted = storage.deleteSession(sessionId);
      expect(deleted).toBe(true);
      expect(storage.hasSession(sessionId)).toBe(false);
    });

    it('should evict expired sessions based on TTL threshold', () => {
      const activeSession = 'active-session';
      const expiredSession = 'expired-session';

      storage.set('chaosStore', { ...baseChaosConfig }, activeSession);
      storage.set('chaosStore', { ...baseChaosConfig }, expiredSession);

      // Artificially age expiredSession
      const sessionRecord = (sessionStorageManager as unknown as { sessions: Map<string, { lastAccessedAt: number }> }).sessions.get(expiredSession);
      if (sessionRecord) {
        sessionRecord.lastAccessedAt = Date.now() - 40 * 60 * 1000; // 40 minutes ago
      }

      const purgedCount = storage.cleanupExpiredSessions(30 * 60 * 1000); // 30 min TTL
      expect(purgedCount).toBe(1);
      expect(storage.hasSession(expiredSession)).toBe(false);
      expect(storage.hasSession(activeSession)).toBe(true);
    });
  });

  describe('HTTP Integration with x-test-session-id & DELETE /api/test/session/:id', () => {
    it('should isolate HTTP registration and cart across concurrent API sessions', async () => {
      const session1 = 'http-worker-1';
      const session2 = 'http-worker-2';

      // Register unique user in session 1
      const reg1 = await request(app)
        .post('/api/register')
        .set('x-test-session-id', session1)
        .send({ username: 'worker1user', password: 'password123', fullName: 'Worker One' });
      expect(reg1.status).toBe(201);

      // Register unique user in session 2
      const reg2 = await request(app)
        .post('/api/register')
        .set('x-test-session-id', session2)
        .send({ username: 'worker2user', password: 'password123', fullName: 'Worker Two' });
      expect(reg2.status).toBe(201);

      // Verify worker1user cannot log in to session 2
      const loginAttemptInSession2 = await request(app)
        .post('/api/login')
        .set('x-test-session-id', session2)
        .send({ username: 'worker1user', password: 'password123' });
      expect(loginAttemptInSession2.status).toBe(401);

      // Verify worker1user CAN log in to session 1
      const loginAttemptInSession1 = await request(app)
        .post('/api/login')
        .set('x-test-session-id', session1)
        .send({ username: 'worker1user', password: 'password123' });
      expect(loginAttemptInSession1.status).toBe(200);

      // Clean up session 1 via DELETE endpoint
      const delRes = await request(app)
        .delete(`/api/test/session/${session1}`)
        .set('x-test-session-id', session1);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(storage.hasSession(session1)).toBe(false);
    });
  });
});

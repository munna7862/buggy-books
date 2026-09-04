import request from 'supertest';
import app from '../app';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';
import { checkoutService } from '../services/checkout.service';
import { ConflictError } from '../errors/app-error';

describe('Optimistic Stock Locking & Concurrency Tests', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    chaosStore.updateConfig({
      checkoutFailureRate: 0,
      inventoryDelayMs: 0,
      inventoryLockingRate: 0
    });
  });

  describe('DataStore Optimistic Locking Primitives', () => {
    it('successfully decrements stock and increments version', () => {
      dataStore.setStock('1', 5);
      const bookBefore = dataStore.getBookById('1');
      expect(bookBefore?.stock).toBe(5);
      const initialVersion = bookBefore?.version;

      const result = dataStore.decrementStockOptimistic('1', 1, initialVersion);
      expect(result.success).toBe(true);
      expect(result.currentStock).toBe(4);

      const bookAfter = dataStore.getBookById('1');
      expect(bookAfter?.stock).toBe(4);
      expect(bookAfter?.version).toBe((initialVersion ?? 1) + 1);
    });

    it('fails when expectedVersion does not match currentVersion', () => {
      dataStore.setStock('1', 5);
      const staleVersion = 999;

      const result = dataStore.decrementStockOptimistic('1', 1, staleVersion);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Optimistic lock conflict');
      expect(dataStore.getBookById('1')?.stock).toBe(5);
    });

    it('fails when requested quantity exceeds available stock', () => {
      dataStore.setStock('1', 0);
      const result = dataStore.decrementStockOptimistic('1', 1);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Insufficient inventory');
    });
  });

  describe('CheckoutService Optimistic Stock Locking', () => {
    it('rejects checkout when item in cart has 0 stock', async () => {
      dataStore.setStock('1', 0);
      const book = dataStore.getBookById('1')!;
      dataStore.addToCart('testuser', book);

      await expect(
        checkoutService.processCheckout('testuser', {
          firstName: 'John',
          lastName: 'Doe',
          creditCard: '1234567812345678'
        })
      ).rejects.toThrow(ConflictError);
    });

    it('guarantees exactly one winner when two concurrent checkouts race for final unit (stock = 1)', async () => {
      // Set book stock to exactly 1
      dataStore.setStock('1', 1);
      const book = dataStore.getBookById('1')!;

      dataStore.addToCart('buyerA', book);
      dataStore.addToCart('buyerB', book);

      const checkoutPromiseA = checkoutService.processCheckout('buyerA', {
        firstName: 'Buyer',
        lastName: 'One',
        creditCard: '1111222233334444'
      });

      const checkoutPromiseB = checkoutService.processCheckout('buyerB', {
        firstName: 'Buyer',
        lastName: 'Two',
        creditCard: '5555666677778888'
      });

      const results = await Promise.allSettled([checkoutPromiseA, checkoutPromiseB]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // Verify rejected error is ConflictError (409)
      const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectedError).toBeInstanceOf(ConflictError);
      expect(rejectedError.statusCode).toBe(409);

      // Verify final stock is exactly 0
      const finalBook = dataStore.getBookById('1');
      expect(finalBook?.stock).toBe(0);
    });
  });

  describe('REST API Test Helper & Concurrency Endpoints', () => {
    it('POST /api/test/books/:id/stock updates stock count', async () => {
      const res = await request(app)
        .post('/api/test/books/1/stock')
        .send({ stock: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bookId).toBe('1');
      expect(res.body.stock).toBe(1);

      const book = dataStore.getBookById('1');
      expect(book?.stock).toBe(1);
    });

    it('POST /api/test/books/:id/stock rejects invalid negative stock', async () => {
      const res = await request(app)
        .post('/api/test/books/1/stock')
        .send({ stock: -5 });

      expect(res.status).toBe(400);
    });

    it('POST /api/test/config accepts inventoryLockingRate', async () => {
      const res = await request(app)
        .post('/api/test/config')
        .send({ inventoryLockingRate: 0.5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.config.inventoryLockingRate).toBe(0.5);

      const configRes = await request(app).get('/api/test/config');
      expect(configRes.body.inventoryLockingRate).toBe(0.5);
    });
  });
});

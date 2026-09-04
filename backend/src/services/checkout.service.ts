import { z } from 'zod';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { BadRequestError, ConflictError, InternalServerError } from '../errors/app-error';
import type { Order } from '@buggybooks/types';

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  creditCard: z.string().min(16, 'Credit card must be at least 16 digits')
});

class CheckoutService {
  public async processCheckout(username: string, payload: unknown): Promise<{ orderId: string }> {
    const { firstName, lastName } = checkoutSchema.parse(payload);
    logger.info(`Starting checkout processing for user: ${username}`, { username, firstName, lastName });

    const chaos = chaosStore.getConfig();
    const failureRate = chaos.checkoutFailureRate;
    if (Math.random() < failureRate) {
      logger.error(`Checkout failed due to stochastic payment gateway timeout (rate: ${failureRate})`, { username });
      throw new InternalServerError('Internal Server Error: Payment Gateway Timeout');
    }

    const cart = dataStore.getCart(username);
    if (cart.length === 0) {
      logger.warn(`Checkout failed: Cart is empty for user ${username}`, { username });
      throw new BadRequestError('Bad Request: Cart is empty');
    }

    // Inspect inventory and capture initial versions for optimistic locking
    const itemCounts = new Map<string, number>();
    const expectedVersions = new Map<string, number | undefined>();

    for (const item of cart) {
      const currentBook = dataStore.getBookById(item.id);
      if (!currentBook) {
        throw new BadRequestError(`Bad Request: Book ${item.id} no longer exists`);
      }
      if (currentBook.stock !== undefined && currentBook.stock <= 0) {
        logger.warn(`Checkout failed: Book ${currentBook.title} is out of stock`, { username, bookId: item.id });
        throw new ConflictError(`Conflict: Item "${currentBook.title}" is out of stock`);
      }
      itemCounts.set(item.id, (itemCounts.get(item.id) || 0) + 1);
      if (!expectedVersions.has(item.id)) {
        expectedVersions.set(item.id, currentBook.version);
      }
    }

    // Check chaos injection for inventory locking
    const lockingRate = chaos.inventoryLockingRate ?? 0;
    if (lockingRate > 0 && Math.random() < lockingRate) {
      logger.warn(`Simulating optimistic lock conflict via chaos engine (rate: ${lockingRate})`, { username });
      throw new ConflictError('Conflict: Optimistic lock conflict simulated by chaos engine');
    }

    // Simulate asynchronous concurrency reservation window
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Execute atomic optimistic stock decrement for each item in cart
    for (const [bookId, qty] of itemCounts.entries()) {
      const expectedVersion = expectedVersions.get(bookId);
      const result = dataStore.decrementStockOptimistic(bookId, qty, expectedVersion);
      if (!result.success) {
        logger.warn(`Checkout failed due to stock locking conflict`, { username, bookId, reason: result.reason });
        throw new ConflictError(`Conflict: ${result.reason || 'Optimistic stock lock conflict'}`);
      }
    }

    const total = cart.reduce((acc, item) => acc + item.price, 0);
    const orderId = crypto.randomUUID();
    const order: Order = {
      id: orderId,
      items: [...cart],
      total,
      customerName: `${firstName} ${lastName}`,
      date: new Date().toISOString()
    };

    dataStore.addOrder(username, order);
    dataStore.clearCart(username);

    logger.info(`Checkout successful for user: ${username}. Order ID: ${orderId}`, { username, orderId, total });
    return { orderId };
  }

  public getOrders(username: string): Order[] {
    return dataStore.getOrders(username);
  }
}

export const checkoutService = new CheckoutService();
export type { Order };
export { checkoutSchema };

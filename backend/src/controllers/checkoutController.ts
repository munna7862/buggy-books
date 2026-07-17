import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore, Order } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  creditCard: z.string().min(16, 'Credit card must be at least 16 digits')
});

export const processCheckout = (req: Request, res: Response) => {
  const username = req.user?.username;
  try {
    const { firstName, lastName, creditCard } = checkoutSchema.parse(req.body);
    logger.info(`Starting checkout processing for user: ${username}`, { username, firstName, lastName });

    const failureRate = chaosStore.getConfig().checkoutFailureRate;
    if (Math.random() < failureRate) {
      logger.error(`Checkout failed due to stochastic payment gateway timeout (rate: ${failureRate})`, { username });
      return res.status(500).json({ error: 'Internal Server Error: Payment Gateway Timeout' });
    }
    
    const cart = dataStore.getCart(username);
    if (cart.length === 0) {
      logger.warn(`Checkout failed: Cart is empty for user ${username}`, { username });
      return res.status(400).json({ error: 'Bad Request: Cart is empty' });
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
    res.json({ success: true, message: 'Order processed successfully', orderId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(`Checkout validation failed for user ${username}`, { username, errors: error.issues });
      return res.status(400).json({ error: 'Bad Request: Validation failed', details: error.issues });
    }
    logger.error('Unhandled error during checkout processing', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getOrders = (req: Request, res: Response) => {
  const username = req.user?.username;
  const orders = dataStore.getOrders(username);
  res.json(orders);
};

import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore, Order } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';
import crypto from 'crypto';

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  creditCard: z.string().min(16, 'Credit card must be at least 16 digits')
});

export const processCheckout = (req: Request, res: Response) => {
  try {
    const { firstName, lastName, creditCard } = checkoutSchema.parse(req.body);

    const failureRate = chaosStore.getConfig().checkoutFailureRate;
    if (Math.random() < failureRate) {
      return res.status(500).json({ error: 'Internal Server Error: Payment Gateway Timeout' });
    }
    
    const cart = dataStore.getCart();
    if (cart.length === 0) {
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

    dataStore.addOrder(order);
    dataStore.clearCart();
    
    res.json({ success: true, message: 'Order processed successfully', orderId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Bad Request: Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getOrders = (req: Request, res: Response) => {
  const orders = dataStore.getOrders();
  res.json(orders);
};

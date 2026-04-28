import { Request, Response } from 'express';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';

export const processCheckout = (req: Request, res: Response) => {
  const failureRate = chaosStore.getConfig().checkoutFailureRate;
  if (Math.random() < failureRate) {
    return res.status(500).json({ error: 'Internal Server Error: Payment Gateway Timeout' });
  }
  
  dataStore.clearCart();
  res.json({ success: true, message: 'Order processed successfully' });
};

import { Request, Response } from 'express';
import { checkoutService } from '../services/checkout.service';

export const processCheckout = (req: Request, res: Response) => {
  const username = req.user?.username || 'anonymous';
  const result = checkoutService.processCheckout(username, req.body);
  res.json({ success: true, message: 'Order processed successfully', orderId: result.orderId });
};

export const getOrders = (req: Request, res: Response) => {
  const username = req.user?.username || 'anonymous';
  const orders = checkoutService.getOrders(username);
  res.json(orders);
};

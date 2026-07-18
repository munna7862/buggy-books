import { Request, Response } from 'express';
import { z } from 'zod';
import { cartService } from '../services/cart.service';

const cartSchema = z.object({
  bookId: z.string()
});

export const getCart = (req: Request, res: Response) => {
  const username = req.user?.username || 'anonymous';
  res.json(cartService.getCart(username));
};

export const addToCart = (req: Request, res: Response) => {
  const username = req.user?.username || 'anonymous';
  const { bookId } = cartSchema.parse(req.body);
  const result = cartService.addToCart(username, bookId);
  res.json(result);
};

export const clearCart = (req: Request, res: Response) => {
  const username = req.user?.username || 'anonymous';
  cartService.clearCart(username);
  res.json({ success: true });
};

export const removeFromCart = (req: Request, res: Response) => {
  const { bookId } = req.params;
  const username = req.user?.username || 'anonymous';
  const result = cartService.removeFromCart(username, bookId);
  res.json(result);
};

import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../data/dataStore';

const cartSchema = z.object({
  bookId: z.string()
});

export const getCart = (req: Request, res: Response) => {
  res.json(dataStore.getCart());
};

export const addToCart = (req: Request, res: Response) => {
  try {
    const { bookId } = cartSchema.parse(req.body);
    const book = dataStore.getBookById(bookId);
    
    if (!book) {
      return res.status(404).json({ error: 'Not Found: Book does not exist' });
    }
    
    dataStore.addToCart(book);
    res.json(dataStore.getCart());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Bad Request: Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const clearCart = (req: Request, res: Response) => {
  dataStore.clearCart();
  res.json({ success: true });
};

export const removeFromCart = (req: Request, res: Response) => {
  const { bookId } = req.params;

  if (!bookId) {
    return res.status(400).json({ error: 'Bad Request: bookId parameter is required' });
  }

  const removed = dataStore.removeFromCart(bookId);
  if (!removed) {
    return res.status(404).json({ error: 'Not Found: Book not in cart' });
  }

  res.json(dataStore.getCart());
};

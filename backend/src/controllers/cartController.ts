import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../data/dataStore';

const cartSchema = z.object({
  bookId: z.string()
});

export const getCart = (req: Request, res: Response) => {
  const username = req.user?.username;
  res.json(dataStore.getCart(username));
};

export const addToCart = (req: Request, res: Response) => {
  try {
    const { bookId } = cartSchema.parse(req.body);
    const book = dataStore.getBookById(bookId);
    
    if (!book) {
      return res.status(404).json({ error: 'Not Found: Book does not exist' });
    }
    
    const username = req.user?.username;
    dataStore.addToCart(username, book);
    res.json(dataStore.getCart(username));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Bad Request: Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const clearCart = (req: Request, res: Response) => {
  const username = req.user?.username;
  dataStore.clearCart(username);
  res.json({ success: true });
};

export const removeFromCart = (req: Request, res: Response) => {
  const { bookId } = req.params;

  if (!bookId) {
    return res.status(400).json({ error: 'Bad Request: bookId parameter is required' });
  }

  const username = req.user?.username;
  const removed = dataStore.removeFromCart(username, bookId);
  if (!removed) {
    return res.status(404).json({ error: 'Not Found: Book not in cart' });
  }

  res.json(dataStore.getCart(username));
};

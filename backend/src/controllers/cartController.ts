import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../data/dataStore';
import { logger } from '../utils/logger';

const cartSchema = z.object({
  bookId: z.string()
});

export const getCart = (req: Request, res: Response) => {
  const username = req.user?.username;
  res.json(dataStore.getCart(username));
};

export const addToCart = (req: Request, res: Response) => {
  const username = req.user?.username;
  try {
    const { bookId } = cartSchema.parse(req.body);
    const book = dataStore.getBookById(bookId);
    
    if (!book) {
      logger.warn(`Add to cart failed: Book ${bookId} not found`, { bookId, username });
      return res.status(404).json({ error: 'Not Found: Book does not exist' });
    }
    
    dataStore.addToCart(username, book);
    logger.info(`Book ${bookId} ("${book.title}") added to cart for user ${username}`, { bookId, username });
    res.json(dataStore.getCart(username));
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(`Add to cart validation failed for user ${username}`, { username, errors: error.issues });
      return res.status(400).json({ error: 'Bad Request: Validation failed', details: error.issues });
    }
    logger.error('Unhandled error during add to cart', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const clearCart = (req: Request, res: Response) => {
  const username = req.user?.username;
  dataStore.clearCart(username);
  logger.info(`Cart cleared for user ${username}`, { username });
  res.json({ success: true });
};

export const removeFromCart = (req: Request, res: Response) => {
  const { bookId } = req.params;
  const username = req.user?.username;

  if (!bookId) {
    logger.warn(`Remove from cart failed: Missing bookId for user ${username}`, { username });
    return res.status(400).json({ error: 'Bad Request: bookId parameter is required' });
  }

  const removed = dataStore.removeFromCart(username, bookId);
  if (!removed) {
    logger.warn(`Remove from cart failed: Book ${bookId} not in cart for user ${username}`, { bookId, username });
    return res.status(404).json({ error: 'Not Found: Book not in cart' });
  }

  logger.info(`Book ${bookId} removed from cart for user ${username}`, { bookId, username });
  res.json(dataStore.getCart(username));
};

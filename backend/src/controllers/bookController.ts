import { Request, Response } from 'express';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';

export const getBooks = (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 8));

  // If no query params for pagination, return raw list (backward compat)
  if (!req.query.page && !req.query.q && !req.query.limit) {
    return res.json(dataStore.getBooks());
  }

  res.json(dataStore.getBooksPaginated(q, page, limit));
};

export const getBookById = (req: Request, res: Response) => {
  const book = dataStore.getBookById(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Not Found: Book does not exist' });
  }
  res.json(book);
};

export const getInventoryReport = (req: Request, res: Response) => {
  const delay = chaosStore.getConfig().inventoryDelayMs;
  setTimeout(() => {
    const books = dataStore.getBooks();
    res.json({
      totalBooks: books.length,
      totalValue: books.reduce((acc, b) => acc + b.price, 0),
      timestamp: new Date().toISOString()
    });
  }, delay);
};


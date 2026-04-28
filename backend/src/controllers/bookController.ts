import { Request, Response } from 'express';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';

export const getBooks = (req: Request, res: Response) => {
  res.json(dataStore.getBooks());
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

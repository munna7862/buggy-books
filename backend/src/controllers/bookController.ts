import { Request, Response } from 'express';
import { bookService } from '../services/book.service';

export const getBooks = (req: Request, res: Response) => {
  const result = bookService.getBooks(
    req.query.q as string,
    req.query.page as string,
    req.query.limit as string
  );
  res.json(result);
};

export const getBookById = (req: Request, res: Response) => {
  const book = bookService.getBookById(req.params.id);
  res.json(book);
};

export const getInventoryReport = async (req: Request, res: Response) => {
  const report = await bookService.getInventoryReport();
  res.json(report);
};

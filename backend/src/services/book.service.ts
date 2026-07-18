import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';
import { NotFoundError } from '../errors/app-error';
import type { Book, PaginatedBooks } from '@buggybooks/types';

class BookService {
  public getBooks(query?: string, pageNumber?: string, limitNumber?: string): PaginatedBooks | Book[] {
    const q = query || '';
    const page = Math.max(1, parseInt(pageNumber || '') || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitNumber || '') || 8));

    // If no query params for pagination, return raw list (backward compat)
    if (!pageNumber && !query && !limitNumber) {
      return dataStore.getBooks();
    }

    return dataStore.getBooksPaginated(q, page, limit);
  }

  public getBookById(id: string): Book {
    const book = dataStore.getBookById(id);
    if (!book) {
      throw new NotFoundError('Not Found: Book does not exist');
    }
    return book;
  }

  public async getInventoryReport(): Promise<{ totalBooks: number; totalValue: number; timestamp: string }> {
    const delay = chaosStore.getConfig().inventoryDelayMs;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const books = dataStore.getBooks();
        resolve({
          totalBooks: books.length,
          totalValue: books.reduce((acc, b) => acc + b.price, 0),
          timestamp: new Date().toISOString()
        });
      }, delay);
    });
  }
}

export const bookService = new BookService();

import { dataStore } from '../data/dataStore';
import { logger } from '../utils/logger';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import type { Book } from '@buggybooks/types';

class CartService {
  public getCart(username: string): Book[] {
    return dataStore.getCart(username);
  }

  public addToCart(username: string, bookId?: string): Book[] {
    if (!bookId) {
      throw new BadRequestError('Bad Request: bookId is required');
    }

    const book = dataStore.getBookById(bookId);
    if (!book) {
      logger.warn(`Add to cart failed: Book ${bookId} not found`, { bookId, username });
      throw new NotFoundError('Not Found: Book does not exist');
    }

    dataStore.addToCart(username, book);
    logger.info(`Book ${bookId} ("${book.title}") added to cart for user ${username}`, { bookId, username });
    return dataStore.getCart(username);
  }

  public clearCart(username: string): void {
    dataStore.clearCart(username);
    logger.info(`Cart cleared for user ${username}`, { username });
  }

  public removeFromCart(username: string, bookId?: string): Book[] {
    if (!bookId) {
      logger.warn(`Remove from cart failed: Missing bookId for user ${username}`, { username });
      throw new BadRequestError('Bad Request: bookId parameter is required');
    }

    const removed = dataStore.removeFromCart(username, bookId);
    if (!removed) {
      logger.warn(`Remove from cart failed: Book ${bookId} not in cart for user ${username}`, { bookId, username });
      throw new NotFoundError('Not Found: Book not in cart');
    }

    logger.info(`Book ${bookId} removed from cart for user ${username}`, { bookId, username });
    return dataStore.getCart(username);
  }
}

export const cartService = new CartService();

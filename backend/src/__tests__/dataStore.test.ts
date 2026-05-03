import { dataStore } from '../data/dataStore';

describe('DataStore Unit Tests', () => {
  beforeEach(() => {
    dataStore.resetData();
  });

  describe('getBooksPaginated', () => {
    it('returns first page with specified limit', () => {
      const result = dataStore.getBooksPaginated('', 1, 5);
      expect(result.books).toHaveLength(5);
      expect(result.total).toBeGreaterThanOrEqual(15);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(3);
    });

    it('returns second page correctly', () => {
      const page1 = dataStore.getBooksPaginated('', 1, 5);
      const page2 = dataStore.getBooksPaginated('', 2, 5);
      
      expect(page2.books).toHaveLength(5);
      expect(page2.page).toBe(2);
      expect(page2.books[0].id).not.toBe(page1.books[0].id);
    });

    it('filters by title (case-insensitive)', () => {
      const result = dataStore.getBooksPaginated('Gatsby', 1, 10);
      expect(result.books.length).toBeGreaterThanOrEqual(1);
      expect(result.books[0].title).toContain('Gatsby');
      
      const resultLower = dataStore.getBooksPaginated('gatsby', 1, 10);
      expect(resultLower.books).toEqual(result.books);
    });

    it('filters by author', () => {
      const result = dataStore.getBooksPaginated('Orwell', 1, 10);
      expect(result.books.some(b => b.author.includes('Orwell'))).toBeTruthy();
    });

    it('filters by genre', () => {
      const result = dataStore.getBooksPaginated('Dystopian', 1, 10);
      expect(result.books.length).toBeGreaterThanOrEqual(1);
      expect(result.books.every(b => b.genre === 'Dystopian')).toBeTruthy();
    });

    it('returns empty array if no match found', () => {
      const result = dataStore.getBooksPaginated('NonExistentBook123', 1, 10);
      expect(result.books).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Cart Operations', () => {
    it('adds and removes items from cart', () => {
      const book = dataStore.getBooks()[0];
      dataStore.addToCart(book);
      expect(dataStore.getCart()).toHaveLength(1);
      
      const removed = dataStore.removeFromCart(book.id);
      expect(removed).toBeTruthy();
      expect(dataStore.getCart()).toHaveLength(0);
    });

    it('returns false when removing non-existent item', () => {
      const removed = dataStore.removeFromCart('invalid-id');
      expect(removed).toBeFalsy();
    });

    it('clears the cart', () => {
      dataStore.addToCart(dataStore.getBooks()[0]);
      dataStore.addToCart(dataStore.getBooks()[1]);
      expect(dataStore.getCart()).toHaveLength(2);
      
      dataStore.clearCart();
      expect(dataStore.getCart()).toHaveLength(0);
    });
  });

  describe('Data Integrity', () => {
    it('getBookById returns the correct book', () => {
      const book = dataStore.getBookById('1');
      expect(book).toBeDefined();
      expect(book?.id).toBe('1');
      expect(book?.title).toContain('Gatsby');
    });

    it('resetData restores default state', () => {
      dataStore.addToCart(dataStore.getBooks()[0]);
      dataStore.resetData();
      expect(dataStore.getCart()).toHaveLength(0);
      expect(dataStore.getBooks()).toHaveLength(15);
    });
  });
});

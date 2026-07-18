/**
 * Book-related type definitions shared across backend, frontend, and E2E tests.
 *
 * This is the single source of truth for all book-related data structures.
 * Any changes here will be reflected across all layers at compile time.
 */

/** Canonical Book entity as stored in the backend data store. */
export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
  genre?: string;
  description?: string;
}

/** Subset of Book used in cart displays where only essential fields are needed. */
export type CartItem = Pick<Book, 'id' | 'title' | 'price'>;

/** Paginated response wrapper returned by GET /api/books?page=&limit= */
export interface PaginatedBooks {
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/**
 * Order-related type definitions shared across backend, frontend, and E2E tests.
 */

import type { Book } from './book.types';

/** Represents a completed purchase order. */
export interface Order {
  id: string;
  items: Book[];
  total: number;
  customerName: string;
  date: string;
}

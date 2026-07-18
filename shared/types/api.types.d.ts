/**
 * API-related type definitions shared across backend, frontend, and E2E tests.
 */

/** Standard error response shape returned by all API endpoints. */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  correlationId?: string;
  details?: unknown;
}

/** Real-time bookstore event emitted over WebSocket. */
export interface BookstoreEvent {
  id: string;
  message: string;
  type: 'purchase' | 'sale' | 'views' | 'stock';
  timestamp: string;
}

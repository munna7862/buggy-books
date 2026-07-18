/**
 * @module @buggybooks/types
 *
 * Barrel export for all shared type definitions used across
 * backend, frontend, and playwright-e2e layers.
 *
 * Import usage:
 *   import type { Book, Order, ChaosConfig } from '@buggybooks/types';
 */

// Book & catalog
export type { Book, CartItem, PaginatedBooks } from './book.types';

// Orders
export type { Order } from './order.types';

// Authentication
export type { UserRecord } from './auth.types';

// Chaos/testing configuration
export type { ChaosConfig } from './chaos.types';

// API contracts
export type { ApiErrorResponse, BookstoreEvent } from './api.types';

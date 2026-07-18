/**
 * Authentication-related type definitions shared across backend and frontend.
 */

/** Stored user record in the backend data store. */
export interface UserRecord {
  passwordHash: string;
  fullName?: string;
  avatarUrl?: string;
}

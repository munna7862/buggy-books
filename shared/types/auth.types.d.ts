/**
 * Authentication-related type definitions shared across backend, frontend, and mobile.
 */

/** Stored user record in the backend data store. */
export interface UserRecord {
  passwordHash: string;
  fullName?: string;
  avatarUrl?: string;
}

/** Authenticated user payload decoded from JWT access token. */
export interface AuthUser {
  username: string;
  type?: 'access' | string;
  fullName?: string;
}

/** Dual-auth token response payload returned by login, register, and refresh endpoints. */
export interface AuthTokensResponse {
  message?: string;
  success?: boolean;
  username: string;
  token: string;
  refreshToken: string;
}

/** User profile metadata returned by profile endpoints. */
export interface UserProfile {
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

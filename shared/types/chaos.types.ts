/**
 * Chaos/testing configuration type definitions shared across backend and frontend.
 *
 * Controls intentional failure injection for QA testing practice.
 */

/** Configuration for chaos engineering features (failure injection, delays, etc.). */
export interface ChaosConfig {
  checkoutFailureRate: number;   // 0.0 to 1.0 (default 0.15)
  inventoryDelayMs: number;      // milliseconds (default 3000)
  jwtExpirySeconds: number;      // seconds (default 900)
  websocketDropRate: number;     // 0.0 to 1.0 (default 0.0)
  uploadFailureRate: number;     // 0.0 to 1.0 (default 0.0)
  injectA11yViolations: boolean; // default false
  visualChaos: boolean;          // default false
}

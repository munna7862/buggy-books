import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { api, setUnauthorizedHandler, clearCsrfToken, fetchCsrfToken } from '../api';
import '../components/OrderSummary';

const BASE = 'http://localhost:4000/api';

describe('Frontend Dynamic CSRF Lifecycle & Safe Route Navigation', () => {
  beforeEach(() => {
    clearCsrfToken();
    setUnauthorizedHandler(null);
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('TC-CSRF-001: Dynamic Self-Healing CSRF Lifecycle & Automatic Mutating Retry', () => {
    it('fetches and caches CSRF token on initial mutating request', async () => {
      let csrfFetchCount = 0;
      let capturedToken: string | null = null;

      server.use(
        http.get(`${BASE}/csrf-token`, () => {
          csrfFetchCount++;
          return HttpResponse.json({ csrfToken: 'token-initial-123' });
        }),
        http.post(`${BASE}/cart`, ({ request }) => {
          capturedToken = request.headers.get('x-csrf-token');
          return HttpResponse.json({ message: 'Added to cart', book: { id: '1', title: 'Test Book' } });
        })
      );

      const res = await api.addToCart('1');
      expect(res).toBeDefined();
      expect(csrfFetchCount).toBe(1);
      expect(capturedToken).toBe('token-initial-123');

      // Second request should reuse cached CSRF token without re-fetching
      await api.addToCart('1');
      expect(csrfFetchCount).toBe(1);
    });

    it('transparently recovers from 403 CSRF token mismatch via automatic token refresh and single retry', async () => {
      let csrfTokenRequestCount = 0;
      let cartAttempts = 0;
      const receivedTokens: string[] = [];

      server.use(
        http.get(`${BASE}/csrf-token`, () => {
          csrfTokenRequestCount++;
          const tokenVal = csrfTokenRequestCount === 1 ? 'stale-token-001' : 'fresh-token-002';
          return HttpResponse.json({ csrfToken: tokenVal });
        }),
        http.post(`${BASE}/cart`, ({ request }) => {
          cartAttempts++;
          const token = request.headers.get('x-csrf-token') || '';
          receivedTokens.push(token);

          if (token === 'stale-token-001') {
            return HttpResponse.json(
              { error: 'invalid csrf token', message: 'CSRF token mismatch' },
              { status: 403 }
            );
          }

          return HttpResponse.json({ message: 'Added to cart', book: { id: '2', title: 'Self-Healed Book' } });
        })
      );

      // Pre-warm with stale token
      const initialToken = await fetchCsrfToken();
      expect(initialToken).toBe('stale-token-001');

      // Attempt mutating request:
      // 1st attempt sends stale-token-001 -> gets 403 CSRF error
      // api.ts invalidates token, requests fresh token -> fresh-token-002
      // 2nd attempt sends fresh-token-002 -> succeeds!
      const result = await api.addToCart('2');
      expect(result).toBeDefined();
      expect(cartAttempts).toBe(2);
      expect(receivedTokens).toEqual(['stale-token-001', 'fresh-token-002']);
      expect(csrfTokenRequestCount).toBe(2);
    });

    it('fails after exactly one retry attempt if 403 CSRF error persists (prevents infinite loops)', async () => {
      let cartAttempts = 0;

      server.use(
        http.get(`${BASE}/csrf-token`, () => {
          return HttpResponse.json({ csrfToken: 'consistently-rejected-token' });
        }),
        http.post(`${BASE}/cart`, () => {
          cartAttempts++;
          return HttpResponse.json(
            { error: 'CSRF token mismatch detected' },
            { status: 403 }
          );
        })
      );

      await expect(api.addToCart('3')).rejects.toThrow(/CSRF token mismatch detected/);
      // Exactly 1 original attempt + 1 retry attempt = 2 total
      expect(cartAttempts).toBe(2);
    });
  });

  describe('TC-ROUTER-001: Client-Side Safe Unauthorized Navigation via AuthContext Callbacks', () => {
    it('invokes registered onUnauthorized callback and clears localStorage without setting window.location.href', async () => {
      localStorage.setItem('authUser', 'logged_in_user');
      const initialPath = window.location.pathname;
      const unauthorizedCallback = vi.fn();
      setUnauthorizedHandler(unauthorizedCallback);

      server.use(
        http.get(`${BASE}/profile`, () => {
          return HttpResponse.json({ error: 'Unauthorized: Session expired' }, { status: 401 });
        }),
        http.post(`${BASE}/auth/refresh`, () => {
          return HttpResponse.json({ error: 'Refresh token expired' }, { status: 401 });
        })
      );

      await api.getProfile();

      expect(unauthorizedCallback).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('authUser')).toBeNull();
      // Ensure no full-page window.location mutation occurred
      expect(window.location.pathname).toBe(initialPath);
    });

    it('dispatches custom event auth:unauthorized when no explicit callback is registered', async () => {
      localStorage.setItem('authUser', 'another_user');
      const eventSpy = vi.fn();
      window.addEventListener('auth:unauthorized', eventSpy);

      server.use(
        http.get(`${BASE}/profile`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }),
        http.post(`${BASE}/auth/refresh`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      await api.getProfile();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('authUser')).toBeNull();
      window.removeEventListener('auth:unauthorized', eventSpy);
    });
  });

  describe('TC-A11Y-002: Shadow DOM Web Component Accessible ARIA Landmark Roles', () => {
    it('renders <order-summary-box> with valid ARIA landmark region and title within shadow root', () => {
      const summaryElement = document.createElement('order-summary-box');
      summaryElement.setAttribute('total', '42.99');
      document.body.appendChild(summaryElement);

      expect(summaryElement.shadowRoot).not.toBeNull();
      const shadow = summaryElement.shadowRoot!;

      // Verify semantic landmark attributes
      const region = shadow.querySelector('[role="region"]');
      expect(region).not.toBeNull();
      expect(region).toHaveAttribute('aria-label', 'Order Summary');

      const title = shadow.querySelector('#summary-title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toContain('Secure Order Summary');

      const amount = shadow.querySelector('.total-amount');
      expect(amount?.textContent).toBe('$42.99');

      document.body.removeChild(summaryElement);
    });
  });
});

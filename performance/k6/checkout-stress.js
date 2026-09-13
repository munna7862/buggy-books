import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { createSummaryHandler } from '../utils/summary-handler.js';

// Custom Metrics for Concurrency & Contention Profiling
const checkoutDuration = new Trend('checkout_duration', true);
const checkoutContentionDuration = new Trend('checkout_contention_duration', true);
const checkoutSuccessRate = new Rate('checkout_success_rate');
const checkoutRejectionRate = new Rate('checkout_rejection_rate');
const successfulCheckouts = new Counter('checkout_successes_total');
const stockExhaustedRejections = new Counter('checkout_stock_exhausted_total');
const checkoutCrashes = new Counter('checkout_crashes_total');
const checkoutOverselling = new Counter('checkout_overselling_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const TOTAL_VUS = parseInt(__ENV.VUS || '100', 10);
// Half the VUs can purchase; the rest must encounter stock exhaustion / contention
const INITIAL_STOCK = parseInt(__ENV.INITIAL_STOCK || String(Math.floor(TOTAL_VUS / 2)), 10);
const TARGET_BOOK_ID = '1';
const SHARED_SESSION_ID = 'checkout-concurrency-stress-session';

export const options = {
  scenarios: {
    checkout_contention: {
      executor: 'per-vu-iterations',
      vus: TOTAL_VUS,
      iterations: 1,
      maxDuration: '45s',
    },
  },
  thresholds: {
    // US-PERF-806 Acceptance Criteria:
    // Zero unhandled 500 crashes, zero overselling, graceful degradation
    checkout_crashes_total: ['count==0'],
    checkout_overselling_count: ['count==0'],
    checkout_duration: ['p(95)<500'],
    checkout_contention_duration: ['p(95)<300'],
  },
};

export function setup() {
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-test-session-id': SHARED_SESSION_ID,
    'x-bypass-rate-limit': 'true',
    'x-bypass-csrf': 'true',
  };

  // 1. Reset shared session data state
  http.post(`${BASE_URL}/api/test/reset`, null, { headers: adminHeaders });

  // 2. Clear chaos delays/failures so we test raw concurrency contention
  http.post(`${BASE_URL}/api/test/config`, JSON.stringify({
    checkoutFailureRate: 0,
    inventoryLockingRate: 0,
    inventoryDelayMs: 0,
  }), { headers: adminHeaders });

  // 3. Set fixed stock on target book (e.g. 50 units for 100 VUs)
  const stockRes = http.post(`${BASE_URL}/api/test/books/${TARGET_BOOK_ID}/stock`, JSON.stringify({
    stock: INITIAL_STOCK,
  }), { headers: adminHeaders });

  check(stockRes, {
    'setup: inventory seeded successfully': (r) => r.status === 200,
  });

  // 4. Pre-provision buyer accounts and auth tokens in setup so bcrypt hashing
  // does not distort transaction concurrency measurements during checkout surge
  const tokens = [];
  for (let i = 1; i <= TOTAL_VUS; i++) {
    const regRes = http.post(`${BASE_URL}/api/register`, JSON.stringify({
      username: `buyer_vu_${i}`,
      password: 'password123',
      fullName: `Contender VU ${i}`,
    }), { headers: adminHeaders });

    let token = '';
    if (regRes.cookies && regRes.cookies['token'] && regRes.cookies['token'][0]) {
      token = regRes.cookies['token'][0].value;
    }
    tokens.push(token);
  }

  return {
    initialStock: INITIAL_STOCK,
    targetBookId: TARGET_BOOK_ID,
    totalVus: TOTAL_VUS,
    tokens,
  };
}

export default function (data) {
  const vuIndex = __VU - 1;
  const token = data.tokens && data.tokens[vuIndex];
  const vuHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-test-session-id': SHARED_SESSION_ID,
    'x-bypass-rate-limit': 'true',
    'x-bypass-csrf': 'true',
  };

  if (token) {
    vuHeaders['Cookie'] = `token=${token}`;
  }

  // 1. Add target book to this buyer's isolated cart
  const cartRes = http.post(`${BASE_URL}/api/cart`, JSON.stringify({
    bookId: data.targetBookId,
  }), { headers: vuHeaders });

  check(cartRes, {
    'cart: item added to cart': (r) => r.status === 200,
  });

  // Micro jitter so all VUs are queued at cart before simultaneous checkout surge
  sleep(0.02 + Math.random() * 0.05);

  // 3. High-concurrency checkout race condition execution
  const checkoutPayload = JSON.stringify({
    firstName: 'FlashSale',
    lastName: `ShopperVU${__VU}`,
    creditCard: '1234567812345678',
  });

  const checkoutParams = {
    headers: vuHeaders,
    responseCallback: http.expectedStatuses(200, 400, 409),
  };

  const checkoutRes = http.post(`${BASE_URL}/api/checkout/process`, checkoutPayload, checkoutParams);

  if (checkoutRes.status === 200) {
    // Successful purchase
    checkoutDuration.add(checkoutRes.timings.duration);
    checkoutSuccessRate.add(1);
    checkoutRejectionRate.add(0);
    successfulCheckouts.add(1);

    check(checkoutRes, {
      'checkout: status is 200 (purchase confirmed)': (r) => r.status === 200,
      'checkout: orderId created': (r) => {
        try {
          const b = JSON.parse(r.body);
          return b.success === true && !!b.orderId;
        } catch {
          return false;
        }
      },
    });
  } else if (checkoutRes.status === 409 || checkoutRes.status === 400) {
    // Graceful contention rejection (stock exhausted or lock conflict)
    checkoutContentionDuration.add(checkoutRes.timings.duration);
    checkoutSuccessRate.add(0);
    checkoutRejectionRate.add(1);
    stockExhaustedRejections.add(1);

    check(checkoutRes, {
      'checkout: gracefully rejected with 409/400 (stock exhausted)': (r) => r.status === 409 || r.status === 400,
      'checkout: valid error message payload': (r) => {
        try {
          const b = JSON.parse(r.body);
          return !!(b.error || b.message);
        } catch {
          return false;
        }
      },
    });
  } else {
    // Unhandled 500 error or crash
    checkoutCrashes.add(1);
    checkoutSuccessRate.add(0);
    checkoutRejectionRate.add(0);

    check(checkoutRes, {
      'checkout: unexpectedly failed with 500 server crash': () => false,
    });
  }
}

export function teardown(data) {
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-test-session-id': SHARED_SESSION_ID,
    'x-bypass-rate-limit': 'true',
    'x-bypass-csrf': 'true',
  };

  const bookRes = http.get(`${BASE_URL}/api/books/${data.targetBookId}`, { headers: adminHeaders });
  let finalStock = null;
  if (bookRes.status === 200) {
    try {
      const book = JSON.parse(bookRes.body);
      finalStock = book.stock;
    } catch {
      // ignore
    }
  }

  // Overselling tripwire: stock must never be negative!
  if (typeof finalStock === 'number' && finalStock < 0) {
    checkoutOverselling.add(Math.abs(finalStock));
  }

  check(bookRes, {
    'teardown: target book accessible': (r) => r.status === 200,
    'teardown: zero overselling integrity maintained': () => typeof finalStock === 'number' && finalStock >= 0,
  });

  console.log(`
================================================================================
🛒 BUGGYBOOKS CHECKOUT CONCURRENCY & STOCK CONTENTION RESULTS
================================================================================
Total Contending VUs  : ${data.totalVus}
Initial Seeded Stock  : ${data.initialStock} units
Final Remaining Stock : ${finalStock} units
Zero-Overselling Integrity: ${typeof finalStock === 'number' && finalStock >= 0 ? 'PASSED 🟢 (0 oversold units)' : 'FAILED 🔴 (Overselling detected!)'}
================================================================================
`);
}

export const handleSummary = createSummaryHandler({
  jsonFilename: 'perf-summary-checkout.json',
  htmlFilename: 'performance/report-checkout.html',
  title: 'High-Concurrency Checkout Contention Benchmark (100 VUs)',
});

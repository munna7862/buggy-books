import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { createSummaryHandler } from '../utils/summary-handler.js';

// Granular Trend Metrics per User Journey Action
const browseDuration = new Trend('journey_browse_duration', true);
const searchDuration = new Trend('journey_search_duration', true);
const detailDuration = new Trend('journey_detail_duration', true);
const cartDuration = new Trend('journey_cart_duration', true);
const checkoutDuration = new Trend('journey_checkout_duration', true);
const profileDuration = new Trend('journey_profile_duration', true);
const errorRate = new Rate('api_error_rate');

// Journey Counters
const browseCount = new Counter('journey_browsers_total');
const inspectCount = new Counter('journey_inspectors_total');
const shopperCount = new Counter('journey_shoppers_total');
const buyerCount = new Counter('journey_buyers_total');
const profileCount = new Counter('journey_managers_total');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const TARGET_VUS = parseInt(__ENV.VUS || '50', 10);
const STAGE_DURATION = __ENV.STAGE_DURATION || '10s';

const SEARCH_QUERIES = ['gatsby', 'mockingbird', '1984', 'pride', 'buggy', 'refactoring', 'deploy'];

export const options = {
  stages: [
    { duration: '5s', target: Math.min(20, TARGET_VUS) },
    { duration: STAGE_DURATION, target: TARGET_VUS },
    { duration: STAGE_DURATION, target: TARGET_VUS },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    // US-PERF-804 Acceptance Criteria
    http_req_duration: ['p(95)<350', 'p(99)<700'],
    journey_browse_duration: ['p(95)<250'],
    journey_search_duration: ['p(95)<250'],
    journey_detail_duration: ['p(95)<250'],
    journey_cart_duration: ['p(95)<350'],
    journey_checkout_duration: ['p(95)<450'],
    http_req_failed: ['rate<0.02'],
    api_error_rate: ['rate<0.02'],
  },
};

export function setup() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-bypass-rate-limit': 'true',
      'x-bypass-csrf': 'true',
    },
  };

  // Prime backend endpoints and ensure chaos config is clean
  http.post(`${BASE_URL}/api/test/config`, JSON.stringify({
    checkoutFailureRate: 0,
    inventoryLockingRate: 0,
    inventoryDelayMs: 0,
  }), params);

  const res = http.get(`${BASE_URL}/api/books`, params);
  check(res, { 'setup: catalog accessible': (r) => r.status === 200 });

  return { primed: true };
}

export default function () {
  // Session isolation per VU to prevent cart or cache collisions
  const sessionId = `k6-journey-vu-${__VU}`;
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-test-session-id': sessionId,
    'x-bypass-rate-limit': 'true',
    'x-bypass-csrf': 'true',
  };

  // Probabilistic User Persona Action Branching
  // 60% Browsers, 20% Product Inspectors, 10% Shoppers, 5% Buyers, 5% Profile/Account Managers
  const rand = Math.random() * 100;

  if (rand < 60) {
    // -------------------------------------------------------------
    // Persona 1: Browsers (60%) - Catalog listing and search
    // -------------------------------------------------------------
    browseCount.add(1);

    // 1. Browse full catalog
    const browseRes = http.get(`${BASE_URL}/api/books`, { headers: baseHeaders });
    const browseOk = check(browseRes, {
      'browse: status is 200': (r) => r.status === 200,
      'browse: books returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) && body.length > 0;
        } catch {
          return false;
        }
      },
    });
    browseDuration.add(browseRes.timings.duration);
    errorRate.add(!browseOk);

    // Jitter think time
    sleep(0.3 + Math.random() * 0.5);

    // 2. Search catalog with keyword query
    const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    const searchRes = http.get(`${BASE_URL}/api/books?q=${encodeURIComponent(query)}`, { headers: baseHeaders });
    const searchOk = check(searchRes, {
      'search: status is 200': (r) => r.status === 200,
      'search: valid response': (r) => r.body && r.body.length > 0,
    });
    searchDuration.add(searchRes.timings.duration);
    errorRate.add(!searchOk);

  } else if (rand < 80) {
    // -------------------------------------------------------------
    // Persona 2: Product Inspectors (20%) - Book detail views
    // -------------------------------------------------------------
    inspectCount.add(1);

    const randomBookId = Math.floor(Math.random() * 15) + 1;
    const detailRes = http.get(`${BASE_URL}/api/books/${randomBookId}`, { headers: baseHeaders });
    const detailOk = check(detailRes, {
      'detail: status is 200': (r) => r.status === 200,
      'detail: contains book id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && (body.id === String(randomBookId) || body.id === randomBookId);
        } catch {
          return false;
        }
      },
    });
    detailDuration.add(detailRes.timings.duration);
    errorRate.add(!detailOk);

  } else if (rand < 90) {
    // -------------------------------------------------------------
    // Persona 3: Shoppers (10%) - Auth, view cart, add item to cart
    // -------------------------------------------------------------
    shopperCount.add(1);

    // 1. Authenticate user
    const loginRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({
      username: 'testuser',
      password: 'buggybooks',
    }), { headers: baseHeaders });

    const loginOk = check(loginRes, {
      'shopper login: status is 200': (r) => r.status === 200,
    });
    errorRate.add(!loginOk);

    // 2. Fetch current cart
    const cartGetRes = http.get(`${BASE_URL}/api/cart`, { headers: baseHeaders });
    const cartGetOk = check(cartGetRes, {
      'shopper get cart: status is 200': (r) => r.status === 200,
    });
    cartDuration.add(cartGetRes.timings.duration);
    errorRate.add(!cartGetOk);

    // Think time before adding to cart
    sleep(0.2 + Math.random() * 0.4);

    // 3. Add book to cart
    const bookToAdd = String(Math.floor(Math.random() * 15) + 1);
    const cartPostRes = http.post(`${BASE_URL}/api/cart`, JSON.stringify({
      bookId: bookToAdd,
    }), { headers: baseHeaders });

    const cartPostOk = check(cartPostRes, {
      'shopper add to cart: status is 200': (r) => r.status === 200,
    });
    cartDuration.add(cartPostRes.timings.duration);
    errorRate.add(!cartPostOk);

  } else if (rand < 95) {
    // -------------------------------------------------------------
    // Persona 4: Buyers (5%) - Complete purchase cycle: login -> cart -> checkout -> orders
    // -------------------------------------------------------------
    buyerCount.add(1);

    // 1. Authenticate user
    const loginRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({
      username: 'testuser',
      password: 'buggybooks',
    }), { headers: baseHeaders });
    check(loginRes, { 'buyer login: status is 200': (r) => r.status === 200 });

    // 2. Add book to cart
    const bookToAdd = String(Math.floor(Math.random() * 15) + 1);
    const cartRes = http.post(`${BASE_URL}/api/cart`, JSON.stringify({
      bookId: bookToAdd,
    }), { headers: baseHeaders });
    cartDuration.add(cartRes.timings.duration);

    // Think time before checkout
    sleep(0.3 + Math.random() * 0.4);

    // 3. Process checkout
    const checkoutPayload = JSON.stringify({
      firstName: 'Speedy',
      lastName: `BuyerVU${__VU}`,
      creditCard: '1234567812345678',
    });

    const checkoutRes = http.post(`${BASE_URL}/api/checkout/process`, checkoutPayload, { headers: baseHeaders });
    const checkoutOk = check(checkoutRes, {
      'buyer checkout: status is 200': (r) => r.status === 200,
      'buyer checkout: orderId generated': (r) => {
        try {
          const b = JSON.parse(r.body);
          return b && b.success === true && !!b.orderId;
        } catch {
          return false;
        }
      },
    });
    checkoutDuration.add(checkoutRes.timings.duration);
    errorRate.add(!checkoutOk);

    // 4. Verify orders history
    const ordersRes = http.get(`${BASE_URL}/api/orders`, { headers: baseHeaders });
    const ordersOk = check(ordersRes, {
      'buyer orders: status is 200': (r) => r.status === 200,
    });
    errorRate.add(!ordersOk);

  } else {
    // -------------------------------------------------------------
    // Persona 5: Profile/Account Managers (5%) - Auth & view profile
    // -------------------------------------------------------------
    profileCount.add(1);

    const loginRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({
      username: 'testuser',
      password: 'buggybooks',
    }), { headers: baseHeaders });
    check(loginRes, { 'profile login: status is 200': (r) => r.status === 200 });

    const profileRes = http.get(`${BASE_URL}/api/profile`, { headers: baseHeaders });
    const profileOk = check(profileRes, {
      'profile: status is 200': (r) => r.status === 200,
      'profile: contains username': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && body.username === 'testuser';
        } catch {
          return false;
        }
      },
    });
    profileDuration.add(profileRes.timings.duration);
    errorRate.add(!profileOk);
  }

  // Realistic user think time jitter across all iterations
  sleep(0.5 + Math.random() * 1.5);
}

export const handleSummary = createSummaryHandler({
  jsonFilename: 'perf-summary-journey.json',
  htmlFilename: 'performance/report-journey.html',
  title: 'End-to-End E-Commerce User Journey Benchmark (50 VUs)',
});

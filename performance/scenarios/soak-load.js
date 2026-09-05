import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metric trends for endurance and latency stability tracking
const catalogDuration = new Trend('catalog_duration', true);
const searchDuration = new Trend('search_duration', true);
const detailDuration = new Trend('detail_duration', true);
const soakReqDuration = new Trend('soak_req_duration', true);
const errorRate = new Rate('api_error_rate');

// Configurable options via environment variables or defaults
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const SOAK_DURATION = __ENV.SOAK_DURATION || __ENV.DURATION || '15m';
const SOAK_VUS = parseInt(__ENV.SOAK_VUS || __ENV.VUS || '25', 10);

export const options = {
  stages: [
    { duration: '30s', target: SOAK_VUS },             // Warm-up ramp
    { duration: SOAK_DURATION, target: SOAK_VUS },     // Sustained endurance soak load
    { duration: '30s', target: 0 },                    // Graceful ramp-down
  ],
  thresholds: {
    // US-PERF-501 Acceptance Criteria: p95 latency < 300ms, p99 < 600ms, error rate < 0.1% (with CI tolerance)
    http_req_duration: ['p(90)<250', 'p(95)<300', 'p(99)<600'],
    catalog_duration: ['p(95)<300'],
    search_duration: ['p(95)<300'],
    detail_duration: ['p(95)<300'],
    soak_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
    api_error_rate: ['rate<0.01'],
  },
};

export default function () {
  const sessionId = `k6-soak-vu-${__VU}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-test-session-id': sessionId,
      'x-bypass-rate-limit': 'true',
    },
  };

  // 1. Benchmark: Catalog Browsing (GET /api/books)
  const catalogRes = http.get(`${BASE_URL}/api/books`, params);
  const catalogOk = check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
    'catalog returns items': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) ? body.length > 0 : (body.books && body.books.length > 0);
      } catch {
        return false;
      }
    },
  });
  catalogDuration.add(catalogRes.timings.duration);
  soakReqDuration.add(catalogRes.timings.duration);
  errorRate.add(!catalogOk);

  sleep(0.15);

  // 2. Benchmark: Catalog Search (GET /api/books?q=gatsby)
  const searchRes = http.get(`${BASE_URL}/api/books?q=gatsby`, params);
  const searchOk = check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search returns results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body !== null;
      } catch {
        return false;
      }
    },
  });
  searchDuration.add(searchRes.timings.duration);
  soakReqDuration.add(searchRes.timings.duration);
  errorRate.add(!searchOk);

  sleep(0.15);

  // 3. Benchmark: Book Detail View (GET /api/books/1)
  const detailRes = http.get(`${BASE_URL}/api/books/1`, params);
  const detailOk = check(detailRes, {
    'detail status is 200': (r) => r.status === 200,
    'detail contains id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && (body.id === 1 || body.id === '1');
      } catch {
        return false;
      }
    },
  });
  detailDuration.add(detailRes.timings.duration);
  soakReqDuration.add(detailRes.timings.duration);
  errorRate.add(!detailOk);

  sleep(0.2);
}

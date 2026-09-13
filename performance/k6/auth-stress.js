import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { createSummaryHandler } from '../utils/summary-handler.js';

// Custom Metrics for Authentication Profiling
const loginDuration = new Trend('auth_login_duration', true);
const refreshDuration = new Trend('auth_refresh_duration', true);
const authErrorRate = new Rate('auth_error_rate');
const loginsTotal = new Counter('auth_logins_total');
const refreshesTotal = new Counter('auth_refreshes_total');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const TARGET_VUS = parseInt(__ENV.VUS || '40', 10);
const STAGE_DURATION = __ENV.STAGE_DURATION || '10s';

export const options = {
  stages: [
    { duration: '5s', target: Math.min(15, TARGET_VUS) }, // Ramp-up
    { duration: STAGE_DURATION, target: TARGET_VUS },      // Surge to 40 concurrent authentication VUs
    { duration: STAGE_DURATION, target: TARGET_VUS },      // Sustained bcrypt saturation stress
    { duration: '5s', target: 0 },                        // Cool-down
  ],
  thresholds: {
    // US-PERF-805 Acceptance Criteria:
    // bcrypt verify p95 < 350ms, p99 < 700ms under 40 concurrent workers
    http_req_duration: ['p(95)<400', 'p(99)<750'],
    auth_login_duration: ['p(95)<350', 'p(99)<700'],
    auth_refresh_duration: ['p(95)<150'],
    http_req_failed: ['rate<0.02'],
    auth_error_rate: ['rate<0.02'],
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

  // Ensure chaos config has no artificial delay or failures for baseline accuracy
  http.post(`${BASE_URL}/api/test/config`, JSON.stringify({
    checkoutFailureRate: 0,
    inventoryLockingRate: 0,
    inventoryDelayMs: 0,
  }), params);

  // Validate seeded user credentials are ready
  const primeRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({
    username: 'testuser',
    password: 'buggybooks',
  }), params);

  check(primeRes, {
    'setup: login endpoint operational': (r) => r.status === 200,
  });

  return { primed: true };
}

export default function () {
  const sessionId = `k6-auth-vu-${__VU}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-test-session-id': sessionId,
      'x-bypass-rate-limit': 'true',
      'x-bypass-csrf': 'true',
    },
  };

  // 1. Benchmark: POST /api/login (bcrypt.compare CPU saturation)
  const loginPayload = JSON.stringify({
    username: 'testuser',
    password: 'buggybooks',
  });

  const loginRes = http.post(`${BASE_URL}/api/login`, loginPayload, params);
  const loginOk = check(loginRes, {
    'login: status is 200': (r) => r.status === 200,
    'login: returns valid username': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.username === 'testuser';
      } catch {
        return false;
      }
    },
  });

  loginDuration.add(loginRes.timings.duration);
  authErrorRate.add(!loginOk);
  if (loginOk) {
    loginsTotal.add(1);
  }

  // Micro-think time between authentication operations
  sleep(0.1 + Math.random() * 0.15);

  // 2. Benchmark: POST /api/auth/refresh (JWT verification and re-issue)
  // The VU cookie jar automatically preserves the refreshToken cookie set during login
  const refreshRes = http.post(`${BASE_URL}/api/auth/refresh`, null, params);
  const refreshOk = check(refreshRes, {
    'refresh: status is 200': (r) => r.status === 200,
    'refresh: success payload received': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.success === true && body.username === 'testuser';
      } catch {
        return false;
      }
    },
  });

  refreshDuration.add(refreshRes.timings.duration);
  authErrorRate.add(!refreshOk);
  if (refreshOk) {
    refreshesTotal.add(1);
  }

  // Pacing think time between authentication iterations to sustain ~30-40 RPS
  // without artificial unbounded libuv threadpool queue pileups
  sleep(0.5 + Math.random() * 0.5);
}

export const handleSummary = createSummaryHandler({
  jsonFilename: 'perf-summary-auth.json',
  htmlFilename: 'performance/report-auth.html',
  title: 'Authentication Burst & Bcrypt Saturation Benchmark (40 VUs)',
});

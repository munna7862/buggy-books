import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const inventoryDuration = new Trend('inventory_duration', true);
const inventorySuccessRate = new Rate('inventory_success_rate');
const reportCount = new Counter('inventory_reports_generated');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '5s', target: 15 },  // Ramp to 15 VUs
    { duration: '10s', target: 30 }, // Stress with 30 concurrent reporting workers
    { duration: '10s', target: 30 }, // Sustained load
    { duration: '5s', target: 0 },   // Cool-down
  ],
  thresholds: {
    // Inventory reporting delayed endpoint throughput thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    inventory_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.02'],
    inventory_success_rate: ['rate>0.98'],
  },
};

export default function () {
  const sessionId = `k6-inventory-vu-${__VU}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-test-session-id': sessionId,
      'x-bypass-rate-limit': 'true',
    },
  };

  const res = http.get(`${BASE_URL}/api/inventory/report`, params);
  const success = check(res, {
    'inventory status is 200': (r) => r.status === 200,
    'inventory response contains totalBooks': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.totalBooks === 'number' && body.totalBooks >= 0;
      } catch {
        return false;
      }
    },
    'inventory response contains totalValue': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.totalValue === 'number' && body.totalValue >= 0;
      } catch {
        return false;
      }
    },
  });

  inventoryDuration.add(res.timings.duration);
  inventorySuccessRate.add(success);
  if (success) {
    reportCount.add(1);
  }

  sleep(0.15);
}

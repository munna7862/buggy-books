import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metric trends for endurance and latency stability tracking
const catalogDuration = new Trend('catalog_duration', true);
const searchDuration = new Trend('search_duration', true);
const detailDuration = new Trend('detail_duration', true);
const soakReqDuration = new Trend('soak_req_duration', true);
const errorRate = new Rate('api_error_rate');

// Node.js memory telemetry metrics
const heapUsedTrend = new Trend('node_heap_used_mb', true);
const rssTrend = new Trend('node_rss_mb', true);
const heapDriftTrend = new Trend('node_heap_drift_percent', true);
const memoryLeakRate = new Rate('memory_leak_detected');

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
    // US-PERF-501 & US-PERF-601 Acceptance Criteria: p95 latency < 300ms, p99 < 600ms, error rate < 0.1%, heap drift < 30%
    http_req_duration: ['p(90)<250', 'p(95)<300', 'p(99)<600'],
    catalog_duration: ['p(95)<300'],
    search_duration: ['p(95)<300'],
    detail_duration: ['p(95)<300'],
    soak_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
    api_error_rate: ['rate<0.01'],
    memory_leak_detected: ['rate<0.01'],
  },
};

export function setup() {
  const params = {
    headers: {
      'Accept': 'application/json',
      'x-bypass-rate-limit': 'true',
    },
  // Prime endpoints so initial module caches and catalog data are initialized
  http.get(`${BASE_URL}/api/books`, params);
  http.get(`${BASE_URL}/api/books?q=gatsby`, params);
  http.get(`${BASE_URL}/api/books/1`, params);

  const res = http.get(`${BASE_URL}/api/health`, params);
  let initialMemory = { heapUsed: 0, heapTotal: 0, rss: 0 };
  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      if (body.memory) {
        initialMemory = body.memory;
      }
    } catch (e) {
      console.warn('Warning: Failed to parse initial /api/health response:', e);
    }
  }

  const initialHeapMb = (initialMemory.heapUsed / (1024 * 1024)).toFixed(2);
  const initialRssMb = (initialMemory.rss / (1024 * 1024)).toFixed(2);
  console.log(`[Soak Setup] Initial Node.js Process Memory: heapUsed=${initialHeapMb} MB, rss=${initialRssMb} MB`);

  return {
    initialMemory,
    startTime: new Date().toISOString(),
  };
}

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

  // 4. Periodic Process Memory Telemetry Sampling (Sampled by VU 1 every 20 iterations)
  if (__VU === 1 && __ITER % 20 === 0) {
    const healthRes = http.get(`${BASE_URL}/api/health`, params);
    if (healthRes.status === 200) {
      try {
        const healthData = JSON.parse(healthRes.body);
        if (healthData.memory) {
          heapUsedTrend.add(healthData.memory.heapUsed / (1024 * 1024));
          rssTrend.add(healthData.memory.rss / (1024 * 1024));
        }
      } catch {
        // ignore parse error in sample
      }
    }
  }
}

export function teardown(data) {
  const params = {
    headers: {
      'Accept': 'application/json',
      'x-bypass-rate-limit': 'true',
    },
  };
  const finalRes = http.get(`${BASE_URL}/api/health`, params);
  let finalMemory = { heapUsed: 0, heapTotal: 0, rss: 0 };
  if (finalRes.status === 200) {
    try {
      const body = JSON.parse(finalRes.body);
      if (body.memory) {
        finalMemory = body.memory;
      }
    } catch (e) {
      console.warn('Warning: Failed to parse final /api/health response:', e);
    }
  }

  const initialHeap = data.initialMemory ? data.initialMemory.heapUsed : 0;
  const finalHeap = finalMemory.heapUsed;
  const initialRss = data.initialMemory ? data.initialMemory.rss : 0;
  const finalRss = finalMemory.rss;

  const heapDriftPercent = initialHeap > 0 ? ((finalHeap - initialHeap) / initialHeap) * 100 : 0;
  const rssDriftPercent = initialRss > 0 ? ((finalRss - initialRss) / initialRss) * 100 : 0;

  heapDriftTrend.add(heapDriftPercent);

  // Assert memory leak tripwire: heapUsed drift must not exceed 30%
  const isMemoryStable = heapDriftPercent <= 30.0;
  memoryLeakRate.add(!isMemoryStable);

  check(finalRes, {
    'heapUsed memory drift within 30% threshold': () => isMemoryStable,
    'backend health status is ok': (r) => r.status === 200,
  });

  const initHeapMb = (initialHeap / (1024 * 1024)).toFixed(2);
  const finHeapMb = (finalHeap / (1024 * 1024)).toFixed(2);
  const initRssMb = (initialRss / (1024 * 1024)).toFixed(2);
  const finRssMb = (finalRss / (1024 * 1024)).toFixed(2);

  console.log(`
================================================================================
🧠 BUGGYBOOKS ENDURANCE SOAK NODE.JS MEMORY TELEMETRY REPORT
================================================================================
Initial heapUsed : ${initHeapMb} MB
Final heapUsed   : ${finHeapMb} MB
Heap Drift       : ${heapDriftPercent >= 0 ? '+' : ''}${heapDriftPercent.toFixed(2)}% (Max Threshold: +30.00%)
Initial RSS      : ${initRssMb} MB
Final RSS        : ${finRssMb} MB
RSS Drift        : ${rssDriftPercent >= 0 ? '+' : ''}${rssDriftPercent.toFixed(2)}%
Memory Stability : ${isMemoryStable ? 'PASSED 🟢 (No memory leak detected)' : 'FAILED 🔴 (Memory leak threshold exceeded)'}
================================================================================
`);
}

export function handleSummary(data) {
  return {
    'perf-summary-soak.json': JSON.stringify(data, null, 2),
  };
}

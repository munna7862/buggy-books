import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metric trends for capacity saturation and breakpoint tracking
const catalogDuration = new Trend('catalog_duration', true);
const searchDuration = new Trend('search_duration', true);
const detailDuration = new Trend('detail_duration', true);
const errorRate = new Rate('api_error_rate');
const totalErrors = new Counter('total_server_errors');

// Configurable options via environment variables or defaults
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const MAX_VUS = parseInt(__ENV.MAX_VUS || '200', 10);
const RAMP_STEP_DURATION = __ENV.STEP_DURATION || '10s';

export const options = {
  stages: [
    { duration: RAMP_STEP_DURATION, target: Math.round(MAX_VUS * 0.1) },  // 10% load
    { duration: RAMP_STEP_DURATION, target: Math.round(MAX_VUS * 0.25) }, // 25% load
    { duration: RAMP_STEP_DURATION, target: Math.round(MAX_VUS * 0.5) },  // 50% load
    { duration: RAMP_STEP_DURATION, target: Math.round(MAX_VUS * 0.75) }, // 75% load
    { duration: RAMP_STEP_DURATION, target: MAX_VUS },                    // 100% capacity ramp (200+ VUs)
    { duration: '10s', target: 0 },                                       // Cool down
  ],
  thresholds: {
    // Breakpoint tripwires: abort if error rate > 5% or p95 response time > 1000ms
    http_req_failed: [{ threshold: 'rate<=0.05', abortOnFail: true, delayAbortEval: '5s' }],
    http_req_duration: [{ threshold: 'p(95)<=1000', abortOnFail: true, delayAbortEval: '5s' }],
    api_error_rate: [{ threshold: 'rate<=0.05', abortOnFail: true, delayAbortEval: '5s' }],
  },
};

export default function () {
  const sessionId = `k6-breakpoint-vu-${__VU}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-test-session-id': sessionId,
      'x-bypass-rate-limit': 'true',
    },
  };

  // 1. Heavy endpoint contention: Catalog retrieval (GET /api/books)
  const catalogRes = http.get(`${BASE_URL}/api/books`, params);
  const catalogOk = check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
  });
  catalogDuration.add(catalogRes.timings.duration);
  errorRate.add(!catalogOk);
  if (!catalogOk) totalErrors.add(1);

  sleep(0.05);

  // 2. Search query with filtering (GET /api/books?q=gatsby)
  const searchRes = http.get(`${BASE_URL}/api/books?q=gatsby`, params);
  const searchOk = check(searchRes, {
    'search status is 200': (r) => r.status === 200,
  });
  searchDuration.add(searchRes.timings.duration);
  errorRate.add(!searchOk);
  if (!searchOk) totalErrors.add(1);

  sleep(0.05);

  // 3. Detail query (GET /api/books/1)
  const detailRes = http.get(`${BASE_URL}/api/books/1`, params);
  const detailOk = check(detailRes, {
    'detail status is 200': (r) => r.status === 200,
  });
  detailDuration.add(detailRes.timings.duration);
  errorRate.add(!detailOk);
  if (!detailOk) totalErrors.add(1);

  sleep(0.1);
}

export function handleSummary(data) {
  const metrics = data.metrics || {};
  const vusMax = metrics['vus_max'] ? metrics['vus_max'].values.max : (metrics['vus'] ? metrics['vus'].values.value : 0);
  const duration = metrics['http_req_duration'] ? metrics['http_req_duration'].values : {};
  const p95 = duration['p(95)'] !== undefined ? duration['p(95)'].toFixed(2) : 'N/A';
  const avg = duration['avg'] !== undefined ? duration['avg'].toFixed(2) : 'N/A';
  const failed = metrics['http_req_failed'] ? (metrics['http_req_failed'].values.rate * 100).toFixed(2) : '0.00';
  const reqCount = metrics['http_reqs'] ? metrics['http_reqs'].values.count : 0;

  let breakpointDetected = false;
  let bottleneckDiagnosis = 'System operated stably within defined SLA limits without capacity saturation.';

  if (parseFloat(failed) > 5.0) {
    breakpointDetected = true;
    bottleneckDiagnosis = `💥 BREAKING POINT REACHED: HTTP Error rate spiked to ${failed}% (Threshold: > 5.00%). Primary Bottleneck: HTTP 5xx / Connection pool exhaustion under concurrency.`;
  } else if (p95 !== 'N/A' && parseFloat(p95) > 1000.0) {
    breakpointDetected = true;
    bottleneckDiagnosis = `💥 BREAKING POINT REACHED: p95 latency reached ${p95}ms (Threshold: > 1000.00ms). Primary Bottleneck: Event loop queue latency / CPU saturation under concurrency.`;
  }

  const summaryReport = `
================================================================================
⚡ BUGGYBOOKS CAPACITY BREAKPOINT SATURATION REPORT
================================================================================
Peak Concurrent VUs Tested : ${vusMax} VUs
Total Requests Executed    : ${reqCount}
Average Latency            : ${avg} ms
p95 Latency                : ${p95} ms
HTTP Failure Rate          : ${failed} %
Breakpoint Reached         : ${breakpointDetected ? 'YES 🔴' : 'NO 🟢'}

DIAGNOSIS & BOTTLENECK ANALYSIS:
${bottleneckDiagnosis}
================================================================================
`;

  return {
    'stdout': summaryReport,
    'perf-summary-breakpoint.json': JSON.stringify(data, null, 2),
  };
}

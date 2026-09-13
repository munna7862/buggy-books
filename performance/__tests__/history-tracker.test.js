const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, afterEach } = require('node:test');
const {
  inferTestType,
  appendHistoryRecord,
  analyzeCreepingRegression,
  generateAsciiSparkline,
  loadHistory,
} = require('../utils/history-tracker.js');

describe('Performance History Tracker & Creeping Regression Tests', () => {
  const testHistoryPath = path.resolve(__dirname, 'test-perf-history.json');

  afterEach(() => {
    if (fs.existsSync(testHistoryPath)) {
      fs.unlinkSync(testHistoryPath);
    }
  });

  it('inferTestType should correctly identify test tiers from titles/paths', () => {
    assert.strictEqual(inferTestType('PR API Smoke Benchmark (5 VUs)', 'perf-summary-smoke.json'), 'smoke');
    assert.strictEqual(inferTestType('Catalog Load Benchmark (50 VUs)', 'perf-summary-catalog.json'), 'catalog');
    assert.strictEqual(inferTestType('Inventory Stress Benchmark', 'inventory-stress.js'), 'inventory');
    assert.strictEqual(inferTestType('E-Commerce User Journey Benchmark', 'ecommerce-journey.js'), 'journey');
    assert.strictEqual(inferTestType('Authentication Burst Benchmark', 'auth-stress.js'), 'auth');
    assert.strictEqual(inferTestType('Checkout Contention Benchmark', 'checkout-stress.js'), 'checkout');
    assert.strictEqual(inferTestType('Endurance Soak Benchmark', 'soak-load.js'), 'soak');
    assert.strictEqual(inferTestType('Breakpoint Capacity Saturation', 'breakpoint-test.js'), 'breakpoint');
  });

  it('generateAsciiSparkline should return representative sparkline ticks', () => {
    const sparkline = generateAsciiSparkline([10, 20, 30, 40, 50]);
    assert.strictEqual(typeof sparkline, 'string');
    assert.strictEqual(sparkline.length, 5);
    // Flat line
    assert.strictEqual(generateAsciiSparkline([5, 5, 5]), '▄▄▄');
  });

  it('appendHistoryRecord should enforce circular buffer of max 30 records', () => {
    for (let i = 1; i <= 35; i++) {
      appendHistoryRecord(testHistoryPath, {
        timestamp: new Date().toISOString(),
        commit_sha: `sha${i}`,
        workflow_run_id: `run${i}`,
        test_type: 'smoke',
        rps: 35.0,
        p95_latency: 5.0 + i * 0.1,
        error_rate: 0.0,
      }, 30);
    }

    const loaded = loadHistory(testHistoryPath);
    assert.strictEqual(loaded.history.length, 30);
    assert.strictEqual(loaded.history[loaded.history.length - 1].commit_sha, 'sha35');
    assert.strictEqual(loaded.history[0].commit_sha, 'sha6');
  });

  it('analyzeCreepingRegression should detect +10% degradation over 5-run rolling window', () => {
    const history = [
      // Base window: avg = 10.0ms
      { test_type: 'smoke', p95_latency: 10.0 },
      { test_type: 'smoke', p95_latency: 10.0 },
      { test_type: 'smoke', p95_latency: 10.0 },
      { test_type: 'smoke', p95_latency: 10.0 },
      { test_type: 'smoke', p95_latency: 10.0 },
      // Creeping window: avg = 11.5ms (+15% drift)
      { test_type: 'smoke', p95_latency: 11.0 },
      { test_type: 'smoke', p95_latency: 11.2 },
      { test_type: 'smoke', p95_latency: 11.5 },
      { test_type: 'smoke', p95_latency: 11.8 },
      { test_type: 'smoke', p95_latency: 12.0 },
    ];

    const analysis = analyzeCreepingRegression(history, 'smoke', 10.0, 5);
    assert.strictEqual(analysis.isCreepingRegression, true);
    assert.ok(analysis.delta > 10.0);
    assert.strictEqual(analysis.sampleCount, 10);
    assert.strictEqual(typeof analysis.sparkline, 'string');
  });

  it('analyzeCreepingRegression should pass stable runs within +10%', () => {
    const history = [
      { test_type: 'smoke', p95_latency: 10.0 },
      { test_type: 'smoke', p95_latency: 10.2 },
      { test_type: 'smoke', p95_latency: 9.8 },
      { test_type: 'smoke', p95_latency: 10.1 },
      { test_type: 'smoke', p95_latency: 10.3 },
    ];

    const analysis = analyzeCreepingRegression(history, 'smoke', 10.0, 5);
    assert.strictEqual(analysis.isCreepingRegression, false);
    assert.ok(analysis.delta <= 10.0);
  });
});

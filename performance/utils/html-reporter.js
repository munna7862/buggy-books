/**
 * BuggyBooks Standalone Interactive HTML Performance Report Generator
 *
 * Generates a self-contained, responsive, zero-CDN HTML5 dashboard visualizing k6 benchmark
 * results: response-time percentiles, request throughput, error distributions, baseline regression
 * deltas, endpoint health checks, and Node.js runtime memory stability telemetry.
 *
 * Compatible with both pure k6 (handleSummary) and Node.js CLI (report-perf-summary.js).
 */

const REGRESSION_THRESHOLD_PERCENT = 20.0;
const WARNING_THRESHOLD_PERCENT = 10.0;

function formatNumber(val, decimals = 2) {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return Number(val).toFixed(decimals);
}

function getMetricValue(metric, key) {
  if (!metric) return undefined;
  if (metric.values && metric.values[key] !== undefined) return metric.values[key];
  if (metric[key] !== undefined) return metric[key];
  return undefined;
}

function calculateDelta(current, baseline) {
  if (current === undefined || baseline === undefined || isNaN(current) || isNaN(baseline) || baseline === 0) {
    return null;
  }
  return ((current - baseline) / baseline) * 100;
}

function formatDelta(delta) {
  if (delta === null || delta === undefined || isNaN(delta)) return 'N/A';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}%`;
}

function getDeltaStatus(delta) {
  if (delta === null || delta === undefined || isNaN(delta)) {
    return { text: 'N/A', cls: 'badge-info', isRegression: false };
  }
  if (delta > REGRESSION_THRESHOLD_PERCENT) {
    return { text: `REGRESSION (${formatDelta(delta)})`, cls: 'badge-fail', isRegression: true };
  }
  if (delta > WARNING_THRESHOLD_PERCENT) {
    return { text: `WARNING (${formatDelta(delta)})`, cls: 'badge-warn', isRegression: false };
  }
  if (delta <= 0) {
    return { text: `IMPROVED (${formatDelta(delta)})`, cls: 'badge-pass', isRegression: false };
  }
  return { text: `PASS (${formatDelta(delta)})`, cls: 'badge-pass', isRegression: false };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a complete, self-contained HTML report string.
 *
 * @param {Object} summaryData Raw k6 summary data object
 * @param {Object} [options]
 * @param {string} [options.title] Test run title
 * @param {Object} [options.baselineData] Golden baseline object
 * @param {boolean} [options.isRegressionSimulated]
 * @returns {string} Fully rendered HTML5 document string
 */
function generateHtmlReport(summaryData, options = {}) {
  const title = options.title || 'BuggyBooks k6 Performance Benchmark';
  const baselineData = options.baselineData || null;
  const isRegressionSimulated = !!options.isRegressionSimulated;

  const metrics = summaryData.metrics || {};
  const rootGroup = summaryData.root_group || {};

  // Extract core metrics
  const httpDuration = metrics['http_req_duration'] || metrics['http_req_duration{expected_response:true}'] || {};
  const httpReqs = metrics['http_reqs'] || {};
  const httpFailed = metrics['http_req_failed'] || {};
  const vusMax = metrics['vus_max'] || metrics['vus'] || {};
  const iterations = metrics['iterations'] || {};

  const avgDuration = getMetricValue(httpDuration, 'avg');
  const medDuration = getMetricValue(httpDuration, 'med');
  const p90Duration = getMetricValue(httpDuration, 'p(90)');
  let p95Duration = getMetricValue(httpDuration, 'p(95)');
  const p99Duration = getMetricValue(httpDuration, 'p(99)');
  const maxDuration = getMetricValue(httpDuration, 'max');

  if (isRegressionSimulated && p95Duration !== undefined) {
    p95Duration = p95Duration * 1.25;
  }

  const totalReqs = getMetricValue(httpReqs, 'count');
  const rps = getMetricValue(httpReqs, 'rate');
  const totalIterations = getMetricValue(iterations, 'count');
  const failRate = getMetricValue(httpFailed, 'rate') !== undefined
    ? getMetricValue(httpFailed, 'rate') * 100
    : (getMetricValue(httpFailed, 'value') !== undefined ? getMetricValue(httpFailed, 'value') * 100 : 0);
  const maxVus = getMetricValue(vusMax, 'max') || getMetricValue(vusMax, 'value');

  // Discover all duration trends
  const durationTrends = [];
  for (const [key, metric] of Object.entries(metrics)) {
    if (key.endsWith('_duration') && key !== 'http_req_duration') {
      durationTrends.push({
        name: key,
        avg: getMetricValue(metric, 'avg'),
        p90: getMetricValue(metric, 'p(90)'),
        p95: getMetricValue(metric, 'p(95)'),
        p99: getMetricValue(metric, 'p(99)'),
        max: getMetricValue(metric, 'max'),
      });
    }
  }

  // Threshold evaluations
  let hasThresholdFailures = false;
  const thresholdRows = [];
  for (const [metricName, metricObj] of Object.entries(metrics)) {
    if (metricObj.thresholds) {
      for (const [threshName, threshResult] of Object.entries(metricObj.thresholds)) {
        let isBreached = false;
        if (typeof threshResult === 'boolean') {
          isBreached = threshResult === true;
        } else if (typeof threshResult === 'object' && threshResult !== null) {
          isBreached = threshResult.ok === false;
        }
        if (isBreached) hasThresholdFailures = true;
        thresholdRows.push({
          metric: metricName,
          threshold: threshName,
          passed: !isBreached,
        });
      }
    }
  }

  // Baseline comparisons
  let hasRegression = false;
  const baselineRows = [];
  if (baselineData) {
    const baseMetrics = baselineData.metrics || baselineData;

    // Collect all comparable metrics dynamically
    const metricsToCompare = [
      { key: 'http_req_duration', subKey: 'avg', label: 'http_req_duration (avg)', currentVal: avgDuration },
      { key: 'http_req_duration', subKey: 'p(90)', label: 'http_req_duration (p90)', currentVal: p90Duration },
      { key: 'http_req_duration', subKey: 'p(95)', label: 'http_req_duration (p95)', currentVal: p95Duration },
    ];

    for (const [key, metric] of Object.entries(metrics)) {
      if (key.endsWith('_duration') && key !== 'http_req_duration') {
        metricsToCompare.push({
          key,
          subKey: 'p(95)',
          label: `${key} (p95)`,
          currentVal: getMetricValue(metric, 'p(95)'),
        });
      }
    }

    for (const item of metricsToCompare) {
      const baseMetricObj = baseMetrics[item.key];
      const baseVal = getMetricValue(baseMetricObj, item.subKey);
      let currentVal = item.currentVal;

      if (isRegressionSimulated && item.subKey === 'p(95)' && baseVal !== undefined) {
        currentVal = baseVal * 1.25;
      }

      if (baseVal !== undefined && currentVal !== undefined) {
        const delta = calculateDelta(currentVal, baseVal);
        const status = getDeltaStatus(delta);
        if (status.isRegression) {
          hasRegression = true;
        }
        baselineRows.push({
          label: item.label,
          baseline: formatNumber(baseVal, 2) + ' ms',
          current: formatNumber(currentVal, 2) + ' ms',
          delta: formatDelta(delta),
          status: status.text,
          cls: status.cls,
        });
      }
    }
  }

  // Health checks
  let rawChecks = rootGroup.checks;
  let checks = [];
  if (Array.isArray(rawChecks)) {
    checks = rawChecks;
  } else if (rawChecks && typeof rawChecks === 'object') {
    checks = Object.values(rawChecks);
  }

  // Memory telemetry
  const heapUsedMetric = metrics['node_heap_used_mb'];
  const rssMetric = metrics['node_rss_mb'];
  const driftMetric = metrics['node_heap_drift_percent'];
  const leakMetric = metrics['memory_leak_detected'];

  const overallPassed = !hasThresholdFailures && !hasRegression;
  const overallBadgeText = overallPassed ? 'PASSED' : (hasRegression ? 'REGRESSION' : 'FAILED');
  const overallBadgeClass = overallPassed ? 'badge-pass' : 'badge-fail';
  const generatedAt = new Date().toUTCString();

  // SVG Chart rendering for percentiles
  const chartItems = [
    { label: 'p50', val: medDuration || 0, color: '#38bdf8' },
    { label: 'p90', val: p90Duration || 0, color: '#818cf8' },
    { label: 'p95', val: p95Duration || 0, color: (p95Duration && p95Duration > 300) ? '#ef4444' : '#10b981' },
    { label: 'p99', val: p99Duration || 0, color: (p99Duration && p99Duration > 600) ? '#ef4444' : '#f59e0b' },
    { label: 'max', val: maxDuration || 0, color: '#ec4899' },
  ];

  const chartMaxVal = Math.max(...chartItems.map(i => i.val), 10);
  const chartHeight = 180;
  const chartWidth = 500;
  const barWidth = 60;
  const barGap = 35;
  const startX = 30;

  const svgBars = chartItems.map((item, idx) => {
    const barH = Math.max(4, Math.round((item.val / chartMaxVal) * (chartHeight - 40)));
    const x = startX + idx * (barWidth + barGap);
    const y = chartHeight - 25 - barH;
    return `
      <g class="bar-group">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="${item.color}" opacity="0.9">
          <title>${item.label}: ${formatNumber(item.val, 2)} ms</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="#cbd5e1" font-size="12" font-weight="600">${formatNumber(item.val, 1)}ms</text>
        <text x="${x + barWidth / 2}" y="${chartHeight - 8}" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="500">${item.label}</text>
      </g>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | BuggyBooks Performance Report</title>
  <style>
    :root {
      --bg-primary: #0b0f19;
      --bg-secondary: #111827;
      --bg-card: #1e293b;
      --border-color: #334155;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --color-pass: #10b981;
      --color-fail: #ef4444;
      --color-warn: #f59e0b;
      --color-accent: #38bdf8;
      --color-purple: #818cf8;
      --font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-family);
      line-height: 1.5;
      padding: 24px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px 32px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .header-title h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-title p {
      color: var(--text-secondary);
      font-size: 13px;
    }

    .status-badge {
      font-size: 15px;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-pass { background-color: rgba(16, 185, 129, 0.15); color: var(--color-pass); border: 1px solid var(--color-pass); }
    .badge-fail { background-color: rgba(239, 68, 68, 0.15); color: var(--color-fail); border: 1px solid var(--color-fail); }
    .badge-warn { background-color: rgba(245, 158, 11, 0.15); color: var(--color-warn); border: 1px solid var(--color-warn); }
    .badge-info { background-color: rgba(56, 189, 248, 0.15); color: var(--color-accent); border: 1px solid var(--color-accent); }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 18px;
      text-align: center;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }

    .kpi-card:hover {
      border-color: var(--color-accent);
      transform: translateY(-2px);
    }

    .kpi-label {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .kpi-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .kpi-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .section {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }

    .chart-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px 0;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      text-align: left;
    }

    th {
      background-color: rgba(15, 23, 42, 0.6);
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.4);
      color: var(--text-primary);
    }

    tr:last-child td { border-bottom: none; }
    tr:hover td { background-color: rgba(56, 189, 248, 0.03); }

    .tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .progress-bar {
      height: 6px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 4px;
      width: 120px;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--color-pass);
      border-radius: 3px;
    }

    footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
      padding: 24px 0 12px 0;
    }

    @media (max-width: 768px) {
      header { flex-direction: column; gap: 16px; align-items: flex-start; }
      .kpi-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-title">
        <h1>⚡ ${escapeHtml(title)}</h1>
        <p>Executed: ${escapeHtml(generatedAt)} | Engine: k6 v2.2.0 (Portable Node Runner)</p>
      </div>
      <div>
        <span class="status-badge ${overallBadgeClass}">${overallBadgeText}</span>
      </div>
    </header>

    <!-- Executive KPI Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Peak Concurrency</div>
        <div class="kpi-value">${maxVus !== undefined ? maxVus : 'N/A'} <span style="font-size:14px;color:var(--text-secondary)">VUs</span></div>
        <div class="kpi-sub">${totalIterations !== undefined ? `${totalIterations} iterations` : ''}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Requests</div>
        <div class="kpi-value">${totalReqs !== undefined ? Number(totalReqs).toLocaleString() : 'N/A'}</div>
        <div class="kpi-sub">HTTP requests</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Throughput</div>
        <div class="kpi-value" style="color:var(--color-accent)">${formatNumber(rps, 1)}</div>
        <div class="kpi-sub">Requests / second</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">p95 Latency</div>
        <div class="kpi-value" style="color:${(p95Duration && p95Duration > 300) ? 'var(--color-fail)' : 'var(--color-pass)'}">
          ${formatNumber(p95Duration, 1)} <span style="font-size:14px;color:var(--text-secondary)">ms</span>
        </div>
        <div class="kpi-sub">Target: &lt; 300ms</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Error Rate</div>
        <div class="kpi-value" style="color:${failRate > 2.0 ? 'var(--color-fail)' : 'var(--color-pass)'}">
          ${formatNumber(failRate, 2)}%
        </div>
        <div class="kpi-sub">SLA: &lt; 2.00%</div>
      </div>
    </div>

    <!-- Response Latency Distribution Chart -->
    <div class="section">
      <div class="section-title">📊 HTTP Request Duration Percentile Distribution (ms)</div>
      <div class="chart-container">
        <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
          <!-- Horizontal grid lines -->
          <line x1="${startX}" y1="${chartHeight - 25}" x2="${chartWidth - 20}" y2="${chartHeight - 25}" stroke="#334155" stroke-width="1"/>
          ${svgBars}
        </svg>
      </div>
    </div>

    ${baselineRows.length > 0 ? `
    <!-- Baseline Regression Analysis -->
    <div class="section">
      <div class="section-title">📈 Relative Baseline Regression Analysis (Gate Threshold: +${REGRESSION_THRESHOLD_PERCENT.toFixed(1)}%)</div>
      ${isRegressionSimulated ? '<div style="background:rgba(245,158,11,0.1);border:1px solid var(--color-warn);border-radius:6px;padding:10px;margin-bottom:14px;font-size:13px;color:var(--color-warn)">⚠️ <strong>Simulated Regression Mode Active</strong>: Injected +25% latency delta for gate verification.</div>' : ''}
      <table>
        <thead>
          <tr>
            <th>Endpoint / Metric</th>
            <th>Golden Baseline</th>
            <th>Current Result</th>
            <th>Delta (%)</th>
            <th>Gate Status</th>
          </tr>
        </thead>
        <tbody>
          ${baselineRows.map(r => `
          <tr>
            <td><code>${escapeHtml(r.label)}</code></td>
            <td><code>${escapeHtml(r.baseline)}</code></td>
            <td><strong>${escapeHtml(r.current)}</strong></td>
            <td><code>${escapeHtml(r.delta)}</code></td>
            <td><span class="tag ${r.cls}">${escapeHtml(r.status)}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${checks.length > 0 ? `
    <!-- Endpoint Health Checks -->
    <div class="section">
      <div class="section-title">🩺 Endpoint Assertion Health Checks</div>
      <table>
        <thead>
          <tr>
            <th>Health Check Assertion</th>
            <th>Passes</th>
            <th>Fails</th>
            <th>Success Rate</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${checks.map(c => {
            const passes = c.passes || 0;
            const fails = c.fails || 0;
            const total = passes + fails;
            const rate = total > 0 ? ((passes / total) * 100).toFixed(1) : '100.0';
            const ok = fails === 0;
            return `
            <tr>
              <td>${escapeHtml(c.name)}</td>
              <td style="color:var(--color-pass)">${passes}</td>
              <td style="color:${fails > 0 ? 'var(--color-fail)' : 'var(--text-muted)'}">${fails}</td>
              <td>
                ${rate}%
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${rate}%; background-color: ${ok ? 'var(--color-pass)' : 'var(--color-fail)'}"></div>
                </div>
              </td>
              <td><span class="tag ${ok ? 'badge-pass' : 'badge-fail'}">${ok ? 'PASSED' : 'FAILED'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${(heapUsedMetric || rssMetric || driftMetric || leakMetric) ? `
    <!-- Node.js Memory Telemetry -->
    <div class="section">
      <div class="section-title">🧠 Node.js Runtime Memory & Drift Telemetry</div>
      <div class="kpi-grid" style="margin-bottom:0">
        ${heapUsedMetric ? `
        <div class="kpi-card">
          <div class="kpi-label">Heap Used (Avg / Max)</div>
          <div class="kpi-value" style="font-size:20px">${formatNumber(getMetricValue(heapUsedMetric, 'avg'), 1)} / ${formatNumber(getMetricValue(heapUsedMetric, 'max'), 1)} MB</div>
        </div>` : ''}
        ${rssMetric ? `
        <div class="kpi-card">
          <div class="kpi-label">Process RSS (Max)</div>
          <div class="kpi-value" style="font-size:20px">${formatNumber(getMetricValue(rssMetric, 'max'), 1)} MB</div>
        </div>` : ''}
        ${driftMetric ? `
        <div class="kpi-card">
          <div class="kpi-label">Heap Drift %</div>
          <div class="kpi-value" style="font-size:20px; color:${(getMetricValue(driftMetric, 'value') || 0) <= 30 ? 'var(--color-pass)' : 'var(--color-fail)'}">
            ${formatNumber(getMetricValue(driftMetric, 'value') || getMetricValue(driftMetric, 'max'), 1)}%
          </div>
          <div class="kpi-sub">SLA: &le; +30.00%</div>
        </div>` : ''}
        ${leakMetric ? `
        <div class="kpi-card">
          <div class="kpi-label">Memory Leak Tripwire</div>
          <div class="kpi-value" style="font-size:20px; color:${(getMetricValue(leakMetric, 'value') || 0) === 0 ? 'var(--color-pass)' : 'var(--color-fail)'}">
            ${(getMetricValue(leakMetric, 'value') || 0) === 0 ? 'NONE 🟢' : 'BREACH 🔴'}
          </div>
        </div>` : ''}
      </div>
    </div>` : ''}

    ${thresholdRows.length > 0 ? `
    <!-- Threshold Evaluations -->
    <div class="section">
      <div class="section-title">🎯 Threshold Rule Evaluations</div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Rule Definition</th>
            <th>Evaluation</th>
          </tr>
        </thead>
        <tbody>
          ${thresholdRows.map(t => `
          <tr>
            <td><code>${escapeHtml(t.metric)}</code></td>
            <td><code>${escapeHtml(t.threshold)}</code></td>
            <td><span class="tag ${t.passed ? 'badge-pass' : 'badge-fail'}">${t.passed ? 'PASS' : 'FAIL'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <footer>
      BuggyBooks Quality Engineering &bull; Performance Architecture v1.0 &bull; Generated automatically by k6 Performance Suite
    </footer>
  </div>
</body>
</html>`;
}

module.exports = {
  generateHtmlReport,
  formatNumber,
  getMetricValue,
  calculateDelta,
  formatDelta,
  getDeltaStatus,
};

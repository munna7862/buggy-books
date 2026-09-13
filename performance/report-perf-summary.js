#!/usr/bin/env node

/**
 * BuggyBooks k6 Performance Summary Reporter & Relative Baseline Regression Gate
 *
 * Parses k6 summary export JSON, calculates relative deltas against git golden baselines,
 * enforces > +20% latency regression failure exit codes, generates formatted GitHub Step Summaries,
 * and renders interactive, self-contained HTML5 dashboards.
 */

const fs = require('fs');
const path = require('path');
const { generateHtmlReport } = require('./utils/html-reporter.js');
const {
  getGitCommitSha,
  getWorkflowRunId,
  inferTestType,
  appendHistoryRecord,
  analyzeCreepingRegression,
} = require('./utils/history-tracker.js');

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
  if (delta === null || delta === undefined || isNaN(delta)) return { text: 'ℹ️ N/A', isRegression: false };
  if (delta > REGRESSION_THRESHOLD_PERCENT) {
    return { text: `🔴 REGRESSION (${formatDelta(delta)})`, isRegression: true };
  }
  if (delta > WARNING_THRESHOLD_PERCENT) {
    return { text: `🟡 WARNING (${formatDelta(delta)})`, isRegression: false };
  }
  if (delta <= 0) {
    return { text: `🟢 IMPROVED (${formatDelta(delta)})`, isRegression: false };
  }
  return { text: `🟢 PASS (${formatDelta(delta)})`, isRegression: false };
}

function generateMarkdown(summaryData, title, baselineData = null, isRegressionSimulated = false, creepingAnalysis = null) {
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

  // If regression simulation is active, inflate p95 by +25%
  if (isRegressionSimulated && p95Duration !== undefined) {
    p95Duration = p95Duration * 1.25;
  }

  const totalReqs = getMetricValue(httpReqs, 'count');
  const rps = getMetricValue(httpReqs, 'rate');
  const failRate = getMetricValue(httpFailed, 'rate') !== undefined
    ? getMetricValue(httpFailed, 'rate') * 100
    : (getMetricValue(httpFailed, 'value') !== undefined ? getMetricValue(httpFailed, 'value') * 100 : 0);
  const maxVus = getMetricValue(vusMax, 'max') || getMetricValue(vusMax, 'value');

  // Check thresholds for pass/fail
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
          status: !isBreached ? '✅ PASS' : '❌ FAIL',
        });
      }
    }
  }

  // Dynamic Baseline Comparison: Check all duration metrics dynamically
  let hasRegression = false;
  const baselineRows = [];

  if (baselineData) {
    const baseMetrics = baselineData.metrics || baselineData;

    const metricsToCompare = [
      { key: 'http_req_duration', subKey: 'avg', label: 'http_req_duration (avg)', currentVal: avgDuration },
      { key: 'http_req_duration', subKey: 'p(90)', label: 'http_req_duration (p90)', currentVal: p90Duration },
      { key: 'http_req_duration', subKey: 'p(95)', label: 'http_req_duration (p95)', currentVal: p95Duration },
    ];

    // Dynamically add all other custom Trend metrics ending in _duration
    const seenKeys = new Set(['http_req_duration']);
    for (const key of Object.keys(metrics)) {
      if (key.endsWith('_duration') && !seenKeys.has(key)) {
        seenKeys.add(key);
        metricsToCompare.push({
          key,
          subKey: 'p(95)',
          label: `${key} (p95)`,
          currentVal: getMetricValue(metrics[key], 'p(95)'),
        });
      }
    }

    // Also check any baseline duration metrics not present in current metrics
    for (const key of Object.keys(baseMetrics)) {
      if (key.endsWith('_duration') && !seenKeys.has(key)) {
        seenKeys.add(key);
        metricsToCompare.push({
          key,
          subKey: 'p(95)',
          label: `${key} (p95)`,
          currentVal: getMetricValue(metrics[key], 'p(95)'),
        });
      }
    }

    for (const item of metricsToCompare) {
      const baseMetricObj = baseMetrics[item.key];
      const baseVal = getMetricValue(baseMetricObj, item.subKey);

      let currentVal = item.currentVal;
      if (isRegressionSimulated && item.subKey === 'p(95)' && baseVal !== undefined) {
        // Intentionally simulate +25% degradation above baseline
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
        });
      }
    }
  }

  const overallPassed = !hasThresholdFailures && !hasRegression;
  const overallStatus = overallPassed ? '🟢 PASSED' : '🔴 FAILED';

  let md = `\n### ⚡ Performance Benchmark: ${title}\n\n`;
  md += `**Overall Status**: ${overallStatus}${hasRegression ? ' (Regression Gate Breached)' : ''}\n\n`;
  md += `| Benchmark Metric | Measured Result | Target Threshold | Gate Status |\n`;
  md += `| :--- | :--- | :--- | :---: |\n`;
  md += `| **Peak Virtual Users (VUs)** | \`${maxVus ?? 'N/A'}\` VUs | — | ℹ️ |\n`;
  md += `| **Total Requests** | \`${totalReqs ?? 'N/A'}\` reqs | — | ℹ️ |\n`;
  md += `| **Throughput (RPS)** | \`${formatNumber(rps, 1)}\` req/s | — | ℹ️ |\n`;
  md += `| **Average Latency** | \`${formatNumber(avgDuration, 2)}\` ms | — | ℹ️ |\n`;
  md += `| **Median (p50) Latency** | \`${formatNumber(medDuration, 2)}\` ms | — | ℹ️ |\n`;
  md += `| **p95 Latency** | \`${formatNumber(p95Duration, 2)}\` ms | \`< 250ms - 300ms\` | ${p95Duration !== undefined && p95Duration < 300 ? '✅' : '⚠️'} |\n`;
  if (p99Duration !== undefined) {
    md += `| **p99 Latency** | \`${formatNumber(p99Duration, 2)}\` ms | \`< 500ms - 600ms\` | ${p99Duration < 600 ? '✅' : '⚠️'} |\n`;
  } else if (maxDuration !== undefined) {
    md += `| **Max Latency** | \`${formatNumber(maxDuration, 2)}\` ms | \`< 600ms\` | ${maxDuration < 600 ? '✅' : '⚠️'} |\n`;
  }
  md += `| **HTTP Error Rate** | \`${formatNumber(failRate, 2)}%\` | \`< 2.00%\` | ${failRate <= 2.0 ? '✅' : '❌'} |\n`;

  // Baseline Comparison Table
  if (baselineRows.length > 0) {
    md += `\n#### 📊 Relative Baseline Regression Analysis (Gate Threshold: +${REGRESSION_THRESHOLD_PERCENT.toFixed(1)}%)\n\n`;
    if (isRegressionSimulated) {
      md += `> ⚠️ **Simulated Regression Mode Active**: Artificially injected +25% latency delta for gate verification.\n\n`;
    }
    md += `| Metric / Endpoint | Golden Baseline | Current Result | Delta (%) | Gate Status |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: |\n`;
    for (const row of baselineRows) {
      md += `| \`${row.label}\` | \`${row.baseline}\` | \`${row.current}\` | \`${row.delta}\` | ${row.status} |\n`;
    }
    md += `\n`;
  }

  // Checks table
  let rawChecks = rootGroup.checks;
  let checks = [];
  if (Array.isArray(rawChecks)) {
    checks = rawChecks;
  } else if (rawChecks && typeof rawChecks === 'object') {
    checks = Object.values(rawChecks);
  }

  if (checks.length > 0) {
    md += `\n#### Endpoint Health Checks\n\n`;
    md += `| Health Check Assertion | Passes | Fails | Success Rate |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    for (const c of checks) {
      const passes = c.passes || 0;
      const fails = c.fails || 0;
      const total = passes + fails;
      const rate = total > 0 ? ((passes / total) * 100).toFixed(1) : '100.0';
      const icon = fails === 0 ? '✅' : '❌';
      md += `| ${c.name} | ${passes} | ${fails} | ${icon} \`${rate}%\` |\n`;
    }
  }

  // Memory Telemetry Table
  const heapUsedMetric = metrics['node_heap_used_mb'];
  const rssMetric = metrics['node_rss_mb'];
  const driftMetric = metrics['node_heap_drift_percent'];
  const leakMetric = metrics['memory_leak_detected'];

  if (heapUsedMetric || rssMetric || driftMetric || leakMetric) {
    md += `\n#### 🧠 Node.js Runtime Memory & Drift Telemetry\n\n`;
    md += `| Telemetry Metric | Measured Value | Threshold / SLA | Status |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    if (heapUsedMetric) {
      const heapAvg = getMetricValue(heapUsedMetric, 'avg');
      const heapMax = getMetricValue(heapUsedMetric, 'max');
      md += `| **Heap Used (Avg / Max)** | \`${formatNumber(heapAvg, 2)} MB / ${formatNumber(heapMax, 2)} MB\` | — | ℹ️ |\n`;
    }
    if (rssMetric) {
      const rssAvg = getMetricValue(rssMetric, 'avg');
      const rssMax = getMetricValue(rssMetric, 'max');
      md += `| **Process RSS (Avg / Max)** | \`${formatNumber(rssAvg, 2)} MB / ${formatNumber(rssMax, 2)} MB\` | — | ℹ️ |\n`;
    }
    if (driftMetric) {
      const driftVal = getMetricValue(driftMetric, 'value') !== undefined ? getMetricValue(driftMetric, 'value') : (getMetricValue(driftMetric, 'max') !== undefined ? getMetricValue(driftMetric, 'max') : getMetricValue(driftMetric, 'avg'));
      const sign = driftVal > 0 ? '+' : '';
      const driftStatus = (driftVal !== undefined && driftVal <= 30.0) ? '✅ PASS' : '🔴 LEAK DETECTED';
      md += `| **Heap Used Drift** | \`${sign}${formatNumber(driftVal, 2)}%\` | \`≤ +30.00%\` | ${driftStatus} |\n`;
    }
    if (leakMetric) {
      const leakRate = getMetricValue(leakMetric, 'rate') !== undefined ? getMetricValue(leakMetric, 'rate') : getMetricValue(leakMetric, 'value');
      const isBreached = leakRate !== undefined && leakRate > 0;
      const leakStatus = !isBreached ? '✅ NONE' : '🔴 BREACH';
      md += `| **Memory Leak Tripwire** | \`${leakStatus}\` | \`0.00%\` | ${!isBreached ? '✅' : '❌'} |\n`;
    }
    md += `\n`;
  }

  // Node.js Event Loop & CPU Observability Table
  const eventLoopMetric = metrics['node_event_loop_lag_ms'];
  const cpuMetric = metrics['node_cpu_percent'];
  const handlesMetric = metrics['node_active_handles'];

  if (eventLoopMetric || cpuMetric || handlesMetric) {
    md += `\n#### ⚡ Node.js Runtime Telemetry & Event Loop Observability\n\n`;
    md += `| Runtime Diagnostic | Measured Value | Threshold / SLA | Status |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    if (eventLoopMetric) {
      const elP95 = getMetricValue(eventLoopMetric, 'p(95)');
      const elMax = getMetricValue(eventLoopMetric, 'max');
      const isBreached = elP95 !== undefined && elP95 >= 50.0;
      md += `| **Event Loop Lag (p95 / Max)** | \`${formatNumber(elP95, 2)} ms / ${formatNumber(elMax, 2)} ms\` | \`p(95) < 50.00 ms\` | ${!isBreached ? '✅ PASS' : '🔴 FREEZE (≥50ms)'} |\n`;
    }
    if (cpuMetric) {
      const cpuAvg = getMetricValue(cpuMetric, 'avg');
      const cpuMax = getMetricValue(cpuMetric, 'max');
      md += `| **Process CPU % (Avg / Max)** | \`${formatNumber(cpuAvg, 1)}% / ${formatNumber(cpuMax, 1)}%\` | — | ℹ️ |\n`;
    }
    if (handlesMetric) {
      const handlesVal = getMetricValue(handlesMetric, 'value') !== undefined ? getMetricValue(handlesMetric, 'value') : (getMetricValue(handlesMetric, 'max') !== undefined ? getMetricValue(handlesMetric, 'max') : getMetricValue(handlesMetric, 'avg'));
      md += `| **Active libuv Handles** | \`${Math.round(handlesVal || 0)}\` | — | ℹ️ |\n`;
    }
    md += `\n`;
  }

  // Continuous Historical Performance Trajectory & Creeping Regression Table
  if (creepingAnalysis && creepingAnalysis.sampleCount > 0) {
    md += `\n#### 📈 Historical Performance Trajectory & Creeping Regression Analysis\n\n`;
    md += `| Historical Metric | Measured Value | Reference / SLA | Status |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    md += `| **Historical Runs Tracked** | \`${creepingAnalysis.sampleCount}\` | Circular Buffer: 30 runs | ℹ️ |\n`;
    if (creepingAnalysis.sparkline) {
      const minP95 = Math.min(...creepingAnalysis.p95Values).toFixed(1);
      const maxP95 = Math.max(...creepingAnalysis.p95Values).toFixed(1);
      md += `| **p95 Latency Sparkline** | \`${creepingAnalysis.sparkline}\` | \`min: ${minP95}ms, max: ${maxP95}ms\` | ℹ️ |\n`;
    }
    if (creepingAnalysis.rollingAvg !== null && creepingAnalysis.referenceAvg !== null) {
      const sign = creepingAnalysis.delta > 0 ? '+' : '';
      const statusIcon = creepingAnalysis.isCreepingRegression ? '🟡 WARNING' : '✅ STABLE';
      md += `| **5-Run Rolling Average** | \`${formatNumber(creepingAnalysis.rollingAvg, 2)} ms\` | Ref (${creepingAnalysis.referenceType}): \`${formatNumber(creepingAnalysis.referenceAvg, 2)} ms\` | ${statusIcon} (\`${sign}${formatNumber(creepingAnalysis.delta, 2)}%\`) |\n`;
    }
    if (creepingAnalysis.isCreepingRegression) {
      md += `\n> ⚠️ **Creeping Performance Regression Warning**: 5-run rolling average latency has degraded by **+${creepingAnalysis.delta.toFixed(2)}%** against ${creepingAnalysis.referenceType} (SLA Threshold: +10.00%). Single-run threshold has not tripped, but multi-build trend reveals gradual degradation.\n`;
    }
    md += `\n`;
  }

  // Thresholds table
  if (thresholdRows.length > 0) {
    md += `\n#### Threshold Evaluations\n\n`;
    md += `| Metric | Rule | Evaluation |\n`;
    md += `| :--- | :--- | :---: |\n`;
    for (const t of thresholdRows) {
      md += `| \`${t.metric}\` | \`${t.threshold}\` | ${t.status} |\n`;
    }
  }

  md += `\n---\n`;
  return { md, hasThresholdFailures, hasRegression };
}

function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  let summaryJsonPath = null;
  let title = 'API Performance Benchmark';
  let baselinePath = null;
  let isRegressionSimulated = false;
  let htmlPath = null;
  let cleanMarkdown = false;
  let historyPath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--baseline=')) {
      baselinePath = path.resolve(arg.split('=')[1]);
    } else if (arg === '--baseline' && i + 1 < args.length) {
      baselinePath = path.resolve(args[++i]);
    } else if (arg.startsWith('--history=')) {
      historyPath = path.resolve(arg.split('=')[1]);
    } else if (arg === '--history' && i + 1 < args.length) {
      historyPath = path.resolve(args[++i]);
    } else if (arg.startsWith('--html=')) {
      htmlPath = path.resolve(arg.split('=')[1]);
    } else if (arg === '--html' && i + 1 < args.length) {
      htmlPath = path.resolve(args[++i]);
    } else if (arg === '--clean') {
      cleanMarkdown = true;
    } else if (arg === '--regression-test' || arg === '--simulate-regression') {
      isRegressionSimulated = true;
    } else if (!arg.startsWith('--')) {
      if (!summaryJsonPath) {
        summaryJsonPath = path.resolve(arg);
      } else {
        title = arg;
      }
    }
  }

  if (!htmlPath) {
    htmlPath = path.resolve(__dirname, 'report.html');
  }

  if (!historyPath) {
    historyPath = path.resolve(__dirname, 'perf-history.json');
  }

  return { summaryJsonPath, title, baselinePath, isRegressionSimulated, htmlPath, cleanMarkdown, historyPath };
}

function main() {
  const { summaryJsonPath, title, baselinePath, isRegressionSimulated, htmlPath, cleanMarkdown, historyPath } = parseCommandLineArgs();

  if (!summaryJsonPath) {
    console.error('Usage: node report-perf-summary.js <summary-json-path> [benchmark-title] [--baseline=<path>] [--history=<path>] [--html=<path>] [--clean] [--regression-test]');
    process.exit(1);
  }

  if (!fs.existsSync(summaryJsonPath)) {
    console.error(`Error: Summary JSON not found at ${summaryJsonPath}`);
    process.exit(1);
  }

  let summaryData;
  try {
    const raw = fs.readFileSync(summaryJsonPath, 'utf8');
    summaryData = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse k6 summary JSON:`, err.message);
    process.exit(1);
  }

  let baselineData = null;
  if (baselinePath) {
    if (fs.existsSync(baselinePath)) {
      try {
        const rawBaseline = fs.readFileSync(baselinePath, 'utf8');
        baselineData = JSON.parse(rawBaseline);
        console.log(`🔍 Loaded baseline reference from: ${baselinePath}`);
      } catch (err) {
        console.warn(`⚠️ Warning: Failed to parse baseline JSON at ${baselinePath}: ${err.message}`);
      }
    } else {
      console.warn(`⚠️ Warning: Specified baseline file not found at ${baselinePath}. Continuing without baseline comparison.`);
    }
  }

  // Extract core metrics for historical tracking
  const metrics = summaryData.metrics || {};
  const httpDuration = metrics['http_req_duration'] || metrics['http_req_duration{expected_response:true}'] || {};
  const httpReqs = metrics['http_reqs'] || {};
  const httpFailed = metrics['http_req_failed'] || {};
  const p95Duration = getMetricValue(httpDuration, 'p(95)');
  const rps = getMetricValue(httpReqs, 'rate') || 0;
  const failRate = getMetricValue(httpFailed, 'rate') !== undefined
    ? getMetricValue(httpFailed, 'rate') * 100
    : (getMetricValue(httpFailed, 'value') !== undefined ? getMetricValue(httpFailed, 'value') * 100 : 0);

  const elMetric = metrics['node_event_loop_lag_ms'];
  const elP95 = elMetric ? getMetricValue(elMetric, 'p(95)') : undefined;
  const cpuMetric = metrics['node_cpu_percent'];
  const cpuAvg = cpuMetric ? getMetricValue(cpuMetric, 'avg') : undefined;

  const testType = inferTestType(title, summaryJsonPath);
  const currentRecord = {
    timestamp: new Date().toISOString(),
    commit_sha: getGitCommitSha(),
    workflow_run_id: getWorkflowRunId(),
    test_type: testType,
    rps: Number(formatNumber(rps, 2)),
    p95_latency: Number(formatNumber(p95Duration, 2)),
    error_rate: Number(formatNumber(failRate, 2)),
    event_loop_lag_p95: elP95 !== undefined ? Number(formatNumber(elP95, 2)) : undefined,
    cpu_percent: cpuAvg !== undefined ? Number(formatNumber(cpuAvg, 2)) : undefined,
  };

  // Append to perf-history.json
  const historyData = appendHistoryRecord(historyPath, currentRecord);
  console.log(`📊 Persisted benchmark metrics to historical time-series (${historyPath}) [${historyData.history.length} builds recorded]`);

  // Extract baseline p95 for creeping regression analysis if available
  let baselineP95 = null;
  if (baselineData) {
    const baseMetrics = baselineData.metrics || baselineData;
    const baseDuration = baseMetrics['http_req_duration'];
    baselineP95 = getMetricValue(baseDuration, 'p(95)');
  }

  const creepingAnalysis = analyzeCreepingRegression(historyData.history, testType, baselineP95);

  if (creepingAnalysis.isCreepingRegression) {
    console.warn(`\n⚠️  CREEPING REGRESSION DETECTED: 5-run rolling average latency (${creepingAnalysis.rollingAvg.toFixed(2)}ms) degraded by +${creepingAnalysis.delta.toFixed(2)}% against ${creepingAnalysis.referenceType} (SLA Threshold: +10.00%).\n`);
  }

  const { md, hasThresholdFailures, hasRegression } = generateMarkdown(summaryData, title, baselineData, isRegressionSimulated, creepingAnalysis);

  // Print to console
  console.log(md);

  // Generate and save interactive HTML report
  try {
    const htmlContent = generateHtmlReport(summaryData, {
      title,
      baselineData,
      isRegressionSimulated,
      historyData: historyData.history,
      creepingAnalysis,
    });
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`✅ Saved interactive HTML performance report to ${htmlPath}`);

    // Also write to root-level report.html if different
    const rootHtml = path.resolve(process.cwd(), 'report.html');
    if (path.resolve(htmlPath) !== rootHtml) {
      fs.writeFileSync(rootHtml, htmlContent, 'utf8');
    }
  } catch (err) {
    console.warn(`⚠️ Warning: Failed to write HTML report to ${htmlPath}:`, err.message);
  }

  // Append to GITHUB_STEP_SUMMARY if present
  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryFile) {
    try {
      fs.appendFileSync(stepSummaryFile, md, 'utf8');
      console.log(`✅ Appended performance summary to GITHUB_STEP_SUMMARY (${stepSummaryFile})`);
    } catch (err) {
      console.warn(`⚠️ Failed to write to GITHUB_STEP_SUMMARY:`, err.message);
    }
  }

  // Write to local markdown artifact file (rotate if cleanMarkdown requested)
  const artifactPath = path.resolve(__dirname, 'k6-summary.md');
  try {
    if (cleanMarkdown) {
      fs.writeFileSync(artifactPath, `# BuggyBooks k6 Performance Summary\n\nGenerated: ${new Date().toISOString()}\n\n`, 'utf8');
    }
    fs.appendFileSync(artifactPath, md, 'utf8');
    console.log(`✅ Saved performance summary artifact to ${artifactPath}`);
  } catch (err) {
    console.warn(`⚠️ Failed to write to ${artifactPath}:`, err.message);
  }

  if (hasRegression) {
    console.error(`❌ Performance Baseline Regression Gate Breached! Latency degraded by more than +${REGRESSION_THRESHOLD_PERCENT}% against golden baseline.`);
    process.exit(1);
  }

  if (hasThresholdFailures) {
    console.error(`❌ k6 benchmark failed threshold checks!`);
    process.exit(1);
  }

  console.log(`✨ All performance assertions and baseline regression checks PASSED.`);
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdown, calculateDelta, formatDelta, getDeltaStatus };

#!/usr/bin/env node

/**
 * BuggyBooks k6 Performance Summary Reporter
 *
 * Parses k6 summary export JSON and generates formatted GitHub Step Summaries ($GITHUB_STEP_SUMMARY)
 * and downloadable markdown report artifacts.
 */

const fs = require('fs');
const path = require('path');

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

function generateMarkdown(summaryData, title) {
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
  const p95Duration = getMetricValue(httpDuration, 'p(95)');
  const p99Duration = getMetricValue(httpDuration, 'p(99)');
  const maxDuration = getMetricValue(httpDuration, 'max');

  const totalReqs = getMetricValue(httpReqs, 'count');
  const rps = getMetricValue(httpReqs, 'rate');
  const failRate = getMetricValue(httpFailed, 'rate') !== undefined ? getMetricValue(httpFailed, 'rate') * 100 : (getMetricValue(httpFailed, 'value') !== undefined ? getMetricValue(httpFailed, 'value') * 100 : 0);
  const maxVus = getMetricValue(vusMax, 'max') || getMetricValue(vusMax, 'value');
  const totalIters = getMetricValue(iterations, 'count');

  // Check thresholds for pass/fail
  // In k6 summary JSON:
  // - If boolean: `false` means not breached (PASSED), `true` means breached (FAILED).
  // - If object: `ok: true` (PASSED) or `ok: false` (FAILED).
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

  const overallStatus = hasThresholdFailures ? '🔴 FAILED' : '🟢 PASSED';

  let md = `\n### ⚡ Performance Benchmark: ${title}\n\n`;
  md += `**Overall Status**: ${overallStatus}\n\n`;
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
  return { md, hasThresholdFailures };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node report-perf-summary.js <summary-json-path> [benchmark-title]');
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);
  const title = args[1] || 'API Performance Benchmark';

  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Summary JSON not found at ${jsonPath}`);
    process.exit(1);
  }

  let summaryData;
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    summaryData = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse k6 summary JSON:`, err.message);
    process.exit(1);
  }

  const { md, hasThresholdFailures } = generateMarkdown(summaryData, title);

  // Print to console
  console.log(md);

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

  // Also write to local markdown artifact file
  const artifactPath = path.resolve(__dirname, 'k6-summary.md');
  try {
    fs.appendFileSync(artifactPath, md, 'utf8');
    console.log(`✅ Saved performance summary artifact to ${artifactPath}`);
  } catch (err) {
    console.warn(`⚠️ Failed to write to ${artifactPath}:`, err.message);
  }

  if (hasThresholdFailures) {
    console.error(`❌ k6 benchmark failed threshold checks!`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdown };

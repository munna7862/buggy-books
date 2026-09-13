#!/usr/bin/env node

/**
 * BuggyBooks Automated Performance Baseline Recalibrator
 *
 * Extracts verified metrics from k6 summary JSON exports, recalibrates golden baselines
 * in performance/baselines/, updates commit/date metadata, and outputs Old vs New
 * comparison diff tables for automated Pull Requests and Step Summaries.
 */

const fs = require('fs');
const path = require('path');
const { getGitCommitSha } = require('./utils/history-tracker.js');

const TIER_MAPPINGS = {
  smoke: {
    summaryFile: 'perf-summary-smoke.json',
    baselineFile: 'baseline-smoke.json',
    description: 'BuggyBooks PR API Smoke Golden Baseline (5 VUs)',
    script: 'performance/k6/smoke-load.js',
  },
  catalog: {
    summaryFile: 'perf-summary-catalog.json',
    baselineFile: 'baseline-catalog.json',
    description: 'BuggyBooks Main Catalog Load Golden Baseline (50 VUs)',
    script: 'performance/k6/catalog-load.js',
  },
  inventory: {
    summaryFile: 'perf-summary-inventory.json',
    baselineFile: 'baseline-inventory.json',
    description: 'BuggyBooks Inventory Stress Golden Baseline (30 VUs)',
    script: 'performance/k6/inventory-stress.js',
  },
  journey: {
    summaryFile: 'perf-summary-journey.json',
    baselineFile: 'baseline-journey.json',
    description: 'BuggyBooks E-Commerce User Journey Golden Baseline (50 VUs)',
    script: 'performance/scenarios/ecommerce-journey.js',
  },
  auth: {
    summaryFile: 'perf-summary-auth.json',
    baselineFile: 'baseline-auth.json',
    description: 'BuggyBooks Authentication Burst Golden Baseline (40 VUs)',
    script: 'performance/k6/auth-stress.js',
  },
  checkout: {
    summaryFile: 'perf-summary-checkout.json',
    baselineFile: 'baseline-checkout.json',
    description: 'BuggyBooks Checkout Contention Golden Baseline (100 VUs)',
    script: 'performance/k6/checkout-stress.js',
  },
  soak: {
    summaryFile: 'perf-summary-soak.json',
    baselineFile: 'baseline-soak.json',
    description: 'BuggyBooks Endurance Soak Golden Baseline (25 VUs)',
    script: 'performance/scenarios/soak-load.js',
  },
};

function formatNum(val, decimals = 2) {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return Number(val).toFixed(decimals);
}

function extractMetricVal(metric, key) {
  if (!metric) return undefined;
  if (metric.values && metric.values[key] !== undefined) return metric.values[key];
  if (metric[key] !== undefined) return metric[key];
  return undefined;
}

function buildDurationObject(metricObj) {
  if (!metricObj) return null;
  const avg = extractMetricVal(metricObj, 'avg');
  const med = extractMetricVal(metricObj, 'med');
  const p90 = extractMetricVal(metricObj, 'p(90)');
  const p95 = extractMetricVal(metricObj, 'p(95)');
  const p99 = extractMetricVal(metricObj, 'p(99)');
  const max = extractMetricVal(metricObj, 'max');

  const obj = {};
  if (avg !== undefined) obj.avg = Number(Number(avg).toFixed(2));
  if (med !== undefined) obj.med = Number(Number(med).toFixed(2));
  if (p90 !== undefined) obj['p(90)'] = Number(Number(p90).toFixed(2));
  if (p95 !== undefined) obj['p(95)'] = Number(Number(p95).toFixed(2));
  if (p99 !== undefined) obj['p(99)'] = Number(Number(p99).toFixed(2));
  if (max !== undefined) obj.max = Number(Number(max).toFixed(2));
  return obj;
}

function recalibrateTier(tierKey, customSummaryPath = null) {
  const config = TIER_MAPPINGS[tierKey];
  if (!config) {
    throw new Error(`Unknown performance tier: "${tierKey}". Valid choices: ${Object.keys(TIER_MAPPINGS).join(', ')}`);
  }

  const baseDir = path.resolve(__dirname, 'baselines');
  const baselinePath = path.join(baseDir, config.baselineFile);
  const summaryPath = customSummaryPath
    ? path.resolve(customSummaryPath)
    : path.resolve(process.cwd(), config.summaryFile);

  if (!fs.existsSync(summaryPath)) {
    throw new Error(`Summary JSON not found for tier "${tierKey}" at ${summaryPath}. Ensure k6 run completed.`);
  }

  const rawSummary = fs.readFileSync(summaryPath, 'utf8');
  const summaryData = JSON.parse(rawSummary);
  const metrics = summaryData.metrics || {};

  // Read existing baseline if present
  let oldBaseline = null;
  if (fs.existsSync(baselinePath)) {
    try {
      oldBaseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    } catch {
      // ignore
    }
  }

  // Construct new metrics
  const newMetrics = {};

  const httpReqDuration = metrics['http_req_duration'] || metrics['http_req_duration{expected_response:true}'];
  if (httpReqDuration) {
    newMetrics.http_req_duration = buildDurationObject(httpReqDuration);
  }

  // Discover all custom duration trends
  for (const [key, metric] of Object.entries(metrics)) {
    if (key.endsWith('_duration') && key !== 'http_req_duration') {
      const durObj = buildDurationObject(metric);
      if (durObj) {
        newMetrics[key] = durObj;
      }
    }
  }

  // Error rate
  const failedMetric = metrics['http_req_failed'];
  if (failedMetric) {
    const rate = extractMetricVal(failedMetric, 'rate') !== undefined
      ? extractMetricVal(failedMetric, 'rate')
      : extractMetricVal(failedMetric, 'value');
    newMetrics.http_req_failed = {
      rate: Number(Number(rate || 0).toFixed(4)),
    };
  }

  // Throughput (RPS)
  const reqsMetric = metrics['http_reqs'];
  if (reqsMetric) {
    const rate = extractMetricVal(reqsMetric, 'rate');
    if (rate !== undefined) {
      newMetrics.http_reqs = {
        rate: Number(Number(rate).toFixed(1)),
      };
    }
  }

  const commitSha = getGitCommitSha();
  const environment = process.env.CI ? 'CI/Linux-x64' : 'Local/Clean-Container';

  const newBaseline = {
    description: config.description,
    version: oldBaseline && oldBaseline.version ? bumpMinorVersion(oldBaseline.version) : '1.1.0',
    generated_at: new Date().toISOString(),
    commit_sha: commitSha,
    environment,
    metrics: newMetrics,
  };

  fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2) + '\n', 'utf8');

  // Format comparison diff table
  const diffTable = generateDiffMarkdown(tierKey, oldBaseline, newBaseline);
  return { tierKey, baselinePath, oldBaseline, newBaseline, diffTable };
}

function bumpMinorVersion(versionStr = '1.0.0') {
  const parts = versionStr.split('.').map(p => parseInt(p, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    parts[1] += 1;
    return parts.join('.');
  }
  return '1.1.0';
}

function generateDiffMarkdown(tierKey, oldBaseline, newBaseline) {
  let md = `### 🎯 Baseline Recalibration Diff: \`${tierKey}\`\n\n`;
  md += `**Timestamp**: ${newBaseline.generated_at} | **Commit**: \`${newBaseline.commit_sha}\` | **Version**: \`${newBaseline.version}\`\n\n`;
  md += `| Metric / Percentile | Old Baseline | New Baseline | Delta (%) | Status |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: |\n`;

  const oldMetrics = (oldBaseline && oldBaseline.metrics) ? oldBaseline.metrics : {};
  const newMetrics = newBaseline.metrics || {};

  const keysToCheck = [
    { key: 'http_req_duration', subKey: 'avg', label: 'http_req_duration (avg)' },
    { key: 'http_req_duration', subKey: 'p(95)', label: 'http_req_duration (p95)' },
    { key: 'http_req_duration', subKey: 'p(99)', label: 'http_req_duration (p99)' },
  ];

  for (const [metricKey, metricVal] of Object.entries(newMetrics)) {
    if (metricKey.endsWith('_duration') && metricKey !== 'http_req_duration') {
      keysToCheck.push({ key: metricKey, subKey: 'p(95)', label: `${metricKey} (p95)` });
    }
  }

  for (const item of keysToCheck) {
    const oldVal = (oldMetrics[item.key] && oldMetrics[item.key][item.subKey] !== undefined)
      ? oldMetrics[item.key][item.subKey]
      : undefined;
    const newVal = (newMetrics[item.key] && newMetrics[item.key][item.subKey] !== undefined)
      ? newMetrics[item.key][item.subKey]
      : undefined;

    if (newVal !== undefined) {
      let deltaStr = '—';
      let statusStr = '🆕 NEW';
      if (oldVal !== undefined && oldVal > 0) {
        const delta = ((newVal - oldVal) / oldVal) * 100;
        const sign = delta > 0 ? '+' : '';
        deltaStr = `${sign}${delta.toFixed(2)}%`;
        statusStr = delta <= 0 ? '🟢 IMPROVED' : (delta <= 10 ? '🟡 WITHIN 10%' : '🔴 DEGRADED');
      }
      md += `| \`${item.label}\` | \`${oldVal !== undefined ? formatNum(oldVal, 2) + ' ms' : '—'}\` | \`${formatNum(newVal, 2)} ms\` | \`${deltaStr}\` | ${statusStr} |\n`;
    }
  }

  md += `\n---\n`;
  return md;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || ['--help', '-h'].includes(args[0])) {
    console.log(`
Usage: node recalibrate-baselines.js <tier> [summary-json-path]

Supported Tiers:
  all         Recalibrate all tiers with available summary JSON exports
  smoke       PR API Smoke Benchmark (baseline-smoke.json)
  catalog     Main Catalog Load Benchmark (baseline-catalog.json)
  inventory   Inventory Stress Benchmark (baseline-inventory.json)
  journey     E-Commerce User Journey Benchmark (baseline-journey.json)
  auth        Authentication Burst Benchmark (baseline-auth.json)
  checkout    Checkout Contention Benchmark (baseline-checkout.json)
  soak        Endurance Soak Benchmark (baseline-soak.json)
`);
    process.exit(0);
  }

  const targetTier = args[0].toLowerCase();
  const customSummary = args[1] || null;

  const tiersToRun = targetTier === 'all'
    ? Object.keys(TIER_MAPPINGS)
    : [targetTier];

  let combinedMarkdown = `# 🎯 Automated Performance Golden Baseline Recalibration\n\n`;
  let successCount = 0;

  for (const tier of tiersToRun) {
    try {
      const summaryFile = customSummary || TIER_MAPPINGS[tier].summaryFile;
      if (targetTier === 'all' && !fs.existsSync(summaryFile)) {
        console.log(`⏩ Skipping tier "${tier}": ${summaryFile} not found.`);
        continue;
      }

      console.log(`⚙️ Recalibrating baseline for tier: ${tier}...`);
      const result = recalibrateTier(tier, customSummary);
      combinedMarkdown += result.diffTable + '\n';
      successCount++;
      console.log(`✅ Successfully updated ${result.baselinePath}`);
    } catch (err) {
      console.error(`❌ Failed to recalibrate tier "${tier}":`, err.message);
      if (targetTier !== 'all') {
        process.exit(1);
      }
    }
  }

  console.log('\n' + combinedMarkdown);

  // Write diff to Step Summary if available
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, combinedMarkdown, 'utf8');
      console.log('✅ Appended recalibration diff to GITHUB_STEP_SUMMARY');
    } catch (e) {
      console.warn('⚠️ Could not write to GITHUB_STEP_SUMMARY:', e.message);
    }
  }

  console.log(`🎉 Recalibration complete. ${successCount} baseline(s) updated.`);
}

if (require.main === module) {
  main();
}

module.exports = { recalibrateTier, TIER_MAPPINGS, generateDiffMarkdown };

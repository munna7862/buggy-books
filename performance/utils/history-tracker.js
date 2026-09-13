/**
 * BuggyBooks Performance History Tracker & Creeping Regression Engine
 *
 * Persists benchmark time-series metrics into perf-history.json, computes multi-run
 * 5-build rolling averages, detects creeping regressions (> +10%), and generates
 * sparklines for CLI/GitHub Step Summaries and interactive HTML charts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CREEPING_REGRESSION_THRESHOLD = 10.0;
const MAX_HISTORY_RECORDS = 30;

function getGitCommitSha() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.substring(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'local';
  }
}

function getWorkflowRunId() {
  return process.env.GITHUB_RUN_ID || 'local';
}

function inferTestType(title = '', filePath = '') {
  const combined = `${title} ${filePath}`.toLowerCase();
  if (combined.includes('smoke')) return 'smoke';
  if (combined.includes('catalog')) return 'catalog';
  if (combined.includes('inventory')) return 'inventory';
  if (combined.includes('journey') || combined.includes('ecommerce')) return 'journey';
  if (combined.includes('auth')) return 'auth';
  if (combined.includes('checkout')) return 'checkout';
  if (combined.includes('soak') || combined.includes('endurance')) return 'soak';
  if (combined.includes('breakpoint') || combined.includes('saturation')) return 'breakpoint';
  return 'general';
}

function loadHistory(historyPath) {
  const targetPath = historyPath || path.resolve(__dirname, '..', 'perf-history.json');
  if (!fs.existsSync(targetPath)) {
    return {
      version: '1.0.0',
      updated_at: new Date().toISOString(),
      history: [],
    };
  }

  try {
    const raw = fs.readFileSync(targetPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        version: '1.0.0',
        updated_at: new Date().toISOString(),
        history: parsed,
      };
    }
    if (parsed && Array.isArray(parsed.history)) {
      return parsed;
    }
    return {
      version: '1.0.0',
      updated_at: new Date().toISOString(),
      history: [],
    };
  } catch (err) {
    console.warn(`⚠️ Warning: Failed to parse history file at ${targetPath}:`, err.message);
    return {
      version: '1.0.0',
      updated_at: new Date().toISOString(),
      history: [],
    };
  }
}

function saveHistory(historyObj, historyPath) {
  const targetPath = historyPath || path.resolve(__dirname, '..', 'perf-history.json');
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    historyObj.updated_at = new Date().toISOString();
    fs.writeFileSync(targetPath, JSON.stringify(historyObj, null, 2) + '\n', 'utf8');
    return true;
  } catch (err) {
    console.warn(`⚠️ Warning: Failed to save history to ${targetPath}:`, err.message);
    return false;
  }
}

function appendHistoryRecord(historyPath, record, maxRecords = MAX_HISTORY_RECORDS) {
  const historyData = loadHistory(historyPath);
  historyData.history.push(record);

  // Retain only the last maxRecords
  if (historyData.history.length > maxRecords) {
    historyData.history = historyData.history.slice(-maxRecords);
  }

  saveHistory(historyData, historyPath);
  return historyData;
}

/**
 * Calculates 5-run rolling average and detects creeping regression.
 *
 * @param {Array} history Array of historical records
 * @param {string} testType Target test type
 * @param {number} [baselineP95] Optional golden baseline p95 for comparison
 * @param {number} [windowSize=5] Rolling window size
 */
function analyzeCreepingRegression(history, testType, baselineP95 = null, windowSize = 5) {
  const typeHistory = history.filter(r => r.test_type === testType);
  if (typeHistory.length === 0) {
    return {
      isCreepingRegression: false,
      sampleCount: 0,
      rollingAvg: null,
      referenceAvg: null,
      delta: null,
      sparkline: '',
      historySlice: [],
    };
  }

  const p95Values = typeHistory.map(r => Number(r.p95_latency) || 0);
  const sparkline = generateAsciiSparkline(p95Values);

  // If fewer than windowSize runs, we can only compare current rolling avg to baseline if available
  const recentSlice = typeHistory.slice(-windowSize);
  const rollingAvg = recentSlice.reduce((sum, r) => sum + (Number(r.p95_latency) || 0), 0) / recentSlice.length;

  let referenceAvg = null;
  let referenceType = 'previous-window';

  if (typeHistory.length >= windowSize * 2) {
    const prevSlice = typeHistory.slice(-windowSize * 2, -windowSize);
    referenceAvg = prevSlice.reduce((sum, r) => sum + (Number(r.p95_latency) || 0), 0) / prevSlice.length;
    referenceType = `previous ${windowSize}-run window`;
  } else if (baselineP95 !== null && baselineP95 !== undefined && baselineP95 > 0) {
    referenceAvg = Number(baselineP95);
    referenceType = 'golden baseline';
  } else if (typeHistory.length > 1) {
    // Earlier runs before the recent slice
    const olderSlice = typeHistory.slice(0, Math.max(1, typeHistory.length - 1));
    referenceAvg = olderSlice.reduce((sum, r) => sum + (Number(r.p95_latency) || 0), 0) / olderSlice.length;
    referenceType = 'historical average';
  }

  let delta = null;
  let isCreepingRegression = false;

  if (referenceAvg !== null && referenceAvg > 0) {
    delta = ((rollingAvg - referenceAvg) / referenceAvg) * 100;
    // Creeping regression triggers if 5-run rolling average degrades by more than 10%
    if (delta > CREEPING_REGRESSION_THRESHOLD && typeHistory.length >= 3) {
      isCreepingRegression = true;
    }
  }

  return {
    isCreepingRegression,
    sampleCount: typeHistory.length,
    rollingAvg,
    referenceAvg,
    referenceType,
    delta,
    sparkline,
    p95Values,
    historySlice: typeHistory.slice(-15),
  };
}

/**
 * Generates an ASCII sparkline representation from numeric array.
 * e.g. [ ▂▃▄▅▆▇█]
 */
function generateAsciiSparkline(numbers) {
  if (!numbers || numbers.length === 0) return '';
  const ticks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  if (min === max) return ticks[3].repeat(numbers.length);

  return numbers.map(n => {
    const ratio = (n - min) / (max - min);
    const idx = Math.min(ticks.length - 1, Math.max(0, Math.floor(ratio * (ticks.length - 1))));
    return ticks[idx];
  }).join('');
}

module.exports = {
  CREEPING_REGRESSION_THRESHOLD,
  MAX_HISTORY_RECORDS,
  getGitCommitSha,
  getWorkflowRunId,
  inferTestType,
  loadHistory,
  saveHistory,
  appendHistoryRecord,
  analyzeCreepingRegression,
  generateAsciiSparkline,
};

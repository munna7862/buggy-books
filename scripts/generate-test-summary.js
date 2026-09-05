#!/usr/bin/env node

/**
 * BuggyBooks Automated Test & Coverage Summary Generator
 *
 * Parses test-results.json and coverage/coverage-summary.json to generate
 * formatted markdown summary tables for GitHub Actions Step Summaries ($GITHUB_STEP_SUMMARY).
 */

const fs = require('fs');
const path = require('path');

function formatPercent(val) {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return `${Number(val).toFixed(2)}%`;
}

function getStatusBadge(pct, target = 60) {
  if (pct === undefined || isNaN(pct)) return '—';
  return pct >= target ? '🟢' : '🟡';
}

function generateSummary(target, workDir) {
  const dir = path.resolve(workDir || target);
  const resultsPath = path.join(dir, 'test-results.json');
  const coveragePath = path.join(dir, 'coverage', 'coverage-summary.json');

  const title = target.charAt(0).toUpperCase() + target.slice(1);
  const testRunner = target.toLowerCase() === 'backend' ? 'Jest' : 'Vitest';

  let results = null;
  if (fs.existsSync(resultsPath)) {
    try {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    } catch (err) {
      console.warn(`Could not parse ${resultsPath}:`, err.message);
    }
  }

  let coverage = null;
  if (fs.existsSync(coveragePath)) {
    try {
      coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    } catch (err) {
      console.warn(`Could not parse ${coveragePath}:`, err.message);
    }
  }

  const passedSuites = results?.numPassedTestSuites ?? 'N/A';
  const failedSuites = results?.numFailedTestSuites ?? 0;
  const totalSuites = results?.numTotalTestSuites ?? 'N/A';

  const passedTests = results?.numPassedTests ?? 'N/A';
  const failedTests = results?.numFailedTests ?? 0;
  const pendingTests = results?.numPendingTests ?? 0;
  const totalTests = results?.numTotalTests ?? 'N/A';

  const isPassing = failedSuites === 0 && failedTests === 0 && (results?.success !== false);
  const statusBadge = isPassing ? '🟢 PASSED' : '🔴 FAILED';

  const covTotal = coverage?.total || {};
  const stmtsPct = covTotal.statements?.pct;
  const branchPct = covTotal.branches?.pct;
  const funcsPct = covTotal.functions?.pct;
  const linesPct = covTotal.lines?.pct;

  let md = `\n### 🧪 ${title} Automated Test & Coverage Summary (${testRunner})\n\n`;
  md += `**Overall Status**: ${statusBadge}\n\n`;

  md += `#### Test Suite Execution\n\n`;
  md += `| Metric | Passed | Failed | Skipped / Pending | Total |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: |\n`;
  md += `| **Test Suites / Files** | \`${passedSuites}\` | \`${failedSuites}\` | \`0\` | \`${totalSuites}\` |\n`;
  md += `| **Individual Tests** | \`${passedTests}\` | \`${failedTests}\` | \`${pendingTests}\` | \`${totalTests}\` |\n\n`;

  if (coverage && covTotal) {
    md += `#### Code Coverage Metrics\n\n`;
    md += `| Coverage Category | Percentage | Covered / Total | Health Status |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    md += `| **Statements** | \`${formatPercent(stmtsPct)}\` | ${covTotal.statements?.covered ?? 0} / ${covTotal.statements?.total ?? 0} | ${getStatusBadge(stmtsPct, 70)} |\n`;
    md += `| **Branches** | \`${formatPercent(branchPct)}\` | ${covTotal.branches?.covered ?? 0} / ${covTotal.branches?.total ?? 0} | ${getStatusBadge(branchPct, 60)} |\n`;
    md += `| **Functions** | \`${formatPercent(funcsPct)}\` | ${covTotal.functions?.covered ?? 0} / ${covTotal.functions?.total ?? 0} | ${getStatusBadge(funcsPct, 70)} |\n`;
    md += `| **Lines** | \`${formatPercent(linesPct)}\` | ${covTotal.lines?.covered ?? 0} / ${covTotal.lines?.total ?? 0} | ${getStatusBadge(linesPct, 70)} |\n`;
  }

  md += `\n---\n`;
  return { md, isPassing };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/generate-test-summary.js <backend|frontend> [working-directory]');
    process.exit(1);
  }

  const target = args[0];
  const workDir = args[1] || target;

  const { md, isPassing } = generateSummary(target, workDir);

  // Print to console
  console.log(md);

  // Append to GITHUB_STEP_SUMMARY if available
  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryFile) {
    try {
      fs.appendFileSync(stepSummaryFile, md, 'utf8');
      console.log(`✅ Appended ${target} test summary to GITHUB_STEP_SUMMARY (${stepSummaryFile})`);
    } catch (err) {
      console.warn(`⚠️ Failed to write to GITHUB_STEP_SUMMARY:`, err.message);
    }
  }

  if (!isPassing) {
    console.error(`❌ ${target} test suite reported failures!`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateSummary };

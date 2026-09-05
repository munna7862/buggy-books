#!/usr/bin/env node

/**
 * BuggyBooks Playwright Test Summary & Failure Triage Generator
 *
 * Parses Playwright JSON test results to output high-visibility markdown tables
 * directly into GitHub Actions Step Summaries ($GITHUB_STEP_SUMMARY), highlighting
 * total, passed, failed, and flaky counts with root-cause error diagnostics
 * and failure trace artifact guidance.
 */

const fs = require('fs');
const path = require('path');

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return '0s';
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

function cleanErrorMessage(msg) {
  if (!msg) return 'Unknown error';
  // Strip ANSI color codes
  const stripped = msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  // Keep first 2 lines
  const lines = stripped.split('\n').filter(l => l.trim().length > 0);
  const summary = lines.slice(0, 2).join(' — ').trim();
  return summary.length > 250 ? summary.substring(0, 247) + '...' : summary;
}

function extractSpecs(suite, failures = [], allSpecs = []) {
  if (!suite) return;

  if (suite.specs && Array.isArray(suite.specs)) {
    for (const spec of suite.specs) {
      allSpecs.push(spec);
      for (const test of spec.tests || []) {
        if (test.status === 'unexpected') {
          for (const result of test.results || []) {
            if (result.status === 'failed' || result.status === 'timedOut') {
              const errMsg = result.errors && result.errors.length > 0
                ? result.errors[0].message
                : (result.error ? result.error.message : 'Test failed without explicit message');
              failures.push({
                title: spec.title,
                file: spec.file || suite.file || 'unknown',
                projectName: test.projectName || 'default',
                error: cleanErrorMessage(errMsg),
                duration: result.duration || 0,
              });
            }
          }
        }
      }
    }
  }

  if (suite.suites && Array.isArray(suite.suites)) {
    for (const childSuite of suite.suites) {
      extractSpecs(childSuite, failures, allSpecs);
    }
  }
}

function generateMarkdown(results, title, artifactName = 'playwright-traces') {
  const stats = results.stats || {};
  const expected = stats.expected || 0;
  const unexpected = stats.unexpected || 0;
  const flaky = stats.flaky || 0;
  const skipped = stats.skipped || 0;
  const total = (stats.total !== undefined) ? stats.total : (expected + unexpected + flaky + skipped);
  const duration = stats.duration || 0;

  const isPassing = unexpected === 0;
  const statusBadge = isPassing ? '🟢 PASSED' : '🔴 FAILED';

  const failures = [];
  const allSpecs = [];
  if (results.suites && Array.isArray(results.suites)) {
    for (const rootSuite of results.suites) {
      extractSpecs(rootSuite, failures, allSpecs);
    }
  }

  let md = `\n### 🎭 Playwright Quality Gate Summary: ${title}\n\n`;
  md += `**Execution Status**: ${statusBadge} ${isPassing ? '— All assertions satisfied' : `— (${unexpected} failures detected)`}\n\n`;

  md += `| Total Tests | Passed | Failed | Flaky | Skipped | Total Duration |\n`;
  md += `| :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  md += `| \`${total}\` | \`${expected}\` | \`${unexpected}\` | \`${flaky}\` | \`${skipped}\` | \`${formatDuration(duration)}\` |\n\n`;

  if (failures.length > 0) {
    md += `#### ❌ Failing Tests Root-Cause Diagnostics\n\n`;
    md += `> 💡 **Triage Action**: Download the \`${artifactName}\` artifact zip and run \`npx playwright show-trace <trace.zip>\` to inspect DOM snapshots, console logs, and network waterfalls.\n\n`;
    md += `| Failing Spec Title | File | Project | Error Diagnosis | Artifacts |\n`;
    md += `| :--- | :--- | :---: | :--- | :---: |\n`;
    for (const f of failures) {
      const relFile = f.file.replace(/\\/g, '/').split('playwright-e2e/').pop();
      md += `| **${f.title}** | \`${relFile}\` | \`${f.projectName}\` | \`${f.error}\` | 🔍 Trace Zip |\n`;
    }
    md += `\n`;
  }

  md += `---\n`;
  return { md, isPassing };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/generate-playwright-summary.js <results-json-path> [job-title] [artifact-name]');
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);
  const title = args[1] || 'Playwright Test Run';
  const artifactName = args[2] || 'playwright-traces';

  if (!fs.existsSync(jsonPath)) {
    console.warn(`Warning: Playwright results JSON not found at ${jsonPath}. Generating fallback summary.`);
    const fallbackMd = `\n### 🎭 Playwright Quality Gate Summary: ${title}\n\n⚠️ No JSON test report found at \`${jsonPath}\`.\n\n---\n`;
    const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (stepSummaryFile) {
      fs.appendFileSync(stepSummaryFile, fallbackMd, 'utf8');
    }
    console.log(fallbackMd);
    return;
  }

  let results;
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    results = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse Playwright results JSON:`, err.message);
    process.exit(1);
  }

  const { md, isPassing } = generateMarkdown(results, title, artifactName);

  console.log(md);

  const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryFile) {
    try {
      fs.appendFileSync(stepSummaryFile, md, 'utf8');
      console.log(`✅ Appended Playwright summary to GITHUB_STEP_SUMMARY`);
    } catch (err) {
      console.warn(`⚠️ Failed to write to GITHUB_STEP_SUMMARY:`, err.message);
    }
  }

  if (!isPassing) {
    console.error(`❌ Playwright test run failed with unexpected test failures.`);
    // Do not exit with 1 here; let Playwright command's own exit code control the job step
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdown, cleanErrorMessage };

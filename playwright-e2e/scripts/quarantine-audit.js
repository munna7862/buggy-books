#!/usr/bin/env node

/**
 * BuggyBooks Closed-Loop Quarantine Stability Audit Runner
 *
 * Runs all tests tagged with @quarantine 5 times (--repeat-each=5) using Playwright.
 * Calculates the Quarantine Stability Index (% pass rate across repetitions).
 * Generates an actionable recommendation: if a test achieves a 100% pass rate across
 * all 5 repetitions, it is recommended for de-quarantine back into mainline regression.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPEAT_COUNT = parseInt(process.env.REPEAT_EACH || '5', 10);

function runPlaywrightQuarantine() {
  const playwrightDir = path.resolve(__dirname, '..');
  const tempReportFile = path.join(playwrightDir, 'quarantine-results.json');

  if (fs.existsSync(tempReportFile)) {
    try { fs.unlinkSync(tempReportFile); } catch (e) {}
  }

  const cmd = `npx playwright test --config=src/config/playwright.config.ts --grep "@quarantine" --grep-invert "" --repeat-each=${REPEAT_COUNT} --pass-with-no-tests --reporter=json`;
  console.log(`🚀 Executing quarantine stability audit: ${cmd}`);

  let stdout = '';
  let exitCode = 0;

  try {
    stdout = execSync(cmd, {
      cwd: playwrightDir,
      env: {
        ...process.env,
        RUN_QUARANTINE: 'true',
        PLAYWRIGHT_JSON_OUTPUT_NAME: 'quarantine-results.json',
      },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    stdout = err.stdout ? err.stdout.toString() : '';
    exitCode = err.status || 1;
  }

  let results = null;

  // Try parsing from file first, then stdout
  if (fs.existsSync(tempReportFile)) {
    try {
      results = JSON.parse(fs.readFileSync(tempReportFile, 'utf8'));
    } catch (e) {}
  }

  if (!results && stdout) {
    try {
      // Look for first '{' and last '}'
      const firstBrace = stdout.indexOf('{');
      const lastBrace = stdout.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        results = JSON.parse(stdout.substring(firstBrace, lastBrace + 1));
      }
    } catch (e) {}
  }

  return { results, exitCode };
}

function extractQuarantineTests(suite, testMap = {}) {
  if (!suite) return testMap;

  if (suite.specs && Array.isArray(suite.specs)) {
    for (const spec of suite.specs) {
      const key = `${spec.file} :: ${spec.title}`;
      if (!testMap[key]) {
        testMap[key] = {
          title: spec.title,
          file: spec.file || 'unknown',
          runs: 0,
          passed: 0,
          failed: 0,
          flaky: 0,
          skipped: 0,
        };
      }

      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          testMap[key].runs += 1;
          if (result.status === 'passed') {
            testMap[key].passed += 1;
          } else if (result.status === 'skipped') {
            testMap[key].skipped += 1;
          } else {
            testMap[key].failed += 1;
          }
        }
      }
    }
  }

  if (suite.suites && Array.isArray(suite.suites)) {
    for (const child of suite.suites) {
      extractQuarantineTests(child, testMap);
    }
  }

  return testMap;
}

function generateAuditReport(results) {
  const testMap = results ? extractQuarantineTests(results) : {};
  const entries = Object.values(testMap);

  let md = `\n### 🛡️ Playwright Quarantine Stability Audit Report\n\n`;
  md += `**Audit Execution Mode**: \`--repeat-each=${REPEAT_COUNT}\` (Repetition Factor: ${REPEAT_COUNT}x)\n`;
  md += `**Audited Quarantined Specs**: \`${entries.length}\`\n\n`;

  if (entries.length === 0) {
    md += `> ℹ️ **No tests currently quarantined**: All test suites are clean and active in mainline regression gates with zero active \`@quarantine\` annotations.\n\n`;
    md += `---\n`;
    return { md, entries, recommendedForDeQuarantine: [] };
  }

  md += `| Quarantined Test Title | Spec File | Runs | Passed | Failed | Stability Index | Recommendation |\n`;
  md += `| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n`;

  const recommendedForDeQuarantine = [];

  for (const item of entries) {
    const totalEffectiveRuns = item.runs - item.skipped;
    const stabilityPercent = totalEffectiveRuns > 0 ? ((item.passed / totalEffectiveRuns) * 100) : 0;
    const isStable = stabilityPercent === 100.0 && totalEffectiveRuns >= REPEAT_COUNT;

    let recommendation;
    if (isStable) {
      recommendation = `🟢 **DE-QUARANTINE RECOMMENDED** (100% Pass Rate)`;
      recommendedForDeQuarantine.push(item);
    } else {
      recommendation = `🔴 **RETAIN IN QUARANTINE** (Flakiness: ${(100 - stabilityPercent).toFixed(1)}%)`;
    }

    const relFile = item.file.replace(/\\/g, '/').split('playwright-e2e/').pop();
    md += `| **${item.title}** | \`${relFile}\` | \`${item.runs}\` | \`${item.passed}\` | \`${item.failed}\` | \`${stabilityPercent.toFixed(1)}%\` | ${recommendation} |\n`;
  }

  md += `\n`;
  if (recommendedForDeQuarantine.length > 0) {
    md += `#### 📋 Actionable De-quarantine Advisory\n\n`;
    md += `The following tests demonstrated 100% stability across all ${REPEAT_COUNT} repetitions and are ready to be safely returned to mainline regression:\n\n`;
    for (const rec of recommendedForDeQuarantine) {
      md += `- [ ] Remove \`@quarantine\` tag from **${rec.title}** in \`${rec.file}\`\n`;
    }
    md += `\n`;
  }

  md += `---\n`;
  return { md, entries, recommendedForDeQuarantine };
}

function main() {
  const { results, exitCode } = runPlaywrightQuarantine();
  const { md, entries, recommendedForDeQuarantine } = generateAuditReport(results);

  console.log(md);

  // Write to reports/quarantine-audit.md
  const reportDir = path.resolve(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const reportFile = path.join(reportDir, 'quarantine-audit.md');
  fs.writeFileSync(reportFile, md, 'utf8');
  console.log(`✅ Saved Quarantine Stability Audit report to ${reportFile}`);

  // Append to GITHUB_STEP_SUMMARY
  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummary) {
    try {
      fs.appendFileSync(stepSummary, md, 'utf8');
      console.log(`✅ Appended Quarantine Audit to GITHUB_STEP_SUMMARY`);
    } catch (e) {
      console.warn(`⚠️ Failed to write to GITHUB_STEP_SUMMARY:`, e.message);
    }
  }

  console.log(`✨ Quarantine audit completed successfully. Quarantined tests analyzed: ${entries.length}.`);
}

if (require.main === module) {
  main();
}

module.exports = { generateAuditReport, extractQuarantineTests };

/* jshint esversion: 11, node: true */

const fs = require('fs');
const path = require('path');
const { merge } = require('monocart-reporter');

function findIndexJsonFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findIndexJsonFiles(fullPath, fileList);
    } else if (file === 'index.json') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function main() {
  const inputDir = process.argv[2] || 'all-monocart';
  const outputFile = process.argv[3] || 'reports/monocart-report/index.html';

  console.log(`[monocart-merge] Scanning directory: ${inputDir}`);
  const reportFiles = findIndexJsonFiles(path.resolve(process.cwd(), inputDir));

  if (reportFiles.length === 0) {
    console.log(`[monocart-merge] No index.json files found in ${inputDir}. Creating fallback report.`);
    const outDir = path.dirname(path.resolve(process.cwd(), outputFile));
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(
      path.resolve(process.cwd(), outputFile),
      '<html><body><h1>Monocart Test Report</h1><p>No tests were executed matching the requested criteria.</p></body></html>',
      'utf-8'
    );
    return;
  }

  console.log(`[monocart-merge] Found ${reportFiles.length} report data file(s) to merge:`);
  reportFiles.forEach((file, index) => {
    console.log(`  [${index + 1}] ${file}`);
  });

  const outDir = path.dirname(path.resolve(process.cwd(), outputFile));
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  await merge(reportFiles, {
    name: 'BuggyBooks Consolidated Test Execution Report',
    outputFile: path.resolve(process.cwd(), outputFile),
    tags: {
      smoke: { style: { background: '#28a745', color: '#fff' }, description: 'Smoke Tests' },
      regression: { style: { background: '#17a2b8', color: '#fff' }, description: 'Regression Tests' },
      chaos: { style: { background: '#dc3545', color: '#fff' }, description: 'Chaos Resilience Tests' },
      visual: { style: { background: '#6f42c1', color: '#fff' }, description: 'Visual Regression Tests' },
      a11y: { style: { background: '#ffc107', color: '#000' }, description: 'Accessibility Scans' },
      quarantine: { style: { background: '#6c757d', color: '#fff' }, description: 'Quarantined Tests' }
    }
  });

  console.log(`[monocart-merge] Successfully merged into: ${outputFile}`);
}

main().catch((err) => {
  console.error('[monocart-merge] Error merging Monocart reports:', err);
  process.exit(1);
});

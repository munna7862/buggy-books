import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { getCleanDom, getAccessibilityTree } from '../src/utils/dom-cleaner';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  const argv = process.argv.slice(2);
  
  // Basic positional arguments
  const positionalArgs = argv.filter(arg => !arg.startsWith('-'));
  
  if (positionalArgs.length < 2) {
    console.log(`
Usage: ts-node scripts/save-snapshot.ts <url> <page-name> [options]

Arguments:
  <url>          URL of the page to snapshot
  <page-name>    Target name for output files (e.g. "catalog")

Options:
  --interactive  Launch browser in headful mode and wait for User to press Enter in terminal before snapshotting.
  --wait <ms>    Wait for specific milliseconds after page loads (e.g. --wait 3000).
  --auth <path>  Custom path to auth storage state JSON file.
`);
    process.exit(1);
  }

  const url = positionalArgs[0];
  const pageName = positionalArgs[1];

  // Parse option flags
  const isInteractive = argv.includes('--interactive') || argv.includes('-i');
  
  let waitMs = 0;
  const waitIndex = argv.indexOf('--wait');
  if (waitIndex !== -1 && waitIndex + 1 < argv.length) {
    waitMs = parseInt(argv[waitIndex + 1], 10);
  }

  // Determine auth state path
  let authPath = '';
  const authIndex = argv.indexOf('--auth');
  if (authIndex !== -1 && authIndex + 1 < argv.length) {
    authPath = path.resolve(argv[authIndex + 1]);
  } else {
    // Default paths: check root workspace first
    const possiblePaths = [
      path.resolve(__dirname, '../../auth-state.json'),
      path.resolve(__dirname, '../auth-state.json'),
      path.resolve(__dirname, 'auth-state.json')
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        authPath = p;
        break;
      }
    }
  }

  console.log(`=== Save UI Snapshot ===`);
  console.log(`Target URL:  ${url}`);
  console.log(`Page Name:   ${pageName}`);
  console.log(`Interactive: ${isInteractive ? 'YES (Headful)' : 'NO (Headless)'}`);
  if (waitMs > 0) console.log(`Wait Time:   ${waitMs} ms`);
  if (authPath) console.log(`Auth File:   ${authPath}`);
  console.log(`========================\n`);

  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: !isInteractive
  });

  // Create context with optional storage state
  const contextOptions: any = {};
  if (authPath && fs.existsSync(authPath)) {
    try {
      contextOptions.storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      console.log('Loaded saved authentication state.');
    } catch (e) {
      console.warn(`Warning: Failed to load auth file from ${authPath}:`, e);
    }
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    if (waitMs > 0) {
      console.log(`Waiting for ${waitMs}ms to let dynamic items settle...`);
      await page.waitForTimeout(waitMs);
    }

    if (isInteractive) {
      console.log('\n--- INTERACTIVE MODE ACTIVE ---');
      console.log('A headful browser window has been opened.');
      console.log('You can log in, perform manual navigation, scroll, or let dynamic loading finish.');
      await askQuestion('==> Press [ENTER] in this terminal when you are ready to capture the snapshot...');
    }

    console.log('Capturing DOM and ARIA snapshots...');
    const cleanDom = await getCleanDom(page);
    const ariaTree = await getAccessibilityTree(page);

    const snapshotDir = path.resolve(__dirname, '../reports/snapshots');
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const htmlPath = path.join(snapshotDir, `${pageName}.html`);
    const yamlPath = path.join(snapshotDir, `${pageName}.yaml`);

    fs.writeFileSync(htmlPath, cleanDom, 'utf-8');
    fs.writeFileSync(yamlPath, ariaTree, 'utf-8');

    console.log(`\nSuccess! Snapshots saved to:`);
    console.log(`  HTML DOM: file:///${htmlPath.replace(/\\/g, '/')}`);
    console.log(`  ARIA Tree: file:///${yamlPath.replace(/\\/g, '/')}`);
  } catch (error) {
    console.error('Error during snapshot capture:', error);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Unhandled fatal error in save-snapshot:', err);
  process.exit(1);
});

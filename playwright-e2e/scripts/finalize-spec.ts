import { spawnSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { isAbsolute, join, relative, resolve, sep } from 'path';

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const args = process.argv.slice(2);
const shouldRun = args.includes('run') || args.includes('--run');
const isAllPoms = args.includes('--all-poms');
const targetArg = args.find(arg => arg !== 'run' && !arg.startsWith('--'));

if (!isAllPoms && !targetArg) {
  console.error('Usage: npm run finalize-spec -- <spec-path|page-path> [run]');
  console.error('       npm run finalize-spec -- --all-poms');
  process.exit(2);
}

const projectRoot = resolve(__dirname, '..');
const pagesRoot = join(projectRoot, 'src', 'pages');
const testsRoot = join(projectRoot, 'src', 'tests');

function normalizePath(filePath: string): string {
  return filePath.split(sep).join('/');
}

function runTypeScriptCheck(): CheckResult {
  const compileResult = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit'], {
    cwd: projectRoot,
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  return {
    name: 'TypeScript compilation',
    passed: compileResult.status === 0,
    detail: compileResult.status === 0
      ? 'Project compiles with no TypeScript errors.'
      : compileResult.error
        ? `TypeScript compiler could not start: ${compileResult.error.message}`
        : `TypeScript compiler failed:\n${compileResult.stdout || compileResult.stderr || 'Unknown error'}`
  };
}

function validatePageObjectFile(pagePath: string): CheckResult[] {
  const results: CheckResult[] = [];
  const relPath = normalizePath(relative(projectRoot, pagePath));

  if (!existsSync(pagePath)) {
    results.push({
      name: 'Page Object path',
      passed: false,
      detail: `File not found: ${relPath}`
    });
    return results;
  }

  const content = readFileSync(pagePath, 'utf-8');

  // Rule 1: BasePage inheritance
  const extendsBasePage = /class\s+\w+\s+extends\s+BasePage\b/.test(content);
  results.push({
    name: 'BasePage inheritance',
    passed: extendsBasePage,
    detail: extendsBasePage
      ? 'Class extends BasePage.'
      : 'Page Object class must extend BasePage.'
  });

  // Rule 2: No forbidden raw page interaction calls (must use BasePage wrappers)
  const forbiddenRawCalls = content.match(/\b(?:this\.)?page\.(?:click|fill|textContent|dblclick|check|uncheck)\s*\(/g) ?? [];
  results.push({
    name: 'Wrapper method usage',
    passed: forbiddenRawCalls.length === 0,
    detail: forbiddenRawCalls.length === 0
      ? 'No prohibited raw page.click/fill/textContent calls found; all actions use BasePage wrappers.'
      : `Found ${forbiddenRawCalls.length} raw Playwright call(s) (${forbiddenRawCalls.slice(0, 3).join(', ')}); must use BasePage wrapper methods (this.doClick, this.doEnterText, this.doGetText).`
  });

  // Rule 3: Locators must be defined as private getters or helper methods (no public locators, no class property locators)
  const publicLocatorMatches = content.match(/public\s+(?:readonly\s+)?(?:get\s+)?([a-zA-Z0-9_$]+)\s*(?:\(\s*\))?\s*:\s*Locator\b/g) ?? [];
  const propertyLocatorMatches = content.match(/(?:private|protected)\s+(?:readonly\s+)?([a-zA-Z0-9_$]+)\s*:\s*Locator\s*;/g) ?? [];
  const totalLocatorEncapsulationViolations = publicLocatorMatches.length + propertyLocatorMatches.length;

  results.push({
    name: 'Locator encapsulation',
    passed: totalLocatorEncapsulationViolations === 0,
    detail: totalLocatorEncapsulationViolations === 0
      ? 'All locators are properly encapsulated as private getters or private helper methods.'
      : `Found locator encapsulation issue(s): ${publicLocatorMatches.length} public locator(s), ${propertyLocatorMatches.length} property field locator(s). Define locators as 'private get <name>(): Locator'.`
  });

  // Rule 4: No static waits (waitForTimeout)
  const staticWaits = content.match(/\bwaitForTimeout\s*\(/g) ?? [];
  results.push({
    name: 'No static waits',
    passed: staticWaits.length === 0,
    detail: staticWaits.length === 0
      ? 'No waitForTimeout calls found.'
      : `Found ${staticWaits.length} waitForTimeout call(s); use dynamic Playwright locator waits or expectations.`
  });

  return results;
}

function getAllPageObjectFiles(dir: string): string[] {
  let files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllPageObjectFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ---------------- EXECUTION DISPATCHER ----------------

if (isAllPoms) {
  console.log('Validating all Page Objects in src/pages/...\n');
  const pomFiles = getAllPageObjectFiles(pagesRoot);
  let totalChecks = 0;
  let passedChecks = 0;
  let hasAnyFailure = false;

  for (const pomFile of pomFiles) {
    const relPomPath = normalizePath(relative(projectRoot, pomFile));
    console.log(`Page Object: ${relPomPath}`);
    const results = validatePageObjectFile(pomFile);

    for (const res of results) {
      totalChecks++;
      if (res.passed) {
        passedChecks++;
        console.log(`  PASS | ${res.name} | ${res.detail}`);
      } else {
        hasAnyFailure = true;
        console.log(`  FAIL | ${res.name} | ${res.detail}`);
      }
    }
    console.log('');
  }

  const tsCheck = runTypeScriptCheck();
  totalChecks++;
  if (tsCheck.passed) {
    passedChecks++;
    console.log(`PASS | ${tsCheck.name} | ${tsCheck.detail}`);
  } else {
    hasAnyFailure = true;
    console.log(`FAIL | ${tsCheck.name} | ${tsCheck.detail}`);
  }

  console.log(`\nPage Object Validation Summary: ${passedChecks}/${totalChecks} checks passed across ${pomFiles.length} Page Objects.`);
  process.exit(hasAnyFailure ? 1 : 0);
}

// Single target execution (Page Object or Spec)
const targetPath = isAbsolute(targetArg!) ? resolve(targetArg!) : resolve(projectRoot, targetArg!);
const relativePagesPath = relative(pagesRoot, targetPath);
const isPageObject = relativePagesPath.length > 0
  && !relativePagesPath.startsWith('..')
  && (targetPath.endsWith('.page.ts') || targetPath.endsWith('.component.ts') || targetPath.endsWith('.ts'));

const relativeSpecPath = relative(testsRoot, targetPath);
const isSpec = relativeSpecPath.length > 0
  && !relativeSpecPath.startsWith('..')
  && relativeSpecPath.endsWith('.spec.ts');

if (isPageObject) {
  console.log(`\nFinalize Page Object Results: ${normalizePath(relative(projectRoot, targetPath))}\n`);
  const results = validatePageObjectFile(targetPath);
  const tsCheck = runTypeScriptCheck();
  results.push(tsCheck);

  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} | ${result.name} | ${result.detail}`);
  }

  const failed = results.filter(r => !r.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length === 0 ? 0 : 1);
}

// Default: Spec validation
const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
}

addResult('Spec path', isSpec && existsSync(targetPath), isSpec
  ? normalizePath(relative(projectRoot, targetPath))
  : 'Path must reference an existing .spec.ts file under src/tests/ or a Page Object under src/pages/.');

if (isSpec && existsSync(targetPath)) {
  const specContent = readFileSync(targetPath, 'utf-8');
  const pathParts = normalizePath(relativeSpecPath).split('/');
  const isUiSpec = pathParts[0] === 'ui';
  const staticWaitMatches = specContent.match(/\bwaitForTimeout\s*\(/g) ?? [];
  const absoluteXPathMatches = specContent.match(/\.locator\(\s*['"`]\/(?!\/)[^'"`]*['"`]\s*\)/g) ?? [];
  const inlineLocatorMatches = specContent.match(/\bpage\.(?:locator|getByRole|getByLabel|getByPlaceholder|getByTestId|getByText)\s*\(/g) ?? [];

  addResult('No static waits', staticWaitMatches.length === 0, staticWaitMatches.length === 0
    ? 'No waitForTimeout calls found.'
    : `Found ${staticWaitMatches.length} waitForTimeout call(s).`);
  addResult('No absolute XPath', absoluteXPathMatches.length === 0, absoluteXPathMatches.length === 0
    ? 'No absolute XPath locators found.'
    : `Found ${absoluteXPathMatches.length} absolute XPath locator(s).`);
  addResult('No inline selectors', inlineLocatorMatches.length === 0, inlineLocatorMatches.length === 0
    ? 'No inline page selectors found.'
    : `Found ${inlineLocatorMatches.length} inline page selector(s); move them to a Page Object.`);

  if (isUiSpec) {
    const usesCustomFixture = /import\s*\{[^}]*\btest\b[^}]*\}\s*from\s*['"][^'"]*core\/base\/base\.fixture['"]/.test(specContent);
    const testStepMatches = specContent.match(/\btest\.step\s*\(/g) ?? [];
    addResult('UI fixture import', usesCustomFixture, usesCustomFixture
      ? 'UI test uses the custom base fixture.'
      : 'UI tests must import test from core/base/base.fixture.');
    addResult('UI test.step usage', testStepMatches.length > 0, testStepMatches.length > 0
      ? `Found ${testStepMatches.length} test.step block(s).`
      : 'UI tests must wrap meaningful business flows in test.step blocks.');
  } else {
    const nativePlaywrightImport = specContent.match(/import\s*\{([^}]*)\}\s*from\s*['"]@playwright\/test['"]/)?.[1] ?? '';
    const usesNativePlaywrightTest = /\btest\b/.test(nativePlaywrightImport) && /\bexpect\b/.test(nativePlaywrightImport);
    addResult('API test import', pathParts[0] === 'api' && usesNativePlaywrightTest, pathParts[0] === 'api' && usesNativePlaywrightTest
      ? 'API test uses native Playwright test/expect.'
      : 'API specs must live under src/tests/api and import from @playwright/test.');
  }

  const dataRelativePath = relativeSpecPath.replace(/\.spec\.ts$/, '.json');
  const testDataPath = join(projectRoot, 'src', 'test-data', dataRelativePath);
  const hasTestData = existsSync(testDataPath);
  let testDataDetail = normalizePath(relative(projectRoot, testDataPath));

  if (hasTestData) {
    try {
      JSON.parse(readFileSync(testDataPath, 'utf-8'));
      testDataDetail += ' (valid JSON)';
    } catch (error) {
      testDataDetail += ` (invalid JSON: ${error instanceof Error ? error.message : String(error)})`;
      addResult('Mirrored test data', false, testDataDetail);
    }
  }

  if (!results.some(result => result.name === 'Mirrored test data')) {
    addResult('Mirrored test data', hasTestData, hasTestData ? testDataDetail : `${testDataDetail} is missing.`);
  }

  if (pathParts[0] === 'ui' && pathParts.length > 2) {
    const area = pathParts[1];
    const workflowPath = resolve(projectRoot, '..', '.github', 'workflows', 'playwright-docker.yml');
    const workflowContent = existsSync(workflowPath) ? readFileSync(workflowPath, 'utf-8') : '';
    const registrationPattern = new RegExp(`folder["']?\\s*:\\s*["']ui/${area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`);
    addResult('Docker matrix registration', registrationPattern.test(workflowContent), registrationPattern.test(workflowContent)
      ? `ui/${area} is registered in .github/workflows/playwright-docker.yml.`
      : `ui/${area} is not registered in .github/workflows/playwright-docker.yml.`);
  } else if (pathParts[0] === 'api') {
    addResult('Docker matrix registration', true, 'API specs are covered by the api shard.');
  } else {
    addResult('Docker matrix registration', false, `${normalizePath(relativeSpecPath)} is not covered by the ui or api CI shards.`);
  }

  const tsCheck = runTypeScriptCheck();
  results.push(tsCheck);

  if (shouldRun && results.every(result => result.passed)) {
    const testResult = spawnSync(process.execPath, [
      require.resolve('@playwright/test/cli'),
      'test',
      normalizePath(relative(projectRoot, targetPath)),
      '--config=src/config/playwright.config.ts',
      '--workers=1'
    ], {
      cwd: projectRoot,
      env: { ...process.env, TZ: 'Australia/Adelaide' },
      stdio: 'inherit'
    });

    addResult('Isolated test run', testResult.status === 0, testResult.status === 0
      ? 'Targeted spec passed with one worker.'
      : testResult.error
        ? `Targeted spec could not start: ${testResult.error.message}`
        : `Targeted spec exited with code ${testResult.status ?? 'unknown'}.`);
  } else if (!shouldRun) {
    addResult('Isolated test run', true, 'Skipped; append run to execute the targeted spec.');
  } else {
    addResult('Isolated test run', false, 'Skipped because one or more prerequisite checks failed.');
  }
}

console.log('\nFinalize Spec Results');
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} | ${result.name} | ${result.detail}`);
}

const failed = results.filter(result => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length === 0 ? 0 : 1);


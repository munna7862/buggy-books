import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { isAbsolute, join, relative, resolve, sep } from 'path';

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const args = process.argv.slice(2);
const shouldRun = args.includes('run') || args.includes('--run');
const specArg = args.find(arg => arg !== 'run' && !arg.startsWith('--'));

if (!specArg) {
  console.error('Usage: npm run finalize-spec -- <spec-path> [run]');
  process.exit(2);
}

const projectRoot = resolve(__dirname, '..');
const specPath = isAbsolute(specArg) ? resolve(specArg) : resolve(projectRoot, specArg);
const testsRoot = join(projectRoot, 'src', 'tests');
const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
}

function normalizePath(filePath: string): string {
  return filePath.split(sep).join('/');
}

const relativeSpecPath = relative(testsRoot, specPath);
const isSpec = relativeSpecPath.length > 0
  && !relativeSpecPath.startsWith('..')
  && relativeSpecPath.endsWith('.spec.ts');

addResult('Spec path', isSpec && existsSync(specPath), isSpec
  ? normalizePath(relative(projectRoot, specPath))
  : 'Path must reference an existing .spec.ts file under src/tests/.');

if (isSpec && existsSync(specPath)) {
  const specContent = readFileSync(specPath, 'utf-8');
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

  const compileResult = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  addResult('TypeScript compilation', compileResult.status === 0, compileResult.status === 0
    ? 'Project compiles with no TypeScript errors.'
    : compileResult.error
      ? `TypeScript compiler could not start: ${compileResult.error.message}`
      : `TypeScript compiler exited with code ${compileResult.status ?? 'unknown'}.`);

  if (shouldRun && results.every(result => result.passed)) {
    const testResult = spawnSync(process.execPath, [
      require.resolve('@playwright/test/cli'),
      'test',
      normalizePath(relative(projectRoot, specPath)),
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

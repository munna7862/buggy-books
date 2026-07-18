import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getCleanDom, getAccessibilityTree } from '../../utils/dom-cleaner';

/**
 * Captures visual/semantic DOM state, accessibility trees, and error details
 * at the exact moment of a test failure, outputting files for AI self-healing.
 */
export async function captureFailureState(page: Page, testInfo: TestInfo): Promise<void> {
  try {
    console.log(`\n[Failure Hook] Capturing state for failing test: "${testInfo.title}"...`);
    
    // 1. Get clean DOM and ARIA snapshots
    const cleanDom = await getCleanDom(page);
    let cleanAria = '';
    try {
      cleanAria = await getAccessibilityTree(page);
    } catch (e) {
      console.warn('[Failure Hook] Could not capture accessibility tree:', e);
    }
    
    // 2. Prepare metadata
    const context = {
      testTitle: testInfo.title,
      testFile: path.relative(process.cwd(), testInfo.file),
      error: testInfo.errors.map(e => e.message || e.value).join('\n\n'),
      url: page.url(),
      timestamp: new Date().toISOString(),
    };
    
    // 3. Ensure directory exists
    const snapshotsDir = path.resolve(process.cwd(), 'reports/snapshots');
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }
    
    // 4. Save snapshots
    const htmlPath = path.join(snapshotsDir, 'failure-dom.html');
    const yamlPath = path.join(snapshotsDir, 'failure-aria.yaml');
    const jsonPath = path.join(snapshotsDir, 'failure-context.json');
    
    fs.writeFileSync(htmlPath, cleanDom, 'utf-8');
    fs.writeFileSync(yamlPath, cleanAria, 'utf-8');
    fs.writeFileSync(jsonPath, JSON.stringify(context, null, 2), 'utf-8');
    
    console.log(`[Failure Hook] Failure state successfully captured and written to:`);
    console.log(`  DOM Snapshot:  file:///${htmlPath.replace(/\\/g, '/')}`);
    console.log(`  ARIA Snapshot: file:///${yamlPath.replace(/\\/g, '/')}`);
    console.log(`  Context JSON:  file:///${jsonPath.replace(/\\/g, '/')}`);
    console.log(`[Failure Hook] You can now ask Antigravity to heal this test using these failure reports.\n`);
  } catch (error) {
    console.error('[Failure Hook] Error capturing failure state:', error);
  }
}

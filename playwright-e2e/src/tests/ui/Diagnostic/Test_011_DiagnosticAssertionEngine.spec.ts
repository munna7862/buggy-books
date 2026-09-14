import { expect } from '@playwright/test';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import TestData from '../../../test-data/ui/Diagnostic/Test_011_DiagnosticAssertionEngine.json';

test.describe('Diagnostic Assertion Engine & Step Logging Suite', () => {

  test('TC-ASSERT-001: verifyValue and verifyCondition exact diff diagnostic assertions @smoke @regression', async ({ commonFunctions, page }) => {
    await test.step('Verify matching scalar values succeed cleanly with PASS log', async () => {
      await commonFunctions.verifyValue(TestData.testStrings.actual, TestData.testStrings.expected, 'Validating matching string scalar values');
      await commonFunctions.verifyValue(TestData.testNumbers.actual, TestData.testNumbers.expected, 'Validating matching number scalar values');
    });

    await test.step('Verify verifyCondition succeeds for truthy expressions', async () => {
      const isPositive = TestData.testNumbers.actual > 0;
      await commonFunctions.verifyCondition(isPositive, 'Validating positive number condition');
    });

    await test.step('Verify assertion mismatch produces exact Expected vs Received failure diff', async () => {
      let caughtError: Error | null = null;
      try {
        await commonFunctions.verifyValue(
          TestData.testNumbers.mismatched,
          TestData.testNumbers.expected,
          'Testing intentional mismatch failure diff'
        );
      } catch (error) {
        caughtError = error as Error;
      }

      // Confirm assertion threw with exact diff information
      expect(caughtError).not.toBeNull();
      const errorMsg = caughtError?.message || '';
      expect(errorMsg).toContain('Testing intentional mismatch failure diff');
      expect(errorMsg).toContain(String(TestData.testNumbers.expected));
      expect(errorMsg).toContain(String(TestData.testNumbers.mismatched));
    });

    await test.step('Verify verifyCondition failure produces descriptive error message', async () => {
      let caughtConditionError: Error | null = null;
      try {
        await commonFunctions.verifyCondition(TestData.testConditions.falsy, 'Testing intentional false condition');
      } catch (error) {
        caughtConditionError = error as Error;
      }

      expect(caughtConditionError).not.toBeNull();
      expect(caughtConditionError?.message).toContain('Testing intentional false condition');
    });
  });

  test('TC-ASSERT-002: Locator verification helpers with polling and structured logging @regression', async ({ commonFunctions, catalogPage, page }) => {
    await test.step('Navigate to catalog page', async () => {
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.waitForBookCardsVisible();
    });

    await test.step('Verify locator text and item count helpers', async () => {
      const initialCount = await catalogPage.getBooksCount();
      await commonFunctions.verifyValue(initialCount, TestData.expectedCounts.initialBooks, 'Verifying initial catalog book count');
    });
  });

  test('TC-ASSERT-003: Backward compatibility for deprecated compareTwoValues wrapper @regression', async ({ commonFunctions }) => {
    await test.step('Verify compareTwoValues returns true on match without throwing', async () => {
      const matchResult = await commonFunctions.compareTwoValues('alpha', 'alpha', 'Legacy equality comparison');
      await commonFunctions.verifyValue(matchResult, true, 'Verifying legacy compareTwoValues returns true');
    });

    await test.step('Verify compareTwoValues returns false on mismatch without throwing hard failure', async () => {
      const mismatchResult = await commonFunctions.compareTwoValues('alpha', 'beta', 'Legacy inequality comparison');
      await commonFunctions.verifyValue(mismatchResult, false, 'Verifying legacy compareTwoValues returns false on mismatch');
    });
  });

});

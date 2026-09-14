import { logger, errorLogger } from '../core/logger/logger';
import { expect, Locator } from '@playwright/test';
import * as allure from "allure-js-commons";
import { randomInt } from 'crypto';

export class CommonFunctions {
  /**
   * Verifies scalar values with full Winston structured logging, Allure step tracking,
   * and immediate, descriptive Playwright assertion diffs (Expected vs Received).
   *
   * @param actual The actual value produced by the system under test.
   * @param expected The expected value.
   * @param description Business description of the assertion step.
   * @param soft If true, uses expect.soft to allow subsequent assertions to run.
   */
  public async verifyValue<T>(actual: T, expected: T, description: string, soft: boolean = false): Promise<void> {
    const isMatch = actual === expected;
    if (isMatch) {
      await this.logMessage('PASS', `${description} - Matched: [${String(actual)}]`);
    } else {
      await this.logMessage('FAIL', `${description} - Expected: [${String(expected)}] but Received: [${String(actual)}]`);
    }
    if (soft) {
      expect.soft(actual, description).toBe(expected);
    } else {
      expect(actual, description).toBe(expected);
    }
  }

  /**
   * Verifies a boolean condition with full Winston logging and descriptive diff.
   *
   * @param condition The evaluated boolean condition.
   * @param description Business description of what condition represents.
   * @param soft If true, uses expect.soft.
   */
  public async verifyCondition(condition: boolean, description: string, soft: boolean = false): Promise<void> {
    if (condition) {
      await this.logMessage('PASS', `${description} - Condition met (true)`);
    } else {
      await this.logMessage('FAIL', `${description} - Condition failed (false)`);
    }
    if (soft) {
      expect.soft(condition, description).toBe(true);
    } else {
      expect(condition, description).toBe(true);
    }
  }

  /**
   * Verifies locator text with automatic Playwright polling, Winston logging,
   * and descriptive assertion failure diffs.
   *
   * @param locator Playwright locator.
   * @param expectedText Expected string or RegExp.
   * @param description Business description of the element text check.
   * @param timeout Optional custom timeout in milliseconds.
   */
  public async verifyLocatorText(
    locator: Locator,
    expectedText: string | RegExp,
    description: string,
    timeout?: number
  ): Promise<void> {
    await this.logMessage('INFO', `Checking text: ${description}`);
    try {
      await expect(locator, description).toHaveText(expectedText, timeout ? { timeout } : undefined);
      await this.logMessage('PASS', `Verified text for: ${description} -> "${expectedText}"`);
    } catch (error) {
      await this.logMessage('FAIL', `Text verification failed for: ${description} - ${error}`);
      throw error;
    }
  }

  /**
   * Verifies locator item count with polling, Winston logging, and descriptive error diff.
   *
   * @param locator Playwright locator.
   * @param expectedCount Expected number of matching elements.
   * @param description Business description of the item count check.
   * @param timeout Optional custom timeout in milliseconds.
   */
  public async verifyItemCount(
    locator: Locator,
    expectedCount: number,
    description: string,
    timeout?: number
  ): Promise<void> {
    await this.logMessage('INFO', `Checking item count: ${description}`);
    try {
      await expect(locator, description).toHaveCount(expectedCount, timeout ? { timeout } : undefined);
      await this.logMessage('PASS', `Verified count [${expectedCount}] for: ${description}`);
    } catch (error) {
      await this.logMessage('FAIL', `Count verification failed for: ${description} - Expected: [${expectedCount}] - ${error}`);
      throw error;
    }
  }

  /**
   * Verifies locator visibility with polling and structured logging.
   *
   * @param locator Playwright locator.
   * @param description Business description of the visibility check.
   * @param timeout Optional custom timeout in milliseconds.
   */
  public async verifyElementVisible(
    locator: Locator,
    description: string,
    timeout?: number
  ): Promise<void> {
    await this.logMessage('INFO', `Checking element visibility: ${description}`);
    try {
      await expect(locator, description).toBeVisible(timeout ? { timeout } : undefined);
      await this.logMessage('PASS', `Verified element is visible: ${description}`);
    } catch (error) {
      await this.logMessage('FAIL', `Visibility check failed for: ${description} - ${error}`);
      throw error;
    }
  }

  /**
   * Legacy comparison helper that returns a boolean.
   * @deprecated Use `verifyValue` or `verifyCondition` for direct Playwright assertion diffs and fail-fast behavior.
   */
  public async compareTwoValues(sActualValue: any, sExpectedValue: any, sLogMessage: string): Promise<boolean> {
    let bValidation = false;
    if (sActualValue === sExpectedValue) {
      await this.logMessage('PASS', ` ${sLogMessage} Success !! Actual and Expected Values are:: ${sActualValue}`);
      bValidation = true;
    } else {
      await this.logMessage('FAIL', ` ${sLogMessage} Failed!! Expected Value:: ${sExpectedValue} || Actual Value:: ${sActualValue}`);
    }
    expect.soft(sActualValue, sLogMessage).toBe(sExpectedValue);
    return bValidation;
  }

  public async logMessage(sLogLevel: string, sMessage: string): Promise<void> {
    const levelMap: Record<string, string> = {
      'PASS': 'info',
      'FAIL': 'error',
      'INFO': 'info',
      'WARN': 'warn'
    };

    const logLevel = levelMap[sLogLevel] || sLogLevel.toLowerCase();
    const reportLevel = sLogLevel.toUpperCase();
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];

    // Use errorLogger for failures to log to separate error file
    if (sLogLevel === 'FAIL') {
      errorLogger.log({ level: logLevel, message: sMessage });
    }

    // Always log to main framework log
    logger.log({ level: logLevel, message: sMessage });

    const emoji = sLogLevel === 'PASS' ? '✅' : sLogLevel === 'FAIL' ? '❌' : '';
    await allure.step(`${emoji} [${timestamp}] [${reportLevel}] ${sMessage}`, async () => { });
  }

  public generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(randomInt(0, characters.length));
    }
    return result;
  }
}

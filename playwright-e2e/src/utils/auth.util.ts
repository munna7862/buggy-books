import { BrowserContext, Browser, Page } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../core/logger/logger';

export class AuthUtility {
  private static readonly AUTH_STATE_DIR = path.join(__dirname, '../../../');
  private static readonly DEFAULT_AUTH_STATE_FILE = path.join(this.AUTH_STATE_DIR, 'auth-state.json');

  /**
   * Save authentication state (cookies, localStorage, sessionStorage) to a file
   * Call this after user login to preserve the session for reuse
   * @param context - Playwright browser context
   * @param filePath - Optional custom file path to save auth state (defaults to auth-state.json)
   */
  public static async saveAuthState(context: BrowserContext, filePath?: string): Promise<string> {
    const targetPath = filePath || this.DEFAULT_AUTH_STATE_FILE;
    try {
      const storageState = await context.storageState();
      await fs.writeFile(targetPath, JSON.stringify(storageState, null, 2), 'utf-8');
      logger.info(`✅ Authentication state saved to: ${targetPath}`);
      return targetPath;
    } catch (error) {
      logger.error(`❌ Failed to save authentication state: ${error}`);
      throw error;
    }
  }

  /**
   * Load and apply saved authentication state to a new browser context
   * This allows tests to reuse login session without re-entering credentials
   * @param browser - Playwright browser instance
   * @param filePath - Optional custom file path to load auth state from (defaults to auth-state.json)
   * @returns Object with context and page for use in tests
   */
  public static async createContextWithSavedAuth(
    browser: Browser,
    filePath?: string
  ): Promise<{ context: BrowserContext; page: Page }> {
    const targetPath = filePath || this.DEFAULT_AUTH_STATE_FILE;
    try {
      const storageState = JSON.parse(await fs.readFile(targetPath, 'utf-8'));
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      logger.info(`✅ New context created with saved authentication state from: ${targetPath}`);
      return { context, page };
    } catch (error) {
      logger.error(`❌ Failed to load authentication state: ${error}`);
      throw new Error(`Authentication state file not found or invalid. Please run login test first. Path: ${targetPath}`);
    }
  }

  /**
   * Check if authentication state file exists
   * @param filePath - Optional custom file path (defaults to auth-state.json)
   * @returns true if file exists, false otherwise
   */
  public static async authStateExists(filePath?: string): Promise<boolean> {
    const targetPath = filePath || this.DEFAULT_AUTH_STATE_FILE;
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear saved authentication state file
   * Use this for cleanup or to reset session
   * @param filePath - Optional custom file path (defaults to auth-state.json)
   */
  public static async clearAuthState(filePath?: string): Promise<void> {
    const targetPath = filePath || this.DEFAULT_AUTH_STATE_FILE;
    try {
      await fs.unlink(targetPath);
      logger.info(`✅ Authentication state cleared: ${targetPath}`);
    } catch (error) {
      logger.warn(`⚠️  Authentication state file not found for deletion: ${targetPath}`);
    }
  }

  /**
   * Get the default auth state file path
   * @returns Path to auth-state.json
   */
  public static getDefaultAuthStateFile(): string {
    return this.DEFAULT_AUTH_STATE_FILE;
  }
}

import { Page, Locator } from '@playwright/test';
import { CommonFunctions } from '../../utils/common.util';
import { envConfig } from '../../config/env.config';

export class BasePage extends CommonFunctions {
  private static readonly DEFAULT_TIMEOUT = envConfig.timeout;

  constructor(protected page: Page) {
    super();
  }

  public async ensureNavElementVisible(targetLocator?: Locator): Promise<void> {
    try {
      const btnMobileMenu = this.page.locator('#mobile-menu-toggle');
      if (await btnMobileMenu.isVisible()) {
        const isExpanded = (await btnMobileMenu.getAttribute('aria-expanded')) === 'true';
        if (!isExpanded) {
          await btnMobileMenu.click();
          if (targetLocator) {
            await targetLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  public async doClick(locator: Locator, sLogMessage: string): Promise<void> {
    await this.logMessage('INFO', sLogMessage);
    await this.ensureNavElementVisible(locator);
    await locator.click({ timeout: BasePage.DEFAULT_TIMEOUT });
  }

  public async doEnterText(locator: Locator, sValue: string, sLogMessage: string): Promise<void> {
    await this.logMessage('INFO', sLogMessage);
    await locator.fill(sValue, { timeout: BasePage.DEFAULT_TIMEOUT });
  }

  public async doGetText(locator: Locator, sLogMessage: string): Promise<string> {
    await this.logMessage('INFO', sLogMessage);
    return (await locator.textContent({ timeout: BasePage.DEFAULT_TIMEOUT })) ?? '';
  }

  public async doGetAttribute(locator: Locator, sAttribute: string, sLogMessage: string): Promise<string | null> {
    await this.logMessage('INFO', sLogMessage);
    const value = await locator.getAttribute(sAttribute, { timeout: BasePage.DEFAULT_TIMEOUT });
    await this.logMessage('INFO', `Attribute ${sAttribute} has value: ${value}`);
    return value;
  }

  public async mouseHover(locator: Locator, sLogMessage: string): Promise<void> {
    await this.logMessage('INFO', sLogMessage);
    await locator.hover({ timeout: BasePage.DEFAULT_TIMEOUT });
  }

  public async clearAndSetInputValue(inputField: Locator, inputValue: string): Promise<void> {
    await inputField.click({ timeout: BasePage.DEFAULT_TIMEOUT });
    await inputField.fill('', { timeout: BasePage.DEFAULT_TIMEOUT });
    await this.logMessage('INFO', 'Cleared input value');
    await inputField.fill(inputValue, { timeout: BasePage.DEFAULT_TIMEOUT });
    await this.logMessage('INFO', `Set input value to ${inputValue}`);
  }

  public async addTextFieldValue(value: string, fieldLocator: Locator): Promise<void> {
    await fieldLocator.click({ timeout: BasePage.DEFAULT_TIMEOUT });
    await fieldLocator.pressSequentially(value, { timeout: BasePage.DEFAULT_TIMEOUT });
  }

  public async doesElementExist(locator: Locator, sLogMessage: string): Promise<boolean> {
    const isVisible = await locator.isVisible();
    await this.logMessage('INFO', `${sLogMessage} - Element ${isVisible ? 'is' : 'is not'} visible`);
    return isVisible;
  }
}

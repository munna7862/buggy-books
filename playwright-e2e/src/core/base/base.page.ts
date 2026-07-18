import { Page, Locator } from '@playwright/test';
import { CommonFunctions } from '../../utils/common.util';

export class BasePage extends CommonFunctions {
  private static readonly DEFAULT_TIMEOUT = 60000;

  constructor(protected page: Page) {
    super();
  }

  public async doClick(locator: Locator, sLogMessage: string): Promise<void> {
    await this.logMessage('INFO', sLogMessage);
    await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    await locator.click();
  }

  public async doEnterText(locator: Locator, sValue: string, sLogMessage: string): Promise<void> {
    await this.logMessage('INFO', sLogMessage);
    await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    await locator.fill(sValue);
  }

  public async doGetText(locator: Locator, sLogMessage: string): Promise<string> {
    await this.logMessage('INFO', sLogMessage);
    await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    return await locator.textContent() ?? '';
  }

  public async doGetAttribute(locator: Locator, sAttribute: string, sLogMessage: string): Promise<string | null> {
    await this.logMessage('INFO', sLogMessage);
    await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    const value = await locator.getAttribute(sAttribute);
    await this.logMessage('INFO', `Attribute ${sAttribute} has value: ${value}`);
    return value;
  }

  public async mouseHover(locator: Locator, sLogMessage: string): Promise<void> {
    await this.logMessage('INFO', sLogMessage);
    await locator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    await locator.hover();
  }

  public async clearAndSetInputValue(inputField: Locator, inputValue: string): Promise<void> {
    await inputField.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    await inputField.click();
    await inputField.fill('');
    await this.logMessage('INFO', 'Cleared input value');
    await inputField.fill(inputValue);
    await this.logMessage('INFO', `Set input value to ${inputValue}`);
  }

  public async addTextFieldValue(value: string, fieldLocator: Locator): Promise<void> {
    await fieldLocator.waitFor({ state: 'visible', timeout: BasePage.DEFAULT_TIMEOUT });
    await fieldLocator.click();
    await fieldLocator.pressSequentially(value);
  }

  public async doesElementExist(locator: Locator, sLogMessage: string): Promise<boolean> {
    const isVisible = await locator.isVisible();
    await this.logMessage('INFO', `${sLogMessage} - Element ${isVisible ? 'is' : 'is not'} visible`);
    return isVisible;
  }

}

import { logger, errorLogger } from '../core/logger/logger';
import { expect } from '@playwright/test';
import * as allure from "allure-js-commons";

export class CommonFunctions {
  // constructor(private page: Page, private context: BrowserContext) {}
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
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
}

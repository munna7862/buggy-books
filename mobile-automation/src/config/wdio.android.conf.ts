import { sharedConfig } from './wdio.shared.conf.js';

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
      'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '14.0',
      'appium:appPackage': 'com.buggybooks.app',
      'appium:appActivity': '.MainActivity',
      'appium:appWaitActivity': '*',
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240,
      'appium:uiautomator2ServerLaunchTimeout': 60000,
      'appium:ensureWebviewsHavePages': true,
      'appium:nativeWebScreenshot': true,
    },
  ],
};

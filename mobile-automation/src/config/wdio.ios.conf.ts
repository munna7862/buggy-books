import { sharedConfig } from './wdio.shared.conf.js';

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': process.env.IOS_DEVICE_NAME || 'iPhone 15',
      'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '17.0',
      'appium:bundleId': 'com.buggybooks.app',
      'appium:autoAcceptAlerts': true,
      'appium:newCommandTimeout': 240,
    },
  ],
};

import { BaseMobileScreen } from '../core/BaseMobileScreen.js';

export class ChaosScreen extends BaseMobileScreen {
  constructor() {
    super('ChaosScreen');
  }

  // Locators
  private get simulatedOfflineToggle() {
    return 'toggle_simulated_offline';
  }

  private get resetChaosButton() {
    return 'btn_reset_chaos';
  }

  private get offlineBanner() {
    return 'offline_banner';
  }

  async isLoaded(): Promise<boolean> {
    return this.isDisplayed(this.simulatedOfflineToggle);
  }

  async toggleSimulatedOffline(): Promise<void> {
    await this.step('Toggle simulated offline network mode (MOB-B5)', async () => {
      await this.clickElement(this.simulatedOfflineToggle);
      await driver.pause(1000);
    });
  }

  async isOfflineBannerVisible(): Promise<boolean> {
    return this.isDisplayed(this.offlineBanner, 4000);
  }

  async resetChaosDefaults(): Promise<void> {
    await this.step('Reset database and chaos configuration to defaults', async () => {
      await this.clickElement(this.resetChaosButton);
      if (await driver.isAlertOpen()) {
        await driver.acceptAlert();
      }
      await driver.pause(2000);
    });
  }
}

export const chaosScreen = new ChaosScreen();

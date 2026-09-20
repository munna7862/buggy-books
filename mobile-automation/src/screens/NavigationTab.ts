import { BaseMobileScreen } from '../core/BaseMobileScreen.js';

export class NavigationTab extends BaseMobileScreen {
  constructor() {
    super('NavigationTab');
  }

  // Bottom tab bar testIDs
  private get catalogTab() {
    return 'tab_catalog';
  }

  private get cartTab() {
    return 'tab_cart';
  }

  private get profileTab() {
    return 'tab_profile';
  }

  private get chaosTab() {
    return 'tab_chaos';
  }

  private get logoutButton() {
    return 'btn-logout';
  }

  async openCatalog(): Promise<void> {
    await this.step('Navigate to Catalog Tab', async () => {
      await this.clickElement(this.catalogTab);
    });
  }

  async openCart(): Promise<void> {
    await this.step('Navigate to Cart Tab', async () => {
      await this.clickElement(this.cartTab);
    });
  }

  async openProfile(): Promise<void> {
    await this.step('Navigate to Profile Tab', async () => {
      await this.clickElement(this.profileTab);
    });
  }

  async openChaos(): Promise<void> {
    await this.step('Navigate to Chaos Tab', async () => {
      await this.clickElement(this.chaosTab);
    });
  }

  async logout(): Promise<void> {
    await this.step('Log out from Profile Screen', async () => {
      await this.openProfile();
      await this.clickElement(this.logoutButton);
      if (await driver.isAlertOpen()) {
        await driver.acceptAlert();
      }
    });
  }
}

export const navigationTab = new NavigationTab();

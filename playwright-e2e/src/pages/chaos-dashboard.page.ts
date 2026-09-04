import { BasePage } from '../core/base/base.page';
import { Locator, Page } from '@playwright/test';

export class ChaosDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Encapsulated Private Locators
  private get dashboardContainer(): Locator {
    return this.page.locator('#chaos-dashboard');
  }

  private get headerTitle(): Locator {
    return this.page.locator('.chaos-header-title');
  }

  private get statusBadge(): Locator {
    return this.page.locator('#chaos-status-badge');
  }

  private get checkoutFailureSlider(): Locator {
    return this.page.locator('#slider-checkout-failure');
  }

  private get inventoryLockingSlider(): Locator {
    return this.page.locator('#slider-inventory-locking');
  }

  private get uploadFailureSlider(): Locator {
    return this.page.locator('#slider-upload-failure');
  }

  private get websocketDropSlider(): Locator {
    return this.page.locator('#slider-websocket-drop');
  }

  private get inventoryDelaySlider(): Locator {
    return this.page.locator('#slider-inventory-delay');
  }

  private get jwtExpirySlider(): Locator {
    return this.page.locator('#slider-jwt-expiry');
  }

  private get a11yViolationsToggle(): Locator {
    return this.page.locator('#toggle-a11y-violations');
  }

  private get visualChaosToggle(): Locator {
    return this.page.locator('#toggle-visual-chaos');
  }

  private get saveButton(): Locator {
    return this.page.locator('#btn-save-chaos');
  }

  private get resetButton(): Locator {
    return this.page.locator('#btn-reset-chaos');
  }

  private get baselinePresetBtn(): Locator {
    return this.page.locator('#preset-baseline');
  }

  private get flakyGatewayPresetBtn(): Locator {
    return this.page.locator('#preset-flaky-gateway');
  }

  private get highContentionPresetBtn(): Locator {
    return this.page.locator('#preset-high-contention');
  }

  private get uiStressPresetBtn(): Locator {
    return this.page.locator('#preset-ui-stress');
  }

  // Public Action Methods
  public async navigateToDashboard(baseUrl: string): Promise<void> {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/admin/chaos`;
    await this.logMessage('INFO', `Navigating to Chaos Control Dashboard: ${url}`);
    await this.page.goto(url);
    await this.dashboardContainer.waitFor({ state: 'visible' });
  }

  public async isDashboardVisible(): Promise<boolean> {
    return await this.doesElementExist(this.dashboardContainer, 'Verifying Chaos Dashboard container is visible');
  }

  public async getStatusBadgeText(): Promise<string> {
    return await this.doGetText(this.statusBadge, 'Reading status badge text');
  }

  public async setCheckoutFailureRate(rate: number): Promise<void> {
    await this.logMessage('INFO', `Setting checkout failure rate to ${rate}`);
    await this.clearAndSetInputValue(this.checkoutFailureSlider, rate.toString());
  }

  public async setInventoryLockingRate(rate: number): Promise<void> {
    await this.logMessage('INFO', `Setting inventory locking rate to ${rate}`);
    await this.clearAndSetInputValue(this.inventoryLockingSlider, rate.toString());
  }

  public async setInventoryDelayMs(delayMs: number): Promise<void> {
    await this.logMessage('INFO', `Setting inventory delay to ${delayMs}ms`);
    await this.clearAndSetInputValue(this.inventoryDelaySlider, delayMs.toString());
  }

  public async toggleA11yViolations(enable: boolean): Promise<void> {
    const isChecked = await this.a11yViolationsToggle.isChecked();
    if (isChecked !== enable) {
      await this.doClick(this.a11yViolationsToggle, `Toggling A11y violations to ${enable}`);
    }
  }

  public async toggleVisualChaos(enable: boolean): Promise<void> {
    const isChecked = await this.visualChaosToggle.isChecked();
    if (isChecked !== enable) {
      await this.doClick(this.visualChaosToggle, `Toggling Visual Chaos to ${enable}`);
    }
  }

  public async selectPreset(preset: 'baseline' | 'flaky-gateway' | 'high-contention' | 'ui-stress'): Promise<void> {
    switch (preset) {
      case 'baseline':
        await this.doClick(this.baselinePresetBtn, 'Selecting Clean Baseline preset');
        break;
      case 'flaky-gateway':
        await this.doClick(this.flakyGatewayPresetBtn, 'Selecting Flaky Gateway preset');
        break;
      case 'high-contention':
        await this.doClick(this.highContentionPresetBtn, 'Selecting High Contention preset');
        break;
      case 'ui-stress':
        await this.doClick(this.uiStressPresetBtn, 'Selecting UI Stress preset');
        break;
    }
  }

  public async applyChaosConfig(): Promise<void> {
    await this.doClick(this.saveButton, 'Clicking Apply Chaos Config button');
  }

  public async resetToDefaults(): Promise<void> {
    await this.doClick(this.resetButton, 'Clicking Reset Factory Defaults button');
  }
}

import { BasePage } from '../core/base/base.page';
import { Locator } from '@playwright/test';

export class NotificationCenterComponent extends BasePage {

  // Private getters for locators at top of class
  private get btnBellNotification(): Locator {
    return this.page.locator('#ws-notification-btn');
  }

  private get eleStatusDot(): Locator {
    return this.page.locator('#ws-status-dot');
  }

  private get eleDropdown(): Locator {
    return this.page.locator('#ws-notification-dropdown');
  }

  private get eleEventItems(): Locator {
    return this.page.locator('.ws-event-item');
  }

  private get eleToastNotification(): Locator {
    return this.page.locator('div[role="status"], .react-hot-toast, div:has-text("🛒"), div:has-text("🔥")');
  }

  // Action and state query methods
  public async clickBellButton(): Promise<void> {
    await this.doClick(this.btnBellNotification, "Clicking on WebSocket Notification Bell button");
  }

  public async isStatusConnected(): Promise<boolean> {
    try {
      await this.page.waitForSelector('#ws-status-dot.status-connected', { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  public async isStatusDisconnectedOrReconnecting(): Promise<boolean> {
    await this.eleStatusDot.waitFor({ state: 'attached', timeout: 5000 });
    const classes = (await this.eleStatusDot.getAttribute('class')) || '';
    return classes.includes('status-disconnected') || classes.includes('status-reconnecting');
  }

  public async isDropdownVisible(): Promise<boolean> {
    try {
      await this.eleDropdown.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  public async getEventItemsCount(): Promise<number> {
    return await this.eleEventItems.count();
  }

  public async isToastNotificationVisible(): Promise<boolean> {
    try {
      await this.eleToastNotification.first().waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

}

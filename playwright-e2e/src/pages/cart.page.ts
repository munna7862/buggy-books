import { BasePage } from '../core/base/base.page';
import { Locator, Page } from '@playwright/test';

export class CartPage extends BasePage {
  private readonly cartLink: Locator;
  private readonly cartItems: Locator;
  private readonly cartTotalHeading: Locator;
  private readonly clearAllButton: Locator;
  private readonly proceedToCheckoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartLink = this.page.getByRole('link', { name: 'Cart' });
    this.cartItems = this.page.getByRole('listitem');
    this.cartTotalHeading = this.page.locator('h3');
    this.clearAllButton = this.page.getByRole('button', { name: 'Clear All' });
    this.proceedToCheckoutButton = this.page.getByRole('button', { name: 'Proceed to Checkout' });
  }

  public async clickCartLink(): Promise<void> {
    await this.doClick(this.cartLink, "Clicking on Cart link");
  }

  public async getCartItemText(): Promise<string> {
    await this.logMessage('INFO', "Getting cart item text");
    await this.cartItems.first().waitFor({ state: 'visible', timeout: 60000 });
    return (await this.cartItems.allTextContents()).join(' ');
  }

  public async clickCartTotalHeading(): Promise<void> {
    await this.doClick(this.cartTotalHeading, "Clicking on cart total heading");
  }

  public async getCartTotalText(): Promise<string> {
    return await this.doGetText(this.cartTotalHeading, "Getting cart total text");
  }

  public async clickClearAll(): Promise<void> {
    await this.doClick(this.clearAllButton, "Clicking on Clear All button");
  }

  public async clearAllItemsIfPresent(): Promise<void> {
    await this.clearAllButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
    if (await this.clearAllButton.isVisible()) {
      await this.clickClearAll();
      await this.clearAllButton.waitFor({ state: 'hidden', timeout: 60000 });
    }
  }

  public async clickProceedToCheckout(): Promise<void> {
    await this.doClick(this.proceedToCheckoutButton, "Clicking on Proceed to Checkout button");
  }

  public async openCart(): Promise<void> {
    await this.clickCartLink();
  }

  public async proceedToCheckout(): Promise<void> {
    await this.clickCartTotalHeading();
    await this.clickProceedToCheckout();
  }
}

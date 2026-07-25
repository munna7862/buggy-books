import { BasePage } from '../core/base/base.page';
import { Locator, Page } from '@playwright/test';

export class CartPage extends BasePage {
  // Locators
  private get cartLink(): Locator {
    return this.page.getByRole('link', { name: 'Cart' });
  }

  private get cartItems(): Locator {
    return this.page.locator('.cart-item');
  }

  private get removeButtons(): Locator {
    return this.page.locator('.cart-remove-btn');
  }

  private get cartTotalHeading(): Locator {
    return this.page.locator('.cart-total-header, h3');
  }

  private get clearAllButton(): Locator {
    return this.page.getByRole('button', { name: 'Clear All' });
  }

  private get proceedToCheckoutButton(): Locator {
    return this.page.getByRole('button', { name: 'Proceed to Checkout' });
  }

  private get emptyCartMessage(): Locator {
    return this.page.locator('p:has-text("Your cart is empty.")');
  }

  constructor(page: Page) {
    super(page);
  }

  // Actions and Interaction Methods
  public async clickCartLink(): Promise<void> {
    await this.doClick(this.cartLink, "Clicking on Cart link");
  }

  public async openCart(): Promise<void> {
    await this.clickCartLink();
    await this.page.locator('h1:has-text("Your Cart")').waitFor({ state: 'visible', timeout: 10000 });
  }


  public async getCartItemsCount(): Promise<number> {
    await this.cartItems.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
    return await this.cartItems.count();
  }


  public async getCartItemText(): Promise<string> {
    await this.logMessage('INFO', "Getting cart item text");
    await this.cartItems.first().waitFor({ state: 'visible', timeout: 60000 });
    return (await this.cartItems.allTextContents()).join(' ');
  }

  public async removeFirstCartItem(): Promise<void> {
    const initialCount = await this.getCartItemsCount();
    await this.doClick(this.removeButtons.first(), "Clicking Remove item button");
    // Wait until items count decreases or cart becomes empty
    for (let i = 0; i < 10; i++) {
      await this.page.waitForTimeout(500);
      const currentCount = await this.getCartItemsCount();
      if (currentCount < initialCount) break;
    }
  }

  public async getCartTotalText(): Promise<string> {
    return await this.doGetText(this.cartTotalHeading, "Getting cart total text");
  }

  public async getCartTotalAmount(): Promise<number> {
    const text = await this.getCartTotalText();
    const match = text.match(/\$?(\d+\.\d{2})/);
    return match ? parseFloat(match[1]) : 0;
  }

  public async isCartEmpty(): Promise<boolean> {
    const isEmptyMsgVisible = await this.doesElementExist(this.emptyCartMessage, "Checking if 'Your cart is empty.' message is visible");
    const count = await this.getCartItemsCount();
    return isEmptyMsgVisible || count === 0;
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

  public async proceedToCheckout(): Promise<void> {
    await this.clickProceedToCheckout();
  }
}

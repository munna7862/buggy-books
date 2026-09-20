import { BaseMobileScreen } from '../core/BaseMobileScreen.js';

export class CartScreen extends BaseMobileScreen {
  constructor() {
    super('CartScreen');
  }

  // Locators
  private get cartList() {
    return 'cart-items-list';
  }

  private get emptyCart() {
    return 'empty-cart-state';
  }

  private get totalAmount() {
    return 'cart-total';
  }

  private get proceedCheckoutButton() {
    return 'btn-proceed-checkout';
  }

  private get clearCartButton() {
    return 'btn-clear-cart';
  }

  private getItemQuantityBadge(bookId: string) {
    return `item-qty-${bookId}`;
  }

  async isLoaded(): Promise<boolean> {
    return (await this.isDisplayed(this.cartList)) || (await this.isDisplayed(this.emptyCart));
  }

  async isCartEmpty(): Promise<boolean> {
    return this.isDisplayed(this.emptyCart);
  }

  async proceedToCheckout(): Promise<void> {
    await this.step('Proceed to Checkout', async () => {
      await this.clickElement(this.proceedCheckoutButton);
    });
  }

  async clearCart(): Promise<void> {
    await this.step('Clear entire cart', async () => {
      if (await this.isDisplayed(this.clearCartButton)) {
        await this.clickElement(this.clearCartButton);
        // If native alert confirmation appears, accept it
        if (await driver.isAlertOpen()) {
          await driver.acceptAlert();
        }
      }
    });
  }

  async getTotalPrice(): Promise<string> {
    return this.getText(this.totalAmount);
  }

  async getItemQuantity(bookId: string): Promise<string> {
    return this.getText(this.getItemQuantityBadge(bookId));
  }
}

export const cartScreen = new CartScreen();

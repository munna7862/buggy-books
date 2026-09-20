import { BaseMobileScreen } from '../core/BaseMobileScreen.js';

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  address: string;
  cardNumber: string;
}

export class CheckoutScreen extends BaseMobileScreen {
  constructor() {
    super('CheckoutScreen');
  }

  // Locators (MOB-B1 non-semantic & obfuscated testIDs)
  private get firstNameInput() {
    return 'txt_f1';
  }

  private get lastNameInput() {
    return 'txt_l1';
  }

  private get addressInput() {
    return 'txt_addr_88';
  }

  private get cardNumberInput() {
    return 'txt_c99';
  }

  private get placeOrderButton() {
    return 'btn_place_order';
  }

  private get errorBanner() {
    return 'banner_checkout_error';
  }

  private get retryPaymentButton() {
    return 'btn_retry_payment';
  }

  private get orderConfirmation() {
    return 'order_confirmation_container';
  }

  async isLoaded(): Promise<boolean> {
    return this.isDisplayed(this.firstNameInput);
  }

  /**
   * Fills shipping and payment details, then explicitly dismisses
   * the keyboard to overcome MOB-B2 keyboard occlusion.
   */
  async fillCheckoutForm(data: CheckoutFormData): Promise<void> {
    await this.step('Fill Checkout Form & handle keyboard occlusion (MOB-B2)', async () => {
      await this.typeText(this.firstNameInput, data.firstName);
      await this.typeText(this.lastNameInput, data.lastName);
      await this.typeText(this.addressInput, data.address);
      await this.typeText(this.cardNumberInput, data.cardNumber, true);

      // Overcome MOB-B2 keyboard occlusion over submit CTA
      await this.hideKeyboard();
    });
  }

  /**
   * Submits the order and handles stochastic 500 retry loop (MOB-B4).
   */
  async submitOrderWithRetryLoop(maxRetries = 3): Promise<boolean> {
    return this.step('Submit order and handle stochastic 500 gateway retry loop (MOB-B4)', async () => {
      // Scroll down to ensure place order button is visible
      await this.swipeUp();

      await this.clickElement(this.placeOrderButton);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Check if order confirmation appeared
        if (await this.isDisplayed(this.orderConfirmation, 5000)) {
          return true;
        }

        // Check if stochastic 500 error banner appeared
        if (await this.isDisplayed(this.errorBanner, 3000)) {
          if (await this.isDisplayed(this.retryPaymentButton, 3000)) {
            await this.clickElement(this.retryPaymentButton);
          }
        }
      }

      // Final wait for confirmation
      await this.waitForElement(this.orderConfirmation, 10000);
      return true;
    });
  }

  async isOrderConfirmed(): Promise<boolean> {
    return this.isDisplayed(this.orderConfirmation, 10000);
  }

  async isErrorBannerDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.errorBanner, 3000);
  }

  async clickRetryPayment(): Promise<void> {
    await this.clickElement(this.retryPaymentButton);
  }
}

export const checkoutScreen = new CheckoutScreen();

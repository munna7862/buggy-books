import { BasePage } from '../core/base/base.page';
import { expect, Locator, Page } from '@playwright/test';

export class CheckoutPage extends BasePage {
  private static readonly DEFAULT_SHIPPING_ADDRESS = '123 Buggy Lane';
  private static readonly DEFAULT_SHIPPING_CITY = 'Stack City';

  private readonly checkoutSummary: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly shippingAddressInput: Locator;
  private readonly cityInput: Locator;
  private readonly cardNumberInput: Locator;
  private readonly expiryInput: Locator;
  private readonly cvvInput: Locator;
  private readonly nextStepButton: Locator;
  private readonly finalSubmitButton: Locator;
  private readonly orderConfirmationMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.checkoutSummary = this.page.getByRole('main');
    this.firstNameInput = this.page.locator('input[name="txt_f1"], input[name="firstName"]');
    this.lastNameInput = this.page.locator('input[name="txt_f2"], input[name="lastName"]');
    this.shippingAddressInput = this.page.locator('input[name="txt_addr_12"], input[placeholder="123 Buggy Lane"]');
    this.cityInput = this.page.locator('input[name="txt_city_34"], input[placeholder="Stack City"]');
    this.cardNumberInput = this.page.locator('input[name="creditCard"], input[name="txt_c99"], input[placeholder="16-digit card number"]');
    this.expiryInput = this.page.locator('input[name="txt_exp_56"], input[placeholder="MM/YY"]');
    this.cvvInput = this.page.locator('input[name="txt_cvv_78"], input[placeholder="3 digits"]');
    this.nextStepButton = this.page.locator('button#wizard-next-btn');
    this.finalSubmitButton = this.page.getByRole('button', { name: 'Complete Payment' });
    this.orderConfirmationMessage = this.page.locator('.payment-success-card');
  }

  public async getOrderTotalAmountText(): Promise<string> {
    await this.logMessage('INFO', 'Getting checkout order total amount');
    await this.checkoutSummary.waitFor({ state: 'visible', timeout: 60000 });
    const text = await this.checkoutSummary.textContent() ?? '';
    await this.logMessage('INFO', `Checkout summary is visible, retrieving total amount text is: ${text}`);
    return text;
  }

  public async waitForOrderTotalAmount(expectedTotal: string): Promise<void> {
    await this.logMessage('INFO', `Waiting for checkout order total amount: ${expectedTotal}`);
    await expect(this.checkoutSummary).toContainText(expectedTotal, { timeout: 60000 });
  }

  public async enterFirstName(firstName: string): Promise<void> {
    await this.doEnterText(this.firstNameInput, firstName, `Entering first name: ${firstName}`);
  }

  public async enterLastName(lastName: string): Promise<void> {
    await this.doEnterText(this.lastNameInput, lastName, `Entering last name: ${lastName}`);
  }

  public async enterShippingAddress(address: string): Promise<void> {
    await this.doEnterText(this.shippingAddressInput, address, `Entering shipping address: ${address}`);
  }

  public async enterCity(city: string): Promise<void> {
    await this.doEnterText(this.cityInput, city, `Entering city: ${city}`);
  }

  public async enterCardNumber(cardNumber: string): Promise<void> {
    await this.doEnterText(this.cardNumberInput, cardNumber, 'Entering card number');
  }

  public async enterExpiry(expiry: string): Promise<void> {
    await this.doEnterText(this.expiryInput, expiry, `Entering card expiry: ${expiry}`);
  }

  public async enterCvv(cvv: string): Promise<void> {
    await this.doEnterText(this.cvvInput, cvv, `Entering card CVV: ${cvv}`);
  }

  public async clickNextStep(): Promise<void> {
    await this.doClick(this.nextStepButton, 'Clicking on Next Step button');
    await this.cardNumberInput.waitFor({ state: 'visible', timeout: 60000 });
  }

  public async clickFinalSubmit(): Promise<void> {
    if (await this.doesElementExist(this.nextStepButton, 'Checking if Next Step button is visible')) {
      await this.doClick(this.nextStepButton, 'Clicking on Next Step button on Payment page');
    } else {
      await this.doClick(this.finalSubmitButton, 'Clicking on Complete Payment button on Confirm page');
    }
  }

  private async fillShippingDetails(firstName: string, lastName: string): Promise<void> {
    await this.enterFirstName(firstName);
    await this.enterLastName(lastName);
    await this.enterShippingAddress(CheckoutPage.DEFAULT_SHIPPING_ADDRESS);
    await this.enterCity(CheckoutPage.DEFAULT_SHIPPING_CITY);
    await this.clickNextStep();
  }

  private async fillPaymentDetails(cardNumber: string): Promise<void> {
    await this.enterCardNumber(cardNumber);
    await this.enterExpiry('12/30');
    await this.enterCvv('123');
  }

  private async waitForConfirmationMessage(expectedMessage: string): Promise<void> {
    await this.logMessage('INFO', `Waiting for confirmation message containing: ${expectedMessage}`);
    await expect(this.orderConfirmationMessage).toBeVisible({ timeout: 60000 });
    const cardText = (await this.orderConfirmationMessage.textContent() || '').replace(/\s+/g, ' ');
    expect(cardText).toContain('Payment Successful');
    expect(cardText).toContain('Thank you for your order');
  }

  private async submitPaymentUntilConfirmation(expectedMessage: string, maxAttempts: number, successMessage: string): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.clickFinalSubmit();
      try {
        await this.waitForConfirmationMessage(expectedMessage);
        await this.logMessage('INFO', successMessage);
        return;
      } catch (error: unknown) {
        if (attempt === maxAttempts) {
          throw error;
        }
        await this.logMessage('WARN', `Payment attempt ${attempt} did not complete successfully. Retrying payment.`);
      }
    }
  }

  public async getOrderConfirmationMessage(): Promise<string> {
    const text = await this.doGetText(this.orderConfirmationMessage, 'Getting order confirmation message');
    return text.replace(/\s+/g, ' ').trim();
  }

  public async waitForOrderConfirmationMessage(expectedMessage: string): Promise<void> {
    await this.logMessage('INFO', `Waiting for order confirmation message: ${expectedMessage}`);
    await expect(this.orderConfirmationMessage).toBeVisible({ timeout: 60000 });
    const cardText = (await this.orderConfirmationMessage.textContent() || '').replace(/\s+/g, ' ');
    expect(cardText).toContain('Payment Successful');
    expect(cardText).toContain('Thank you for your order');
  }

  public async completePaymentSuccessfully(firstName: string, lastName: string, cardNumber: string, expectedMessage: string, maxAttempts: number = 3): Promise<void> {
    await this.fillShippingDetails(firstName, lastName);
    await this.fillPaymentDetails(cardNumber);
    await this.submitPaymentUntilConfirmation(expectedMessage, maxAttempts, 'Payment completed successfully and order confirmation message is displayed.');
  }

  public async completePaymentAfterInvalidCardRetry(firstName: string, lastName: string, invalidCardNumber: string, validCardNumber: string, expectedMessage: string, retryAttempts: number = 3): Promise<void> {
    await this.fillShippingDetails(firstName, lastName);
    await this.enterCardNumber(invalidCardNumber);
    await this.enterExpiry('12/30');
    await this.enterCvv('123');
    await this.clickFinalSubmit();
    await this.logMessage('WARN', 'Invalid card entered; retrying with valid card number');
    await this.fillPaymentDetails(validCardNumber);
    await this.submitPaymentUntilConfirmation(expectedMessage, retryAttempts, 'Payment completed successfully after correcting card number.');
  }
}

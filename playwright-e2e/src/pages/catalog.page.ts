import { BasePage } from '../core/base/base.page';
import { expect, Locator } from '@playwright/test';

export class CatalogPage extends BasePage {

  // Define locators for the Sign Up page elements
  private get btnLogout(): Locator {
    return this.page.locator("//button[text()='Logout']");
  }

  private getNavigateLink(sLink: string): Locator {
    return this.page.locator(`//a[text()='${sLink}']`);
  }

  private get eleBooksCount(): Locator {
    return this.page.locator('.complex-item-box-alpha');
  }

  private getpaginationButton(btnNumber: number): Locator {
    return this.page.locator(`//button[@id='pagination-page-${btnNumber}']`);
  }

  private getAddToCartButton(bookId: number): Locator {
    return this.page.locator(`#add-to-cart-${bookId}`);
  }

  private get alertStatus(): Locator {
    return this.page.getByRole('status');
  }


  // Add methods to interact with the Sign Up page elements
  public async navigateToCatalog(baseUrl: string): Promise<void> {
    await this.logMessage('INFO', `Navigating to catalog page: ${baseUrl}`);
    await this.page.goto(baseUrl);
  }

  public async clickNavigateLink(sLink: string) {
    await this.doClick(this.getNavigateLink(sLink), `Clicking on ${sLink} link`);
  }

  public async clickLogout() {
    await this.doClick(this.btnLogout, "Clicking on Logout button");
  }

  public async verifyCheckoutPage() {
    await this.logMessage('INFO', "Verifying landing on Checkout Page");
    let actualText = await this.doGetText(this.getNavigateLink("Checkout"), "Checking if Checkout label is visible");
    await this.logMessage('INFO', "Landed on Checkout Page successfully and Text is: " + actualText);
    return actualText?.trim() === "Checkout" ? true : false;
  }

  public async isLoginVisible() {
    await this.getNavigateLink("Login").waitFor({ state: 'visible', timeout: 5000 });
    return await this.doesElementExist(this.getNavigateLink("Login"), "Checking if Login link is visible on Catalog page");
  }

  public async getBooksCount() {
    await this.eleBooksCount.first().waitFor({ state: 'visible', timeout: 5000 });
    let count = await this.eleBooksCount.count();
    await this.logMessage('INFO', "Total Books displayed in Catalog page are: " + count);
    return count;
  }

  public async clickPaginationButton(btnNumber: number) {
    await this.doClick(this.getpaginationButton(btnNumber), `Clicking on Pagination button number ${btnNumber}`);
    for (let i = 0; i < 5; i++) { // Retry mechanism to handle potential timing issues
      await this.page.waitForTimeout(2000); // Wait before retrying
      let buttonClass = await this.doGetAttribute(this.getpaginationButton(btnNumber), "class", `Checking if Pagination button number ${btnNumber} is active after click`);
      await this.logMessage('INFO', `Pagination button number ${btnNumber} class attribute after click: ${buttonClass}`);
      if (buttonClass && buttonClass.includes("active")) {
        break; // Exit loop if button is active
      }
      else {
        await this.logMessage('WARN', `Pagination button number ${btnNumber} is not active yet. Retrying... (${i + 1}/5)`);
      }
    }
  }

  public async clickAddToCartForBook(bookId: number): Promise<void> {
    await this.doClick(this.getAddToCartButton(bookId), `Clicking on Add to Cart button for book id: ${bookId}`);
  }

  public async getCartStatusMessage(): Promise<string> {
    return await this.doGetText(this.alertStatus, "Getting add to cart status message");
  }

  public async waitForCartStatusMessage(expectedMessage: string): Promise<void> {
    await this.logMessage('INFO', `Waiting for cart status message: ${expectedMessage}`);
    await expect(this.page.getByRole('status').filter({ hasText: expectedMessage })).toBeVisible({ timeout: 60000 });
    await this.logMessage('INFO', `Cart status message "${expectedMessage}" is visible`);
  }

  public async addBookToCart(bookId: number): Promise<void> {
    await this.clickAddToCartForBook(bookId);
  }

}

import { BasePage } from '../core/base/base.page';
import { expect, Locator } from '@playwright/test';

export class CatalogPage extends BasePage {

  // Locators
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

  private get inputSearch(): Locator {
    return this.page.locator('#book-search-input');
  }

  private get btnSearch(): Locator {
    return this.page.locator('#book-search-btn');
  }

  private get btnClearSearch(): Locator {
    return this.page.locator('#book-search-clear-btn');
  }

  private get eleResultCount(): Locator {
    return this.page.locator('.catalog-result-count');
  }

  private get eleEmptyCatalog(): Locator {
    return this.page.locator('.catalog-empty');
  }

  private getBookTitleLink(bookId: string | number): Locator {
    return this.page.locator(`.info-cell-beta a[href="/books/${bookId}"]`);
  }


  // Actions and Interaction Methods
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
    await this.eleBooksCount.first().waitFor({ state: 'visible', timeout: 60000 });
    let count = await this.eleBooksCount.count();
    await this.logMessage('INFO', "Total Books displayed in Catalog page are: " + count);
    return count;
  }

  public async getDisplayedBooksCount(): Promise<number> {
    return await this.eleBooksCount.count();
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

  public async searchBooks(term: string): Promise<void> {
    await this.doEnterText(this.inputSearch, term, `Filling search input with: ${term}`);
    await this.doClick(this.btnSearch, `Clicking Search button`);
    await this.eleResultCount.or(this.eleEmptyCatalog).first().waitFor({ state: 'visible', timeout: 30000 });
  }

  public async clearSearch(): Promise<void> {
    await this.doClick(this.btnClearSearch, `Clicking Clear search button`);
    await this.btnClearSearch.waitFor({ state: 'hidden', timeout: 10000 });
    await this.page.waitForResponse(res => res.url().includes('/api/books') && res.status() === 200);
  }



  public async getResultCountText(): Promise<string> {
    return await this.doGetText(this.eleResultCount, `Getting catalog result count text`);
  }

  public async getEmptyStateText(): Promise<string> {
    return await this.doGetText(this.eleEmptyCatalog, `Getting catalog empty state text`);
  }

  public async clickBookTitle(bookId: string | number): Promise<void> {
    await this.doClick(this.getBookTitleLink(bookId), `Clicking on book title link for book ID: ${bookId}`);
  }

  public async getFirstBookTitle(): Promise<string> {
    return await this.doGetText(this.page.locator('.title-variant-2 a').first(), `Getting first book title in catalog`);
  }

  public async clickAddToCartForBook(bookId: number): Promise<void> {
    await this.doClick(this.getAddToCartButton(bookId), `Clicking on Add to Cart button for book id: ${bookId}`);
  }

  public async getCartStatusMessage(): Promise<string> {
    return await this.doGetText(this.alertStatus, "Getting add to cart status message");
  }

  public async waitForCartStatusMessage(expectedMessage: string): Promise<void> {
    await this.logMessage('INFO', `Waiting for cart status message: ${expectedMessage}`);
    await expect(this.page.getByRole('status').filter({ hasText: expectedMessage }).first()).toBeVisible({ timeout: 60000 });
    await this.logMessage('INFO', `Cart status message "${expectedMessage}" is visible`);
  }

  public async addBookToCart(bookId: number): Promise<void> {
    const responsePromise = this.page.waitForResponse(res => res.url().includes('/api/cart') && res.status() === 200);
    await this.clickAddToCartForBook(bookId);
    await responsePromise;
    await this.waitForCartStatusMessage('added to cart');
  }

}

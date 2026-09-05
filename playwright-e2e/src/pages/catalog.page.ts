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

  private get firstBookTitle(): Locator {
    return this.page.locator('.title-variant-2 a').first();
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
    const linkLocator = this.getNavigateLink(sLink);
    await this.ensureNavElementVisible(linkLocator);
    await this.doClick(linkLocator, `Clicking on ${sLink} link`);
  }

  public async clickLogout() {
    await this.ensureNavElementVisible(this.btnLogout);
    await this.doClick(this.btnLogout, "Clicking on Logout button");
  }

  public async verifyCheckoutPage() {
    await this.logMessage('INFO', "Verifying landing on Checkout Page");
    const checkoutLink = this.getNavigateLink("Checkout");
    await this.ensureNavElementVisible(checkoutLink);
    let actualText = await this.doGetText(checkoutLink, "Checking if Checkout label is visible");
    await this.logMessage('INFO', "Landed on Checkout Page successfully and Text is: " + actualText);
    return actualText?.trim() === "Checkout" ? true : false;
  }

  public async isLoginVisible() {
    const loginLink = this.getNavigateLink("Login");
    await this.ensureNavElementVisible(loginLink);
    await loginLink.waitFor({ state: 'visible', timeout: 5000 });
    return await this.doesElementExist(loginLink, "Checking if Login link is visible on Catalog page");
  }

  public async isLogoutVisible(): Promise<boolean> {
    await this.ensureNavElementVisible(this.btnLogout);
    await this.btnLogout.waitFor({ state: 'visible', timeout: 5000 });
    return await this.doesElementExist(this.btnLogout, "Checking if Logout button is visible on Catalog page");
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
    const btn = this.getpaginationButton(btnNumber);
    await this.doClick(btn, `Clicking on Pagination button number ${btnNumber}`);
    await expect(btn).toHaveClass(/active/, { timeout: 10000 }).catch(() => undefined);
  }

  public async searchBooks(term: string): Promise<void> {
    await this.doEnterText(this.inputSearch, term, `Filling search input with: ${term}`);
    await this.doClick(this.btnSearch, `Clicking Search button`);
    await this.eleResultCount.or(this.eleEmptyCatalog).first().waitFor({ state: 'visible', timeout: 30000 });
  }

  public async clearSearch(): Promise<void> {
    const responsePromise = this.page.waitForResponse(res => res.url().includes('/api/books') && res.status() === 200);
    await this.doClick(this.btnClearSearch, `Clicking Clear search button`);
    await responsePromise;
    await this.btnClearSearch.waitFor({ state: 'hidden', timeout: 10000 });
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
    return await this.doGetText(this.firstBookTitle, `Getting first book title in catalog`);
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

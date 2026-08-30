import { BasePage } from '../core/base/base.page';
import { Locator, Page } from '@playwright/test';

export class BookDetailPage extends BasePage {
  private get eleTitle(): Locator {
    return this.page.locator('#book-detail-title');
  }

  private get eleAuthor(): Locator {
    return this.page.locator('#book-detail-author');
  }

  private get eleDescription(): Locator {
    return this.page.locator('#book-detail-description');
  }

  private get elePrice(): Locator {
    return this.page.locator('#book-detail-price');
  }

  private get eleCoverImg(): Locator {
    return this.page.locator('#book-detail-cover-img');
  }

  private get linkBack(): Locator {
    return this.page.locator('#book-detail-back-link');
  }

  private get btnAddToCart(): Locator {
    return this.page.locator('#book-detail-add-to-cart');
  }

  constructor(page: Page) {
    super(page);
  }

  public async getBookTitle(): Promise<string> {
    return await this.doGetText(this.eleTitle, "Getting book detail title");
  }

  public async getBookAuthor(): Promise<string> {
    return await this.doGetText(this.eleAuthor, "Getting book detail author");
  }

  public async getBookDescription(): Promise<string> {
    return await this.doGetText(this.eleDescription, "Getting book detail description");
  }

  public async getBookPrice(): Promise<string> {
    return await this.doGetText(this.elePrice, "Getting book detail price");
  }


  public async clickBackToCatalog(): Promise<void> {
    await this.doClick(this.linkBack, "Clicking Back to Catalog link");
  }

  public async clickAddToCart(): Promise<void> {
    await this.doClick(this.btnAddToCart, "Clicking Add to Cart button on Book Detail page");
  }
}

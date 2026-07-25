import { BasePage } from '../core/base/base.page';
import { Locator, Page } from '@playwright/test';

export class BookDetailPage extends BasePage {
  private readonly eleTitle: Locator;
  private readonly eleAuthor: Locator;
  private readonly eleDescription: Locator;
  private readonly elePrice: Locator;
  private readonly eleCoverImg: Locator;
  private readonly linkBack: Locator;
  private readonly btnAddToCart: Locator;

  constructor(page: Page) {
    super(page);
    this.eleTitle = this.page.locator('#book-detail-title');
    this.eleAuthor = this.page.locator('#book-detail-author');
    this.eleDescription = this.page.locator('#book-detail-description');
    this.elePrice = this.page.locator('#book-detail-price');
    this.eleCoverImg = this.page.locator('#book-detail-cover-img');
    this.linkBack = this.page.locator('#book-detail-back-link');
    this.btnAddToCart = this.page.locator('#book-detail-add-to-cart');
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

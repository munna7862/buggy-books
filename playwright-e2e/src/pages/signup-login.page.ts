import { BasePage } from '../core/base/base.page';
import { Locator } from '@playwright/test';
import { CatalogPage } from './catalog.page';

export class SignUpPage extends BasePage {

  // Define locators for the Sign Up page elements
  private get lblSignUpPage(): Locator {
    return this.page.locator("//a[text()='Sign Up']");
  }
  private get tfldFullName(): Locator {
    return this.page.locator("//label[text()='Full Name']/following-sibling::input[@class='auth-input']");
  }
  private get tfldUsername(): Locator {
    return this.page.locator("//label[text()='Username']/following-sibling::input[@class='auth-input']");
  }
  private get tfldPassword(): Locator {
    return this.page.locator("//label[text()='Password']/following-sibling::input[@class='auth-input']");
  }
  private get tfldConfirmPwd(): Locator {
    return this.page.locator("//label[text()='Confirm Password']/following-sibling::input[@class='auth-input']");
  }
  private get btnCreateAccount(): Locator {
    return this.page.locator("//button[@type='submit']");
  }
  private get btnSignIn(): Locator {
    return this.page.locator("//button[@name='btn_submit_login_rnd']");
  }

  // Add methods to interact with the Sign Up page elements
  public async clickSignUp() {
    await this.doClick(this.lblSignUpPage, "Clicking on Sign Up link");
  }

  public async enterFullName(fullName: string) {
    await this.doEnterText(this.tfldFullName, fullName, "Entering full name: " + fullName);
  }

  public async enterUsername(username: string) {
    await this.doEnterText(this.tfldUsername, username, "Entering username: " + username);
  }

  public async enterPassword(password: string) {
    await this.doEnterText(this.tfldPassword, password, "Entering password: " + password);
  }

  public async enterConfirmPassword(confirmPassword: string) {
    await this.doEnterText(this.tfldConfirmPwd, confirmPassword, "Entering confirming password: " + confirmPassword);
  }

  public async clickCreateAccount() {
    await this.doClick(this.btnCreateAccount, "Clicking on Create Account button");
  }

  public async clickSignIn() {
    await this.doClick(this.btnSignIn, "Clicking on Sign In button");
  }

  public async registerNewUser(fullName: string, username: string, password: string, confirmPassword: string) {
    await this.enterFullName(fullName);
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.enterConfirmPassword(confirmPassword);
    await this.clickCreateAccount();
    const catalogPage = new CatalogPage(this.page);
    return await catalogPage.verifyCheckoutPage();
  }

  public async login(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSignIn();
    const catalogPage = new CatalogPage(this.page);
    return await catalogPage.verifyCheckoutPage();
  }

}

import { BaseMobileScreen } from '../core/BaseMobileScreen.js';

export class LoginScreen extends BaseMobileScreen {
  constructor() {
    super('LoginScreen');
  }

  // Locators (MOB-B1 obfuscated testIDs)
  private get usernameInput() {
    return 'txt_usr_77';
  }

  private get passwordInput() {
    return 'txt_pwd_99';
  }

  private get submitButton() {
    return 'btn_login_submit';
  }

  private get errorMessage() {
    return 'txt_login_error';
  }

  private get registerNavButton() {
    return 'btn_nav_register';
  }

  async isLoaded(): Promise<boolean> {
    return this.isDisplayed(this.usernameInput);
  }

  async login(username: string, password: string):Promise<void> {
    await this.step(`Log in as "${username}"`, async () => {
      await this.typeText(this.usernameInput, username, false);
      await this.typeText(this.passwordInput, password, true);
      await this.hideKeyboard();
      await this.clickElement(this.submitButton);
    });
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async isErrorDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.errorMessage);
  }

  async navigateToRegister(): Promise<void> {
    await this.clickElement(this.registerNavButton);
  }
}

export const loginScreen = new LoginScreen();

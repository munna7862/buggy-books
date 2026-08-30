import { BasePage } from '../core/base/base.page';
import { expect, Locator, Page } from '@playwright/test';

export class ProfilePage extends BasePage {

  // Locators
  private get avatarPreview(): Locator {
    return this.page.locator('#profile-avatar-preview');
  }

  private get avatarInput(): Locator {
    return this.page.locator('#profile-avatar-input');
  }

  private get uploadButton(): Locator {
    return this.page.locator('#profile-upload-btn');
  }

  private get uploadStatusSuccess(): Locator {
    return this.page.locator('#upload-status');
  }

  private get uploadStatusError(): Locator {
    return this.page.locator('#upload-error');
  }

  private get navProfileLink(): Locator {
    return this.page.locator('#nav-profile-link');
  }

  private get headingUserProfile(): Locator {
    return this.page.getByRole('heading', { name: 'User Profile' });
  }

  private get profileInfoSection(): Locator {
    return this.page.locator('.profile-info-section');
  }

  constructor(page: Page) {
    super(page);
  }

  // Actions and Interaction Methods
  public async clickProfileLink(): Promise<void> {
    await this.doClick(this.navProfileLink, "Clicking on Profile navbar link");
  }

  public async openProfile(): Promise<void> {
    const responsePromise = this.page.waitForResponse(res => res.url().includes('/api/profile') && res.status() === 200).catch(() => undefined);
    await this.clickProfileLink();
    await responsePromise;
    await this.headingUserProfile.waitFor({ state: 'visible', timeout: 10000 });
  }

  public async selectAvatarFile(filePath: string): Promise<void> {
    await this.logMessage('INFO', `Selecting file for avatar upload: ${filePath}`);
    await this.avatarInput.setInputFiles(filePath);
  }

  public async clickUploadButton(): Promise<void> {
    await this.doClick(this.uploadButton, "Clicking Upload Image button");
  }

  public async uploadAvatar(filePath: string): Promise<void> {
    await this.selectAvatarFile(filePath);
    await expect(this.uploadButton).toBeEnabled({ timeout: 5000 });
    const responsePromise = this.page.waitForResponse(res => res.url().includes('/api/profile/upload')).catch(() => undefined);
    await this.clickUploadButton();
    await responsePromise;
    // Wait for either success status or error banner to appear in DOM so React has finished state update
    await Promise.race([
      this.uploadStatusSuccess.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined),
      this.uploadStatusError.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined),
    ]);
  }

  public async getAvatarPreviewSrc(): Promise<string> {
    await this.logMessage('INFO', "Getting profile avatar preview image src");
    await this.avatarPreview.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.avatarPreview).toHaveAttribute('src', /\/uploads\//, { timeout: 5000 }).catch(() => undefined);
    return (await this.avatarPreview.getAttribute('src')) ?? '';
  }

  public async getSuccessMessageText(): Promise<string> {
    return await this.doGetText(this.uploadStatusSuccess, "Getting upload success message text");
  }

  public async getProfileInfoText(): Promise<string> {
    await this.profileInfoSection.waitFor({ state: 'visible', timeout: 10000 });
    return (await this.doGetText(this.profileInfoSection, "Getting profile info section text")) || '';
  }

  public async getErrorMessageText(): Promise<string> {
    return await this.doGetText(this.uploadStatusError, "Getting upload error message text");
  }

}

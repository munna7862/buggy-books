import { loginScreen } from '../screens/LoginScreen.js';
import { catalogScreen } from '../screens/CatalogScreen.js';
import { navigationTab } from '../screens/NavigationTab.js';

describe('Mobile Authentication Flow (MOB_E2E_01)', () => {
  it('should display error message on invalid credentials', async () => {
    // Attempt login with invalid credentials
    await loginScreen.login('invalid_user_77', 'wrong_password_99');

    const isErrorVisible = await loginScreen.isErrorDisplayed();
    expect(isErrorVisible).toBe(true);

    const errorText = await loginScreen.getErrorMessage();
    expect(errorText).toContain('Invalid');
  });

  it('should log in successfully with valid credentials and obfuscated locators', async () => {
    // Valid login using obfuscated testIDs (MOB-B1: txt_usr_77, txt_pwd_99)
    await loginScreen.login('testuser', 'password123');

    // Assert Catalog screen is loaded
    const isCatalogLoaded = await catalogScreen.isLoaded();
    expect(isCatalogLoaded).toBe(true);
  });

  it('should allow user to navigate to profile and log out', async () => {
    // Navigate to profile and trigger logout
    await navigationTab.logout();

    // Verify back on login screen
    const isLoginLoaded = await loginScreen.isLoaded();
    expect(isLoginLoaded).toBe(true);
  });
});

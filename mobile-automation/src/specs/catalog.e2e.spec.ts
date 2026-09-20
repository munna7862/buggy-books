import { loginScreen } from '../screens/LoginScreen.js';
import { catalogScreen } from '../screens/CatalogScreen.js';
import { cartScreen } from '../screens/CartScreen.js';
import { navigationTab } from '../screens/NavigationTab.js';

describe('Catalog Search & Dynamic Add-To-Cart Latency (MOB_E2E_02 & MOB_E2E_03)', () => {
  before(async () => {
    // Ensure logged in
    if (await loginScreen.isLoaded()) {
      await loginScreen.login('testuser', 'password123');
    }
  });

  it('should search for books and update results count', async () => {
    await navigationTab.openCatalog();
    await catalogScreen.searchBooks('JavaScript');

    const resultsCount = await catalogScreen.getResultsCountText();
    expect(resultsCount).toBeDefined();

    // Clear filter
    await catalogScreen.clearSearch();
  });

  it('should handle dynamic add-to-cart delay (MOB-B3) and reflect in cart', async () => {
    await navigationTab.openCatalog();

    // Quick add first item, awaiting dynamic delay (500-3500ms)
    await catalogScreen.quickAddToCart('book-1');

    // Verify item in cart
    await navigationTab.openCart();
    const isCartLoaded = await cartScreen.isLoaded();
    expect(isCartLoaded).toBe(true);

    const isCartEmpty = await cartScreen.isCartEmpty();
    expect(isCartEmpty).toBe(false);
  });
});

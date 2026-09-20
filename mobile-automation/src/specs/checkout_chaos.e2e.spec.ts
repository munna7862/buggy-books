import { loginScreen } from '../screens/LoginScreen.js';
import { catalogScreen } from '../screens/CatalogScreen.js';
import { cartScreen } from '../screens/CartScreen.js';
import { checkoutScreen } from '../screens/CheckoutScreen.js';
import { navigationTab } from '../screens/NavigationTab.js';

describe('Checkout Occlusion & Stochastic Gateway Retry Loop (MOB_E2E_03 & MOB_E2E_04)', () => {
  before(async () => {
    // Ensure logged in
    if (await loginScreen.isLoaded()) {
      await loginScreen.login('testuser', 'password123');
    }

    // Ensure at least one item in cart
    await navigationTab.openCart();
    if (await cartScreen.isCartEmpty()) {
      await navigationTab.openCatalog();
      await catalogScreen.quickAddToCart('book-1');
      await navigationTab.openCart();
    }
  });

  it('should proceed to checkout and fill form with obfuscated locators (MOB-B1)', async () => {
    await cartScreen.proceedToCheckout();
    const isCheckoutLoaded = await checkoutScreen.isLoaded();
    expect(isCheckoutLoaded).toBe(true);

    // Fill form and dismiss soft keyboard to overcome keyboard occlusion (MOB-B2)
    await checkoutScreen.fillCheckoutForm({
      firstName: 'Jane',
      lastName: 'Doe',
      address: '123 Buggy Lane, Suite 404',
      cardNumber: '4242424242424242',
    });
  });

  it('should place order and resolve stochastic 500 retry loop (MOB-B4)', async () => {
    const isConfirmed = await checkoutScreen.submitOrderWithRetryLoop(3);
    expect(isConfirmed).toBe(true);
  });
});

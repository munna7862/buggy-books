import { loginScreen } from '../screens/LoginScreen.js';
import { catalogScreen } from '../screens/CatalogScreen.js';
import { cartScreen } from '../screens/CartScreen.js';
import { checkoutScreen } from '../screens/CheckoutScreen.js';
import { navigationTab } from '../screens/NavigationTab.js';

describe('Orientation Layout Shift Chaos (MOB_E2E_06)', () => {
  before(async () => {
    // Ensure logged in
    if (await loginScreen.isLoaded()) {
      await loginScreen.login('testuser', 'password123');
    }

    // Ensure item in cart and proceed to checkout
    await navigationTab.openCart();
    if (await cartScreen.isCartEmpty()) {
      await navigationTab.openCatalog();
      await catalogScreen.quickAddToCart('book-1');
      await navigationTab.openCart();
    }
    await cartScreen.proceedToCheckout();
    await checkoutScreen.waitForElement('txt_f1');
  });

  after(async () => {
    // Ensure device restored to portrait
    try {
      await checkoutScreen.setOrientation('PORTRAIT');
    } catch {
      // Ignore cleanup error if already portrait
    }
  });

  it('should rotate device to LANDSCAPE and verify layout shift handling (MOB-B6)', async () => {
    await checkoutScreen.setOrientation('LANDSCAPE');
    const orientation = await checkoutScreen.getOrientation();
    expect(orientation.toUpperCase()).toBe('LANDSCAPE');

    // Fill inputs in landscape mode
    await checkoutScreen.fillCheckoutForm({
      firstName: 'Alice',
      lastName: 'Smith',
      address: '789 Landscape Ave',
      cardNumber: '5555555555555555',
    });

    // Scroll to reveal CTA in landscape layout
    await checkoutScreen.swipeUp();

    const isPlaceOrderVisible = await checkoutScreen.isDisplayed('btn_place_order');
    expect(isPlaceOrderVisible).toBe(true);
  });

  it('should restore device to PORTRAIT and maintain form integrity', async () => {
    await checkoutScreen.setOrientation('PORTRAIT');
    const orientation = await checkoutScreen.getOrientation();
    expect(orientation.toUpperCase()).toBe('PORTRAIT');

    const isFormLoaded = await checkoutScreen.isLoaded();
    expect(isFormLoaded).toBe(true);
  });
});

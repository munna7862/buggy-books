import { expect } from '@playwright/test';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { test } from '../../../core/base/base.fixture';
import { envConfig } from '../../../config/env.config';
import { CartPage } from '../../../pages/cart.page';

type CartQuantityTestData = {
  user: {
    fullName: string;
    password: string;
  };
  books: {
    firstSearch: string;
    firstBookId: number;
    firstBookTitle: string;
    secondSearch: string;
    secondBookId: number;
    secondBookTitle: string;
  };
};

const testDataPath = path.join(__dirname, '../../../test-data/ui/Checkout/Test_006_CartQuantityAdjustment.json');
const TestData = require(testDataPath) as CartQuantityTestData;

function uniqueUsername(prefix: string = 'cart_qty_user'): string {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

test.describe('Cart Quantity & Total Adjustment', () => {

  test('UI_CART_04: Cart item addition and removal dynamically recalculates item count and order total', async ({ signUpPage, catalogPage, commonFunctions, page, networkInterceptor }) => {
    const cartPage = new CartPage(page);
    const username = uniqueUsername();

    let isStep1Valid = false;
    let isStep2Valid = false;
    let isStep3Valid = false;
    let initialSinglePrice = 0;

    await test.step('Register new user session', async () => {
      await catalogPage.navigateToCatalog(envConfig.baseUrl);
      await catalogPage.clickNavigateLink('Sign Up');
      await signUpPage.registerNewUser(TestData.user.fullName, username, TestData.user.password, TestData.user.password);
    });

    await test.step('Add first book to cart and verify single item total', async () => {
      await catalogPage.clickNavigateLink('Catalog');
      await catalogPage.searchBooks(TestData.books.firstSearch);
      await catalogPage.addBookToCart(TestData.books.firstBookId);
      await catalogPage.waitForCartStatusMessage('added to cart');

      await cartPage.openCart();
      const count = await cartPage.getCartItemsCount();
      initialSinglePrice = await cartPage.getCartTotalAmount();

      const countCheck = count === 1;
      const priceCheck = initialSinglePrice > 0;
      isStep1Valid = await commonFunctions.compareTwoValues(countCheck && priceCheck, true, 'Verifying 1 item in cart with non-zero total price');
    });

    await test.step('Add second book to cart and verify dynamic subtotal increment', async () => {
      await catalogPage.clickNavigateLink('Catalog');
      await catalogPage.searchBooks(TestData.books.secondSearch);
      await catalogPage.addBookToCart(TestData.books.secondBookId);
      await catalogPage.waitForCartStatusMessage('added to cart');

      await cartPage.openCart();
      const updatedCount = await cartPage.getCartItemsCount();
      const updatedTotal = await cartPage.getCartTotalAmount();

      const countIncreased = updatedCount === 2;
      const totalIncreased = updatedTotal > initialSinglePrice;
      isStep2Valid = await commonFunctions.compareTwoValues(countIncreased && totalIncreased, true, 'Verifying cart item count increased to 2 and grand total updated dynamically');
    });

    await test.step('Remove first book and verify cart total decreases dynamically', async () => {
      const totalBeforeRemove = await cartPage.getCartTotalAmount();
      await cartPage.removeFirstCartItem();

      const finalCount = await cartPage.getCartItemsCount();
      const finalTotal = await cartPage.getCartTotalAmount();

      const countDecreased = finalCount === 1;
      const totalDecreased = finalTotal < totalBeforeRemove;
      isStep3Valid = await commonFunctions.compareTwoValues(countDecreased && totalDecreased, true, 'Verifying cart item count decreased to 1 and grand total reduced dynamically');
    });

    expect(isStep1Valid && isStep2Valid && isStep3Valid).toBeTruthy();
  });

});

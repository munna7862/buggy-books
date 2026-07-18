# BuggyBooks E2E Test Suite Documentation

## Overview
This test suite provides comprehensive end-to-end testing for the BuggyBooks e-commerce application (https://buggy-books-fe.onrender.com/). The suite tests the complete user journey from browsing the catalog, adding items to cart, and completing a checkout process.

## Test Structure

### Page Objects
The test suite uses the Page Object Model (POM) pattern with the following page classes:

#### 1. **BuggyBooksCatalogPage** (`buggy-books.catalog.page.ts`)
Handles all interactions on the catalog/home page.

**Key Methods:**
- `verifyLandingPage()` - Verifies the catalog page loads correctly
- `verifyHeaderBranding()` - Confirms BuggyBooks branding is displayed
- `addBookToCart(bookTitle: string)` - Adds a specific book to the cart
- `navigateToCart()` - Navigates to the cart page
- `navigateToCatalog()` - Navigates back to catalog
- `navigateToCheckout()` - Navigates directly to checkout

**Key Assertions:**
- Book Catalog heading is visible
- BuggyBooks branding/header is present
- Add to Cart buttons are functional

#### 2. **BuggyBooksCartPage** (`buggy-books.cart.page.ts`)
Manages cart page interactions and validations.

**Key Methods:**
- `verifyCartPageLoaded()` - Confirms cart page loads
- `verifyCartContainsBooks(expectedBookCount: number)` - Validates minimum items in cart
- `getCartTotal(): Promise<string>` - Returns the cart total amount
- `verifyCartTotalIsGreaterThanZero()` - Validates cart total is not zero
- `verifyCartIsNotEmpty()` - Confirms cart has items
- `proceedToCheckout()` - Proceeds to checkout page

**Key Assertions:**
- Your Cart heading is visible
- Cart contains expected number of items
- Cart total is greater than $0.00
- Empty cart message is not displayed

#### 3. **BuggyBooksCheckoutPage** (`buggy-books.checkout.page.ts`)
Handles checkout form and payment processing.

**Key Methods:**
- `verifyCheckoutPageLoaded()` - Confirms checkout page loads
- `verifyOrderSummaryDisplayed()` - Validates order summary section
- `getTotalToPay(): Promise<string>` - Returns total amount to pay
- `fillCheckoutForm(firstName: string, lastName: string, creditCard: string)` - Fills checkout form
- `completePayment()` - Submits payment
- `verifyPaymentSuccessful()` - Confirms successful payment
- `verifyCheckoutFormFieldsExist()` - Validates all form fields are present

**Key Assertions:**
- Checkout heading is visible
- Secure Order Summary section exists
- All form fields (First Name, Last Name, Credit Card) are present
- Payment completion shows success message
- Thank you message is displayed

### Base Classes

#### **BuggyBooksBaseTest** (`core/base/buggy-books.base.test.ts`)
Custom base test class that extends BaseTest and automatically navigates to the BuggyBooks URL.

**Configuration:**
- Uses `envConfig.buggyBooksUrl` from environment configuration
- Supports custom setup options (network capture, etc.)
- Inherits all BaseTest functionality

#### **BaseTest** (`core/base/base.test.ts`)
Foundation class providing common test setup/teardown logic.

**Features:**
- Browser and context initialization
- Page creation and navigation
- Network interception support
- Network log capture and attachment
- Test teardown and cleanup

## Test Cases

### Test Case 1: Verify Catalog Page Loads with Correct Branding
**Purpose:** Validates that the catalog page loads correctly with proper branding

**Test Steps:**
1. Verify landing on catalog page
2. Verify BuggyBooks branding is displayed

**Assertions:**
- ✓ Catalog page heading is visible
- ✓ BuggyBooks brand name is present

**Expected Result:** PASS

---

### Test Case 2: Add Two Books to Cart and Verify Cart Contents
**Purpose:** Tests adding multiple books to cart and validates cart state

**Test Steps:**
1. Load catalog page
2. Add "The Great Buggy Gatsby" to cart
3. Add "To Kill a Mockingbird Exception" to cart
4. Navigate to cart
5. Verify cart contents

**Assertions:**
- ✓ Catalog page loads successfully
- ✓ Cart page loads successfully
- ✓ Cart is not empty
- ✓ Cart contains at least 2 books
- ✓ Cart total is greater than $0.00

**Expected Result:** PASS

---

### Test Case 3: Complete Full Checkout Flow with Payment
**Purpose:** End-to-end test covering the entire purchase flow from catalog to payment

**Test Steps:**
1. Load catalog
2. Add "The Great Buggy Gatsby" to cart
3. Add "To Kill a Mockingbird Exception" to cart
4. Navigate to cart
5. Verify cart contents
6. Proceed to checkout
7. Fill checkout form (First Name: John, Last Name: Doe, Card: 4532015112830366)
8. Complete payment
9. Verify payment success

**Assertions:**
- ✓ Catalog page loads
- ✓ Cart page loads
- ✓ Cart contains items
- ✓ Checkout page loads
- ✓ Order summary is displayed
- ✓ All form fields exist
- ✓ Cart total matches expected format ($XX.XX)
- ✓ Payment successful message displayed
- ✓ Thank you message displayed

**Expected Result:** PASS

---

### Test Case 4: Verify Navigation Between Pages
**Purpose:** Tests navigation between different pages of the application

**Test Steps:**
1. Load catalog
2. Navigate to checkout
3. Verify checkout page loads
4. Navigate back to catalog
5. Verify catalog page loads
6. Navigate to checkout again
7. Verify checkout page loads

**Assertions:**
- ✓ Navigation works correctly
- ✓ Page loads after each navigation

**Expected Result:** PASS

---

### Test Case 5: Verify Order Summary is Displayed on Checkout
**Purpose:** Validates order summary section on checkout page

**Test Steps:**
1. Load catalog
2. Add three books to cart
3. Navigate to checkout
4. Verify order summary is displayed
5. Verify total amount is in correct format

**Assertions:**
- ✓ Checkout page loads
- ✓ Order summary section is visible
- ✓ Total to pay amount is in format $XX.XX

**Expected Result:** PASS

---

### Test Case 6: Verify Cart Items Persist After Navigation
**Purpose:** Tests cart persistence across page navigation

**Test Steps:**
1. Load catalog
2. Add "The Great Buggy Gatsby" to cart
3. Navigate to cart and note total
4. Navigate back to catalog
5. Navigate back to cart
6. Verify same items and total are present

**Assertions:**
- ✓ Cart items remain after navigation
- ✓ Cart total remains consistent

**Expected Result:** PASS

---

## Running the Tests

### Prerequisites
- Node.js 18+ installed
- npm dependencies installed (`npm install`)

### Installation
```bash
cd playwright-e2e
npm install
```

### Run All Tests
```bash
npm run test:interop
```

### Run Specific Test File
```bash
npx playwright test --config=src/config/playwright.config.ts src/tests/ui/Test_003_BuggyBooks_AddToCartAndCheckout.spec.ts
```

### Run Specific Test Case
```bash
npx playwright test --config=src/config/playwright.config.ts -g "Complete Full Checkout Flow"
```

### Run with UI Mode
```bash
npx playwright test --config=src/config/playwright.config.ts --ui
```

### Run with Debug Mode
```bash
npx playwright test --config=src/config/playwright.config.ts --debug
```

### Generate Allure Report
```bash
npm run generate-allure
```

### View Allure Report
```bash
npm run report
```

## Environment Configuration

The tests use environment variables that can be set in a `.env` file:

```env
# URL Configuration
BASE_URL=https://automationexercise.com/
BUGGY_BOOKS_URL=https://buggy-books-fe.onrender.com/

# Browser Configuration
HEADLESS=true
BROWSER=chromium

# API Configuration
API_BASE_URL=https://api.example.com
POSTS_BASE_URL=https://jsonplaceholder.typicode.com

# Environment
ENV=qa
```

## Page Locators Reference

### Catalog Page
| Element | Locator |
|---------|---------|
| Book Catalog Heading | `heading:has-text('Book Catalog')` |
| BuggyBooks Header | `h2:has-text('BuggyBooks')` |
| Add to Cart Button | `button:has-text('Add to Cart')` |
| Cart Link | `a:has-text('Cart')` |

### Cart Page
| Element | Locator |
|---------|---------|
| Your Cart Heading | `heading:has-text('Your Cart')` |
| Total Price | `heading:has-text(/Total:/)` |
| Proceed to Checkout | `button:has-text('Proceed to Checkout')` |

### Checkout Page
| Element | Locator |
|---------|---------|
| Checkout Heading | `heading:has-text('Checkout')` |
| First Name Input | `input[name='firstName']` or first textbox |
| Last Name Input | `input[name='lastName']` or second textbox |
| Credit Card Input | `input[name='creditCard']` or third textbox |
| Complete Payment | `button:has-text('Complete Payment')` |
| Payment Successful | `heading:has-text('Payment Successful')` |

## Test Data

### Test Books Used
- **The Great Buggy Gatsby** - $10.99
- **To Kill a Mockingbird Exception** - $15.50
- **1984 Bugs** - $12.00

### Test Checkout Data
- **First Name:** John
- **Last Name:** Doe
- **Credit Card:** 4532015112830366 (Test Card)

## Logging and Reporting

Each test generates:
1. **Console Logs** - INFO level logs with test progress
2. **Network Logs** - Captured network requests (if enabled)
3. **Screenshots** - On failure (when configured)
4. **Trace Files** - For debugging (when configured)
5. **Allure Report** - HTML report with detailed test results

## Known Issues / Bugs Found

Based on exploration of the application:

1. **Order Total Bug** - The "Total to pay" shows $0.00 on checkout page instead of actual cart total
   - **Impact:** Medium - affects price verification on checkout
   - **Workaround:** Verify total on cart page before checkout

2. **Cart Count Discrepancy** - Test found 3 items in cart when 2 were expected to be added
   - **Impact:** Low - cart functionality works but quantity handling may need review

## Best Practices Used

1. **Page Object Model** - Separates test logic from page interactions
2. **Base Classes** - Reusable setup/teardown and common methods
3. **Descriptive Test Names** - Clear test naming convention with numbered cases
4. **Comprehensive Assertions** - Multiple assertions per test for thorough validation
5. **Logging** - INFO level logs for test execution tracking
6. **Error Handling** - Meaningful error messages when assertions fail
7. **Waits and Timeouts** - Proper wait strategies for element visibility
8. **Test Data Separation** - Test data defined in page classes

## Troubleshooting

### Tests Failing Due to Network
- Check internet connectivity
- Verify target URL is accessible: https://buggy-books-fe.onrender.com/
- Check firewall settings

### Locators Not Found
- Run tests in UI mode to inspect elements: `npx playwright test --ui`
- Update locators in page classes if application UI changes
- Check console logs for detailed error messages

### Timeout Errors
- Increase timeout in BasePage.DEFAULT_TIMEOUT (default: 60000ms)
- Check if elements are dynamically loaded
- Run tests in debug mode to inspect timing issues

## Contributing

When adding new tests:
1. Follow existing test naming convention (Test_XXX_DescriptiveName.spec.ts)
2. Create corresponding page classes if new pages are tested
3. Use proper logging with `logMessage()` method
4. Add comprehensive assertions
5. Update this documentation with new test cases

## Contact & Support

For issues or questions about these tests, please refer to the project's issue tracker or documentation.

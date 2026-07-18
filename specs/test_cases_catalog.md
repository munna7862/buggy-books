# 📋 BuggyBooks Test Case Catalog

This document provides a detailed list of test cases in English for the BuggyBooks application. These cases are designed to be implemented using **Playwright** (Web and API).

---

## 1. UI Test Cases (Web Automation)

### **Suite: Authentication & User Management**

| ID | Title | Description | Priority | Covered |
|:---|:---|:---|:---|:---|
| **UI_AUTH_01** | Successful Registration | Navigate to `/register`, fill all fields with valid data, and submit. Verify redirect to Home and presence of username in navbar. | Smoke | **Yes**<br>- File: `UserManagement/Test_001_RegisterUser.spec.ts`<br>- Test: `Testcase 1: Register New User` |
| **UI_AUTH_02** | Login with Valid Credentials | Navigate to `/login`, enter credentials from `USER_NAME` / `PASSWORD` environment variables. Verify successful login and cookie persistence. | Smoke | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts` (`Testcase 1` & `Testcase 2`) |
| **UI_AUTH_03** | Login Validation Errors | Attempt login with wrong password. Verify error message "Unauthorized: Invalid credentials" appears. | Regression | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts` (`Testcase 3: Login Validation Errors`) |
| **UI_AUTH_04** | Password Strength Indicator | On Register page, type a simple password ("123") and verify label is "weak". Type a complex one and verify label is "strong". | Regression | **Yes**<br>- File: `UserManagement/Test_001_RegisterUser.spec.ts` (`Testcase 3: Password Strength Indicator`) |
| **UI_AUTH_05** | Logout Functionality | Click "Logout" in the navbar. Verify user is redirected to Login and cannot access the `/cart` page directly. | Smoke | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts` (`Testcase 1` & `Testcase 2` logout steps) |

### **Suite: Catalog & Book Discovery**

| ID | Title | Description | Priority | Covered |
|:---|:---|:---|:---|:---|
| **UI_CAT_01** | Initial Catalog Load | Verify that exactly 8 books are displayed on the first page of the catalog. | Smoke | **Yes**<br>- File: `BookCatalog/Test_001_InitialCatalog.spec.ts`<br>- Test: `Verify Books Count in pagination` |
| **UI_CAT_02** | Pagination Navigation | Click the "2" or "Next" button in the pagination bar. Verify that new books are loaded and URL contains `page=2`. | Regression | **Yes**<br>- File: `BookCatalog/Test_001_InitialCatalog.spec.ts`<br>- Test: `Verify Next Page Navigation` |
| **UI_CAT_03** | Search Filtering | Type "Mockingbird" in the search bar and submit. Verify that the list updates to show the matching book. | Regression | **No** |
| **UI_CAT_04** | Search - No Results | Search for a gibberish string and submit. Verify a "No books found" message is displayed. | Regression | **No** |
| **UI_CAT_05** | Book Detail View | Click on the book cover or title. Verify the description, author, and price match the catalog data. | Smoke | **No** |

### **Suite: Cart & Checkout**

| ID | Title | Description | Priority | Covered |
|:---|:---|:---|:---|:---|
| **UI_CART_01** | Add to Cart from Catalog | Click "Add to Cart" on a book. Verify that the item is successfully added to the cart (visible in Cart page or via toast message). | Smoke | **Yes**<br>- File: `Checkout/Test_001_CompleteBookPurchase.spec.ts` (`Testcase 1`) & `Checkout/Test_002_CartPersistenceCheckout.spec.ts` (`Testcase 1`) |
| **UI_CART_02** | Remove Item from Cart | Navigate to `/cart`. Click "Remove" on an item. Verify the item disappears and the total price updates. | Regression | **No** *(Tests only clear the cart in bulk using "Clear All")* |
| **UI_CART_03** | User Cart Isolation | **(Critical)** Login as User A, add items. Logout. Login as User B. Verify User B's cart is empty. | Regression | **No** |
| **UI_CHECK_01** | Checkout Form Validation | Attempt to submit the checkout form with an empty credit card field. Verify validation error appears. | Regression | **No** |
| **UI_CHECK_02** | Successful Order Placement | Complete the checkout form and submit. Verify that the payment successful message appears and the cart is cleared. | Smoke | **Yes**<br>- File: `Checkout/Test_001_CompleteBookPurchase.spec.ts` (`Testcase 1`) & `Checkout/Test_002_CartPersistenceCheckout.spec.ts` (`Testcase 1`) |

---

## 2. API Test Cases (Backend Automation)

### **Suite: API Authentication**

| ID | Title | Description | Covered |
|:---|:---|:---|:---|
| **API_AUTH_01** | `POST /api/login` Success | Send valid credentials. Verify 200 OK and that `Set-Cookie` header contains a valid JWT token. | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 7: Positive and Contract` |
| **API_AUTH_02** | `POST /api/register` Conflict | Send a username that already exists. Verify 409 Conflict. | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 3: Duplicate usernames` |
| **API_AUTH_03** | Protected Route Access | Attempt `GET /api/cart` without a cookie. Verify 401 Unauthorized. | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 13: Security: GET /api/cart without auth cookies should return 401 Unauthorized` |

### **Suite: Cart & Inventory**

| ID | Title | Description | Covered |
|:---|:---|:---|:---|
| **API_CART_01** | Persistence after server crash | Add item -> Restart server -> Get Cart. Verify item is still there. | **No** |
| **API_INV_01** | Inventory Report Latency | Trigger the inventory report. Verify it returns a list of all 15 books with stock data. | **No** |

### **Suite: Chaos & Testing Utilities**

| ID | Title | Description | Covered |
|:---|:---|:---|:---|
| **API_TEST_01** | Global Reset | Call `POST /api/test/reset`. Verify all users (except defaults) and all carts are cleared. | **No** |
| **API_CHAOS_01** | Inject Checkout Failures | Set `checkoutFailureRate` to 1.0 via `/api/test/config`. Verify all checkout attempts return 500. | **No** |
| **API_CHAOS_02** | Inject API Latency | Set `inventoryDelayMs` to 3000. Verify `/api/inventory/report` takes at least 3 seconds to respond. | **No** |

---

## 3. End-to-End (E2E) Journey

### **Scenario: The New Customer Journey**
1.  **Register**: Create a new account.
2.  **Search**: Search for "Harry Potter".
3.  **Inspect**: Click to see details.
4.  **Add**: Add the book to the cart.
5.  **Review**: Go to the cart and verify the title and price.
6.  **Checkout**: Complete the checkout process.
7.  **Verify**: Verify the order appears in the order history (if implemented) or that a Success ID or message is provided.

*Note: This specific end-to-end user scenario is **not fully automated as a single script** in the existing Playwright E2E folder, but parts of it (registration, adding to cart, checkout details) are tested across different spec files.*

---

## 4. Automation Tips for Playwright

*   **Non-Semantic Selectors**: In the login/register forms, I used names like `txt_usr_77`. Use `page.locator('input[name="txt_usr_77"]')` to select these.
*   **Cookie Handling**: Use `context.cookies()` to verify that the token cookie is `httpOnly`.
*   **Intercepting Chaos**: Use `page.route` to mock API failures if you want to test how the UI handles a 500 error without actually changing the server config.

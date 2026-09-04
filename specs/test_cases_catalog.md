# 📋 BuggyBooks Test Case Catalog

This document provides a unified master catalog of all test cases for the BuggyBooks application. Test cases are categorized by their function, target execution tier, assigned tags (`@smoke`, `@regression`, `@chaos`, `@a11y`), and implementation status.

---

## 1. UI Test Cases (Web Automation)
These test cases verify user-facing interfaces and behaviors inside a real browser environment. The primary tool for automating these is **Playwright UI**.

### **Suite: Authentication & User Management**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **UI_AUTH_01** | Successful Registration | Navigate to `/register`, fill all fields with valid data, and submit. Verify redirect to Home and presence of username in navbar. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `UserManagement/Test_001_RegisterUser.spec.ts`<br>- Test: `Testcase 1: Register New User @smoke @regression` |
| **UI_AUTH_02** | Login with Valid Credentials | Navigate to `/login`, enter credentials from `USER_NAME` / `PASSWORD` environment variables. Verify successful login and cookie persistence. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts`<br>- Test: `Testcase 1: Login With Existing User @smoke @regression` & `Testcase 2: Login Using Saved Session Storage @smoke @regression` |
| **UI_AUTH_03** | Login Validation Errors | Attempt login with wrong password. Verify error message "Unauthorized: Invalid credentials" appears. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts`<br>- Test: `Testcase 3: Login Validation Errors @regression` |
| **UI_AUTH_04** | Password Strength Indicator | On Register page, type a simple password ("123") and verify label is "weak". Type a complex one and verify label is "strong". | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `UserManagement/Test_001_RegisterUser.spec.ts`<br>- Test: `Testcase 3: Password Strength Indicator @regression` |
| **UI_AUTH_05** | Logout Functionality | Click "Logout" in the navbar. Verify user is redirected to Login and cannot access the `/cart` page directly. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts` (`Testcase 1` & `Testcase 2` logout steps) |
| **UI_AUTH_06** | Protected Route Access Guard | Direct browser navigation to `/checkout` or `/profile` without active login session. Verify automatic redirect to `/login` with an authentication warning tag. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `UserManagement/Test_003_ProtectedRouteGuard.spec.ts`<br>- Test: `UI_AUTH_06: Direct unauthenticated navigation to protected routes redirects to Login @smoke @regression` |

### **Suite: Catalog & Book Discovery**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **UI_CAT_01** | Initial Catalog Load | Verify that exactly 8 books are displayed on the first page of the catalog. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `BookCatalog/Test_001_InitialCatalog.spec.ts`<br>- Test: `Verify Books Count in pagination @smoke @regression` |
| **UI_CAT_02** | Pagination Navigation | Click the "2" or "Next" button in the pagination bar. Verify that new books are loaded and URL contains `page=2`. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `BookCatalog/Test_001_InitialCatalog.spec.ts`<br>- Test: `Verify Next Page Navigation` |
| **UI_CAT_03** | Search Filtering | Type "Mockingbird" in the search bar and submit. Verify that the list updates to show the matching book. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `BookCatalog/Test_002_SearchAndDetailCatalog.spec.ts`<br>- Test: `UI_CAT_03: Search Filtering @regression` |
| **UI_CAT_04** | Search - No Results | Search for a gibberish string and submit. Verify a "No books found" message is displayed. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `BookCatalog/Test_002_SearchAndDetailCatalog.spec.ts`<br>- Test: `UI_CAT_04: Search - No Results @regression` |
| **UI_CAT_05** | Book Detail View | Click on the book cover or title. Verify the description, author, and price match the catalog data. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `BookCatalog/Test_002_SearchAndDetailCatalog.spec.ts`<br>- Test: `UI_CAT_05: Book Detail View @smoke @regression` |


### **Suite: Cart & Checkout**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **UI_CART_01** | Add to Cart from Catalog | Click "Add to Cart" on a book. Verify that the item is successfully added to the cart (toast/badge updates). | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Checkout/Test_001_CompleteBookPurchase.spec.ts` (`Testcase 1`) & `Checkout/Test_002_CartPersistenceCheckout.spec.ts` (`Testcase 1`) |
| **UI_CART_02** | Remove Item from Cart | Navigate to `/cart`. Click "Remove" on an item. Verify the item disappears and the total price updates. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Checkout/Test_003_CartAndCheckoutValidation.spec.ts`<br>- Test: `UI_CART_02: Remove Item from Cart @regression` |
| **UI_CART_03** | User Cart Isolation | **(Critical)** Login as User A, add items. Logout. Login as User B. Verify User B's cart is empty. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Checkout/Test_003_CartAndCheckoutValidation.spec.ts`<br>- Test: `UI_CART_03: User Cart Isolation @regression` |
| **UI_CHECK_01** | Checkout Form Validation | Attempt to submit the checkout form with empty fields. Verify inline validation error tags appear. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Checkout/Test_003_CartAndCheckoutValidation.spec.ts`<br>- Test: `UI_CHECK_01: Checkout Form Validation @regression` |
| **UI_CHECK_02** | Successful Order Placement | Complete the checkout form and submit. Verify that the payment successful message appears and the cart is cleared. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Checkout/Test_001_CompleteBookPurchase.spec.ts` (`Testcase 1`) & `Checkout/Test_002_CartPersistenceCheckout.spec.ts` (`Testcase 1`) |
| **UI_CART_04** | Cart Item Quantity Adjustment | In `/cart`, adjust item quantities using increment/decrement controls. Assert that item subtotals and grand totals update dynamically without full page reload. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Checkout/Test_006_CartQuantityAdjustment.spec.ts`<br>- Test: `UI_CART_04: Cart item addition and removal dynamically recalculates item count and order total @regression` |

### **Suite: Multi-Step Checkout Wizard**
*Spec Source: [checkout_wizard_and_validation_tests.md](file:///c:/BuggyBooks/buggy-books/specs/checkout_wizard_and_validation_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **UI_WIZ_01** | Stepper Transition Validation | Complete Step 1 shipping, click Next. Verify `step-indicator-2` is active, shipping inputs are hidden, and payment inputs appear. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Checkout/Test_004_CheckoutWizardValidation.spec.ts`<br>- Test: `UI_WIZ_01: Stepper Transition Validation @smoke @regression` |
| **UI_WIZ_02** | Validation Messaging Validation | Submit blank fields on Step 1, and invalid inputs on Step 2. Verify all inline error message nodes become visible with exact error texts. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Checkout/Test_004_CheckoutWizardValidation.spec.ts`<br>- Test: `UI_WIZ_02: Validation Messaging Validation @regression` |
| **UI_WIZ_03** | Wizard Back Step History preservation | Go to Step 2, type in card inputs, click Back. Click Next. Assert card inputs are preserved and error banners are cleared. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Checkout/Test_004_CheckoutWizardValidation.spec.ts`<br>- Test: `UI_WIZ_03: Wizard Back Step History preservation @regression` |
| **UI_WIZ_04** | Dirty Navigation Alert Dialog | Fill First Name input. Click "Catalog" link in the navbar. Assert that a native browser `confirm` dialog is triggered, and navigation is blocked unless accepted. | Critical | Playwright UI | `@regression` | **Yes**<br>- File: `Checkout/Test_004_CheckoutWizardValidation.spec.ts`<br>- Test: `UI_WIZ_04: Dirty Navigation Alert Dialog @regression` |


### **Suite: Profile Picture Upload**
*Spec Source: [file_upload_and_validation_tests.md](file:///c:/BuggyBooks/buggy-books/specs/file_upload_and_validation_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **UI_UPL_01** | Valid Profile Picture Upload | Choose a valid PNG/JPEG image under 2MB. Click Upload. Assert that the preview image source points to the new path, and a success message renders. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Profile/Test_005_ProfilePictureUpload.spec.ts`<br>- Test: `UI_UPL_01: Valid Profile Picture Upload @smoke @regression` |
| **UI_UPL_02** | File Extension Filter Validation | Choose an invalid file format (e.g. `document.txt`). Assert that the upload fails with `400` and displays warning element. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Profile/Test_005_ProfilePictureUpload.spec.ts`<br>- Test: `UI_UPL_02: File Extension Filter Validation @smoke @regression` |
| **UI_UPL_03** | File Size Limit Validation | Choose an image file larger than 2MB. Assert that the upload fails with `400` and displays a file size limit warning. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Profile/Test_005_ProfilePictureUpload.spec.ts`<br>- Test: `UI_UPL_03: File Size Limit Validation @smoke @regression` |
| **UI_UPL_04** | Upload Chaos Failure Recovery | Configure `uploadFailureRate: 1.0` via chaos config. Submit a valid file. Assert that status code `500` is returned, and an error banner displays. | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `Profile/Test_005_ProfilePictureUpload.spec.ts`<br>- Test: `UI_UPL_04: Upload Chaos Failure Recovery @regression @chaos` |
| **UI_PROF_01** | Account Summary & Order History | Navigate to `/profile`. Verify account full name, avatar preview, and past placed orders list rendered from backend response. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Profile/Test_006_ProfileSummaryAndOrderHistory.spec.ts`<br>- Test: `UI_PROF_01: Verify user account profile summary and avatar preview render correctly @smoke @regression` |


### **Suite: JWT Expiration & Silent Refresh UI**
*Spec Source: [jwt_expiration_and_refresh_tests.md](file:///c:/BuggyBooks/buggy-books/specs/jwt_expiration_and_refresh_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **UI_REF_01** | Transparent Client Request Retry | Set access token to expire in 2 seconds. Trigger an action in the UI (e.g. Add to Cart) after 3 seconds. Verify the action completes successfully (API client silently refreshed the token and retried). | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Refresh/Test_006_JwtRefreshValidation.spec.ts`<br>- Test: `UI_REF_01: Transparent Client Request Retry @regression` |
| **UI_REF_02** | Session Expiry Redirection | Set access and refresh tokens to be invalid/expired. Trigger any UI action. Verify that the user is logged out and redirected to `/login`. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Refresh/Test_006_JwtRefreshValidation.spec.ts`<br>- Test: `UI_REF_02: Session Expiry Redirection @smoke @regression` |


### **Suite: Accessibility (a11y) Scans**
*Spec Source: [a11y_violation_injector_tests.md](file:///c:/BuggyBooks/buggy-books/specs/a11y_violation_injector_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **A11Y_01** | Standard Accessibility Compliance | Verify that when `injectA11yViolations` is `false`, the book catalog, login screen, and checkout step forms pass Axe scans with zero violations. | Smoke | Playwright UI | `@smoke` `@regression` `@a11y` | **Yes**<br>- File: `A11y/Test_007_A11yScanValidation.spec.ts`<br>- Test: `A11Y_01: Standard Accessibility Compliance @smoke @regression @a11y` |
| **A11Y_02** | Image Alternative Text Scan Failure | Enable `injectA11yViolations: true`. Scan the Book Catalog. Assert that Axe detects `image-alt` failures on catalog images. | Regression | Playwright UI | `@regression` `@chaos` `@a11y` | **Yes**<br>- File: `A11y/Test_007_A11yScanValidation.spec.ts`<br>- Test: `A11Y_02: Image Alternative Text Scan Failure @regression @chaos @a11y` |
| **A11Y_03** | Orphaned Form Label Scan Failure | Enable `injectA11yViolations: true`. Scan the Login page. Assert that Axe detects `label` (orphaned labels without htmlFor-id link) violations. | Regression | Playwright UI | `@regression` `@chaos` `@a11y` | **Yes**<br>- File: `A11y/Test_007_A11yScanValidation.spec.ts`<br>- Test: `A11Y_03: Orphaned Form Label Scan Failure @regression @chaos @a11y` |
| **A11Y_04** | Text Color Contrast Scan Failure | Enable `injectA11yViolations: true`. Scan the Catalog summary text. Assert that Axe flags a color contrast ratio regression on the books count tag. | Regression | Playwright UI | `@regression` `@chaos` `@a11y` | **Yes**<br>- File: `A11y/Test_007_A11yScanValidation.spec.ts`<br>- Test: `A11Y_04: Text Color Contrast Scan Failure @regression @chaos @a11y` |


### **Suite: Modern UI Styling & Layout**
*Spec Source: [ui_styling_and_transition_tests.md](file:///c:/BuggyBooks/buggy-books/specs/ui_styling_and_transition_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **UI_STYLE_01** | Retained Automation Selectors | Search and list books. Assert that all legacy automation classnames and element IDs exist on the new semantic `div` nodes. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `Styling/Test_009_UIStyleAndLayoutValidation.spec.ts`<br>- Test: `UI_STYLE_01: Retained Automation Selectors @smoke @regression` |
| **UI_STYLE_02** | Catalog Grid Layout Responsiveness | Emulate desktop, tablet, and mobile viewports. Verify that cards align to their correct grid patterns (`repeat(auto-fill, minmax(280px, 1fr))`). | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Styling/Test_009_UIStyleAndLayoutValidation.spec.ts`<br>- Test: `UI_STYLE_02: Catalog Grid Layout Responsiveness @regression` |
| **UI_STYLE_03** | Hover Animation CSS Verification | Trigger a hover state on a book card. Assert that the scale and transform styles are applied to the cover image. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Styling/Test_009_UIStyleAndLayoutValidation.spec.ts`<br>- Test: `UI_STYLE_03: Hover Animation CSS Verification @regression` |
| **UI_STYLE_04** | HSL CSS Variable Theme Verification | Emulate light and dark mode preferences. Assert that root variables (like `--bg` and `--card-bg`) resolve to their correct HSL values. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `Styling/Test_009_UIStyleAndLayoutValidation.spec.ts`<br>- Test: `UI_STYLE_04: HSL CSS Variable Theme Verification @regression` |

### **Suite: Visual Regression & Layout Chaos**
*Spec Source: [visual_regression_chaos_tests.md](file:///c:/BuggyBooks/buggy-books/specs/visual_regression_chaos_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **VIS_REG_01** | Baseline Catalog Screenshot | Navigate to `/`. Capture a screenshot when `visualChaos` is `false`. Assert screenshot matches the approved baseline file. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_01: Baseline Catalog Screenshot @smoke @regression` |
| **VIS_REG_02** | Chaos-Enabled Catalog Pixel Diff | Enable `visualChaos` via API. Navigate to `/`. Capture screenshot and compare with baseline — assert significant pixel difference exists (diff > 0). | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_02: Chaos-Enabled Catalog Pixel Diff @regression @chaos` |
| **VIS_REG_03** | Book Card Border Color Assertion | Enable chaos. Query `.complex-item-box-alpha` and assert `border-color` computed style equals `rgb(242, 36, 36)`. | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_03: Book Card Border Color Assertion @regression @chaos` |
| **VIS_REG_04** | Book Cover Blur Filter Assertion | Enable chaos. Query `.catalog-book-cover` and assert `filter` computed style includes `blur(1.5px)`. | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_04: Book Cover Blur Filter Assertion @regression @chaos` |
| **VIS_REG_05** | Search Bar Displacement Assertion | Enable chaos. Query `.catalog-search-form` and assert `transform` includes `translateX(-18px)`. | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_05: Search Bar Displacement Assertion @regression @chaos` |
| **VIS_REG_06** | Price Tag Rotation Assertion | Enable chaos. Query `.price-tag-value` and assert `transform` includes `rotate(-3deg)`. | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_06: Price Tag Rotation Assertion @regression @chaos` |
| **VIS_REG_07** | Checkout Button Margin Shift | Navigate to `/checkout`, enable chaos. Query `#wizard-next-btn` and assert `marginLeft` computed value is `15px`. | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_07: Checkout Button Margin Shift @regression @chaos` |
| **VIS_REG_08** | Book Card Text Line Height Chaos | Enable chaos. Query `.info-cell-beta h3` and assert `lineHeight` computed value reflects `3.2` multiplier. | Regression | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_08: Book Card Text Line Height Chaos @regression @chaos` |
| **VIS_REG_09** | Reset Restores Visual Baseline | After enabling chaos and capturing diff screenshot, call `POST /api/test/reset`. Re-capture screenshot. Assert it matches original baseline. | E2E | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `VisualRegression/Test_010_VisualRegressionChaos.spec.ts`<br>- Test: `VIS_REG_09: Reset Restores Visual Baseline @regression @chaos` |

### **Suite: WebSockets Event & Resilience**
*Spec Source: [websocket_event_and_resilience_tests.md](file:///c:/BuggyBooks/buggy-books/specs/websocket_event_and_resilience_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **WS_CONN_01** | WebSocket State Indicator | Open page. Assert that `ws-status-dot` is present and contains the class `status-connected` (indicating successful handshakes). | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `WebSockets/Test_008_WebSocketResilienceValidation.spec.ts`<br>- Test: `WS_CONN_01: WebSocket State Indicator @smoke @regression` |
| **WS_EVENT_01** | Broadcasted Event Reception | Click the bell button to open the dropdown. Assert that mock bookstore events (e.g. view, purchase, sale) populate the list inside the dropdown. | Smoke | Playwright UI | `@smoke` `@regression` | **Yes**<br>- File: `WebSockets/Test_008_WebSocketResilienceValidation.spec.ts`<br>- Test: `WS_EVENT_01: Broadcasted Event Reception @smoke @regression` |
| **WS_EVENT_02** | Hot-Toast Alert Trigger | Listen for incoming events. Assert that if the event type is `purchase` or `sale`, a toast notification banner is rendered. | Regression | Playwright UI | `@regression` | **Yes**<br>- File: `WebSockets/Test_008_WebSocketResilienceValidation.spec.ts`<br>- Test: `WS_EVENT_02: Hot-Toast Alert Trigger @regression` |
| **WS_RESIL_01** | Automatic Connection Recovery | Configure `websocketDropRate: 1.0` via chaos config. Verify that when disconnected, the client changes state to disconnected and attempts auto-reconnection. | Critical | Playwright UI | `@regression` `@chaos` | **Yes**<br>- File: `WebSockets/Test_008_WebSocketResilienceValidation.spec.ts`<br>- Test: `WS_RESIL_01: Automatic Connection Recovery @regression` `@chaos` |


---

## 2. API Test Cases (Backend Automation)
These test cases verify the logic, security, and integrity of backend endpoints without launching the browser. Automated using **Playwright API** request fixtures.

### **Suite: API Authentication**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **API_AUTH_01** | `POST /api/login` Success | Send valid credentials. Verify 200 OK and that `Set-Cookie` header contains a valid JWT token. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 7: Positive and Contract: POST /api/login should login a registered user successfully @smoke @regression` |
| **API_AUTH_02** | `POST /api/register` Conflict | Send a username that already exists. Verify 409 Conflict. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 3: Negative: POST /api/register should reject duplicate usernames @smoke @regression` |
| **API_AUTH_03** | Protected Route Access | Attempt `GET /api/cart` without a cookie. Verify 401 Unauthorized. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 13: Security: GET /api/cart without auth cookies should return 401 Unauthorized @smoke @regression` |
| **API_REF_01** | Dynamic Access Token Expiry | Inject `jwtExpirySeconds: 2` via chaos configuration. Request a protected route after 3 seconds. Verify `403 Forbidden` response is returned. | Smoke | Playwright API | `@smoke` `@regression` `@chaos` | **Yes**<br>- File: `api/UserManagement/Test_002_TokenRefreshAndProfileApi.spec.ts`<br>- Test: `API_REF_01: Dynamic Access Token Expiry @smoke @regression @chaos` |
| **API_REF_02** | Refresh Token Issuance | Login. Verify that both access `token` and `refreshToken` cookies are returned with security and `httpOnly` flags set. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/UserManagement/Test_002_TokenRefreshAndProfileApi.spec.ts`<br>- Test: `API_REF_02: Refresh Token Issuance @smoke @regression` |
| **API_REF_03** | Silent Token Refresh | Request `/api/auth/refresh` using the `refreshToken` cookie. Verify status is `200` and a new `token` cookie is returned. | Regression | Playwright API | `@regression` | **Yes**<br>- File: `api/UserManagement/Test_002_TokenRefreshAndProfileApi.spec.ts`<br>- Test: `API_REF_03: Silent Token Refresh @regression` |

### **Suite: Cart & Inventory**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **API_CART_01** | Persistence after server crash | Add item -> Restart server -> Get Cart. Verify item is still there. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/CartAndInventory/Test_001_CartAndInventoryApi.spec.ts`<br>- Test: `API_CART_01: Cart persistence after server crash @smoke @regression` |
| **API_INV_01** | Inventory Report Latency | Trigger the inventory report. Verify it returns a list of all 15 books with stock data. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/CartAndInventory/Test_001_CartAndInventoryApi.spec.ts`<br>- Test: `API_INV_01: Trigger inventory report @smoke @regression` |
| **API_ORD_01** | `GET /api/orders` History Check | Authenticate, complete checkout via `POST /api/checkout/process`, call `GET /api/orders`. Assert `200 OK` and order items match. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/CartAndInventory/Test_002_OrdersApi.spec.ts`<br>- Test: `API_ORD_01: Authenticate user, complete checkout via API, and verify GET /api/orders history response @smoke @regression` |

### **Suite: File Upload API**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **API_UPL_01** | Unauthorized Session Check | Attempt upload without cookie tokens. Assert that status code `401` is returned. | Regression | Playwright API | `@regression` | **Yes**<br>- File: `api/UserManagement/Test_002_TokenRefreshAndProfileApi.spec.ts`<br>- Test: `API_UPL_01: Unauthorized Session Check @regression` |


### **Suite: Chaos & Testing Utilities**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **API_TEST_01** | Global Reset | Call `POST /api/test/reset`. Verify all users (except defaults) and all carts are cleared. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/ChaosAndTesting/Test_001_ChaosAndTestingApi.spec.ts`<br>- Test: `API_TEST_01: Global reset clears all non-default users and carts @smoke @regression` |
| **API_CHAOS_01** | Inject Checkout Failures | Set `checkoutFailureRate` to 1.0 via `/api/test/config`. Verify all checkout attempts return 500. | Smoke | Playwright API | `@smoke` `@regression` `@chaos` | **Yes**<br>- File: `api/ChaosAndTesting/Test_001_ChaosAndTestingApi.spec.ts`<br>- Test: `API_CHAOS_01: Inject checkout failures @smoke @regression @chaos` |
| **API_CHAOS_02** | Inject API Latency | Set `inventoryDelayMs` to 3000. Verify `/api/inventory/report` takes at least 3 seconds to respond. | Smoke | Playwright API | `@smoke` `@regression` `@chaos` | **Yes**<br>- File: `api/ChaosAndTesting/Test_001_ChaosAndTestingApi.spec.ts`<br>- Test: `API_CHAOS_02: Inject API latency @smoke @regression @chaos` |
| **API_VIS_01** | Toggle visualChaos Config via API | `POST /api/test/config` with `{ "visualChaos": true }`. Assert 200 and `config.visualChaos === true`. | Smoke | Playwright API | `@smoke` `@regression` `@chaos` | **Yes**<br>- File: `api/ChaosAndTesting/Test_002_VisualChaosApi.spec.ts`<br>- Test: `API_VIS_01: Toggle visualChaos Config via API @smoke @regression @chaos` |
| **API_VIS_02** | Default visualChaos is False | `GET /api/test/config` after reset. Assert `visualChaos === false`. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/ChaosAndTesting/Test_002_VisualChaosApi.spec.ts`<br>- Test: `API_VIS_02: Default visualChaos is False @smoke @regression` |
| **API_VIS_03** | Invalid Type Rejected | `POST /api/test/config` with `{ "visualChaos": "yes" }`. Assert 400 and validation error in body. | Regression | Playwright API | `@regression` | **Yes**<br>- File: `api/ChaosAndTesting/Test_002_VisualChaosApi.spec.ts`<br>- Test: `API_VIS_03: Invalid Type Rejected @regression` |
| **API_VIS_04** | Combine with Other Chaos Params | Set `{ "visualChaos": true, "checkoutFailureRate": 0.5 }` in one request. Assert both fields are saved correctly. | Regression | Playwright API | `@regression` `@chaos` | **Yes**<br>- File: `api/ChaosAndTesting/Test_002_VisualChaosApi.spec.ts`<br>- Test: `API_VIS_04: Combine with Other Chaos Params @regression @chaos` |


### **Suite: Structured JSON Logging & Correlation**
*Spec Source: [logging_and_correlation_tests.md](file:///c:/BuggyBooks/buggy-books/specs/logging_and_correlation_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **API_LOG_01** | Correlation ID Header Generation | Send any HTTP request. Verify `x-correlation-id` is returned in response headers and is a valid UUIDv4. | Smoke | Playwright API | `@smoke` `@regression` | **Yes**<br>- File: `api/Logging/Test_001_LoggingAndCorrelationApi.spec.ts`<br>- Test: `API_LOG_01: Correlation ID Header Generation @smoke @regression` |
| **API_LOG_02** | Correlation ID Header Preservation | Send a request with a custom `x-correlation-id` header. Verify the API preserves it and returns the exact same ID. | Regression | Playwright API | `@regression` | **Yes**<br>- File: `api/Logging/Test_001_LoggingAndCorrelationApi.spec.ts`<br>- Test: `API_LOG_02: Correlation ID Header Preservation @regression` |
| **API_LOG_03** | Error Body Correlation ID Mapping | Trigger a server-side error. Verify that the JSON response body contains the exact same `correlationId`. | Regression | Playwright API | `@regression` | **Yes**<br>- File: `api/Logging/Test_001_LoggingAndCorrelationApi.spec.ts`<br>- Test: `API_LOG_03: Error Body Correlation ID Mapping @regression` |
| **API_LOG_04** | User Context Log Association | Login, add an item to the cart, and checkout. Inspect the server logs for that correlation ID and verify that the logs contain the correct `username` field. | E2E | Playwright API / Log Analysis | `@regression` | **Yes**<br>- File: `api/Logging/Test_001_LoggingAndCorrelationApi.spec.ts`<br>- Test: `API_LOG_04: User Context Log Association @regression` |


### **Suite: Database Persistence & Concurrency**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **API_DB_01** | Basic Get/Set Operations | Set a value in the schema and verify that it is retrieved correctly and written to the filesystem. | Smoke | Jest Unit Test | `@smoke` | **Yes**<br>- File: `src/__tests__/storage.test.ts`<br>- Test: `should successfully get and set values` |
| **API_DB_02** | Queue Concurrency and Serialization | Perform multiple rapid concurrent sets. Verify that only the final value is persisted in order, without blocking the event loop or causing corruption. | Smoke | Jest Unit Test | `@smoke` | **Yes**<br>- File: `src/__tests__/storage.test.ts`<br>- Test: `should handle rapid concurrent sets and serialize the latest state correctly` |
| **API_DB_03** | Parallel Write Resilience | Fire 100 sets in parallel and verify that no errors or file locking contentions are thrown, event loop is not blocked, and database remains intact. | Regression | Jest Unit Test | `@regression` | **Yes**<br>- File: `src/__tests__/storage.test.ts`<br>- Test: `should not block the event loop or throw during parallel writes` |

---

## 3. Frontend Component Mocking Test Cases (Vitest)
These test cases isolate frontend logic and UI pages by mocking backend API responses. Written inside the frontend directory using **Vitest** + **React Testing Library** + **Mock Service Worker (MSW)**.

### **Suite: API Mocking via MSW**
*Spec Source: [dockerization_and_ci_tests.md](file:///c:/BuggyBooks/buggy-books/specs/dockerization_and_ci_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **MSW_01** | Mock Books Endpoint | In a Vitest component test, import `server` from `src/mocks/server.ts`. Assert `GET /api/books` returns the 3 mock books without a real backend. | Smoke | Frontend Component (Vitest) | `@smoke` | **Yes**<br>- File: `frontend/src/__tests__/msw-api-mocking.test.tsx`<br>- Test: `MSW_01: Mock Books Endpoint returns the 3 mock books` |
| **MSW_02** | Mock Login Success | POST to `/api/login` with `testuser/password123`. Assert mock returns `200` with username. | Smoke | Frontend Component (Vitest) | `@smoke` | **Yes**<br>- File: `frontend/src/__tests__/msw-api-mocking.test.tsx`<br>- Test: `MSW_02: Mock Login Success returns 200 with username` |
| **MSW_03** | Override Handler Per Test | Override `GET /api/books` to return an empty array in a specific test. Assert the Catalog renders the "No books found" empty state. | Regression | Frontend Component (Vitest) | `@regression` | **Yes**<br>- File: `frontend/src/__tests__/msw-api-mocking.test.tsx`<br>- Test: `MSW_03: Override Handler Per Test - GET /api/books returns empty array` |
| **MSW_04** | Override Checkout to Always Fail | Override `POST /api/checkout/process` to return 500. Assert the Checkout component shows the error banner. | Regression | Frontend Component (Vitest) | `@regression` | **Yes**<br>- File: `frontend/src/__tests__/msw-api-mocking.test.tsx`<br>- Test: `MSW_04: Override Checkout to Always Fail - POST /api/checkout/process returns 500` |


---

## 4. End-to-End (E2E) Journey

### **Scenario: The New Customer Journey**
1. **Register**: Create a new account with dynamic unique credentials.
2. **Search**: Search for "Mockingbird" in the catalog.
3. **Inspect**: Click to see book details (title, price, author, description).
4. **Add**: Add the book to the cart.
5. **Review**: Go to the cart and verify the title, price, and total amount.
6. **Checkout**: Complete the checkout process.
7. **Verify**: Verify that an order confirmation message ("Order placed successfully") is provided.

**Automated**: **Yes**
- **File**: `playwright-e2e/src/tests/ui/Checkout/Test_005_EndToEndNewCustomerJourney.spec.ts`
- **Data File**: `playwright-e2e/src/test-data/ui/Checkout/Test_005_EndToEndNewCustomerJourney.json`
- **Tags**: `@smoke` `@regression`
- **Test**: `Testcase 1: Complete New Customer E2E Journey from Registration to Checkout @smoke @regression`

---

### **Scenario 2: The Resilient Customer Journey under Artificial API Latency**
1. **Configure Chaos**: Inject artificial API delay (`inventoryDelayMs: 2000`) via `POST /api/test/config`.
2. **Browse & Search**: Search catalog and inspect book details. Verify loading spinners render during latency.
3. **Add & Cart**: Add book to cart and review item subtotals.
4. **Checkout**: Submit checkout payment under backend delay.
5. **Verify & Reset**: Confirm successful order completion banner, reset chaos configuration via `POST /api/test/reset`.

**Automated**: **No** — *Planned for automation*

---

## 5. Session Sandboxing & Parallel Isolation Tests

*Sprint Source: [Sprint 3.1: Multi-User Session Isolation & Parallel Sandboxing](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_3_1_multi_user_isolation_and_sandboxing.md)*

These test cases validate multi-user ephemeral session isolation and parallel worker sandboxing infrastructure.

### **Suite: Session Isolation Infrastructure**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-SAN-001** | Multi-User Ephemeral Session Creation | Verify that sending `x-test-session-id` header creates an isolated ephemeral data store. Two distinct session IDs can register different users and add items to independent carts without cross-contamination. | Critical | Backend Integration / Playwright E2E | `@smoke` `@regression` | **Yes**<br>- Infrastructure: `backend/src/data/storage.ts` (`SessionStorageManager`)<br>- Middleware: `backend/src/routes/api.ts` (`sessionMiddleware` via `AsyncLocalStorage`)<br>- Fixture: `playwright-e2e/src/core/base/base.fixture.ts` (auto-injected `x-test-session-id`) |
| **TC-SAN-002** | DataStore & ChaosStore Session Partitioning | Verify that `storage.get()` and `storage.set()` route to session-scoped data when `sessionStorageContext` contains an active `sessionId`. Chaos config changes in one session do not affect another session's chaos state. | Critical | Backend Unit / Integration | `@regression` | **Yes**<br>- Implementation: `backend/src/data/storage.ts` (`Storage.get/set` with `getActiveSessionId`)<br>- Chaos Seed: `createSeedClone()` returns `chaosStore: null` for clean defaults per session<br>- Verified: 72/72 backend tests pass, 105/105 E2E tests pass under 4 workers |
| **TC-SAN-003** | Session Teardown & TTL Expiration | Verify that `DELETE /api/test/session/:id` removes the ephemeral session data store. Verify that `SessionStorageManager.cleanupExpiredSessions()` evicts sessions older than the configured TTL (default 30 minutes). | High | Backend Unit / Playwright Fixture | `@regression` | **Yes**<br>- Endpoint: `DELETE /api/test/session/:id` in `backend/src/routes/api.ts`<br>- Fixture teardown: `base.fixture.ts` calls `DELETE /api/test/session/${testSessionId}` in `afterEach`<br>- TTL: 60s sweep interval, 30-minute default TTL |
| **TC-SAN-004** | Playwright 4-Worker Parallel Execution with Zero State Leakage | Execute the full Playwright suite with `--workers=4`. Verify all 105 tests pass with zero failures and zero flakiness. Each worker operates on an independent `x-test-session-id` scoped backend data store. | Critical | Playwright E2E (Full Suite) | `@smoke` `@regression` | **Yes**<br>- Command: `npx playwright test --workers=4`<br>- Result: **105 passed (52.4s)**, 0 failed, 0 flaky<br>- Workers: 4 parallel Chromium instances with unique session IDs |

---

## 6. Chaos Dashboard & Concurrency Race Condition Tests

*Sprint Source: [Sprint 3.2: Interactive Chaos Dashboard & Dynamic Fault Injection](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_3_2_interactive_chaos_dashboard.md)*

These test cases validate the interactive Chaos Control Dashboard UI and backend optimistic stock locking under high-concurrency race conditions.

### **Suite: Chaos Control Dashboard**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-CHAOS-001** | Chaos Dashboard Control Binding & Live Feedback | Navigate to `/admin/chaos`. Adjust failure rate sliders, latency values, and toggle switches. Verify live values update, toast notification confirms synchronization, and `GET /api/test/config` reflects updated state. | High | Frontend Component (Vitest) & Playwright UI | `@smoke` `@regression` `@chaos` | **Yes**<br>- Page Object: `playwright-e2e/src/pages/chaos-dashboard.page.ts`<br>- Component Test: `frontend/src/pages/ChaosDashboard.test.tsx` |
| **TC-CHAOS-002** | Chaos Preset Application & Global Reset | Click preset buttons (e.g. "Clean Baseline", "Flaky Gateway") and "Reset Defaults". Verify inputs adapt immediately to preset parameters and database reset clears state. | Medium | Frontend Component (Vitest) | `@regression` `@chaos` | **Yes**<br>- Component Test: `frontend/src/pages/ChaosDashboard.test.tsx` |

### **Suite: Optimistic Stock Locking & Race Condition Simulation**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-CONC-001** | Concurrent Final Stock Unit Checkout Contention | Two concurrent buyers submit checkout orders simultaneously for a book with `stock: 1`. Assert that exactly one buyer receives `200 OK` (Order placed) and the competing buyer receives `409 Conflict` with optimistic lock error details. Final stock remains 0. | Critical | Playwright Concurrency / API | `@smoke` `@regression` `@chaos` | **Yes**<br>- Spec: `playwright-e2e/src/tests/ui/Checkout/Test_007_ConcurrentStockRaceCondition.spec.ts`<br>- Unit Suite: `backend/src/__tests__/optimisticLocking.test.ts` |
| **TC-CONC-002** | Atomic Stock Decrement & Depletion Guard | Verify that requesting checkout on an item with `stock: 0` immediately aborts with `409 Conflict` (Insufficient inventory) without modifying orders or corrupting cart state. | High | Backend Integration (Jest) | `@regression` | **Yes**<br>- Unit Suite: `backend/src/__tests__/optimisticLocking.test.ts` |

---

## 7. Automated API Performance & Lighthouse CI Quality Gates

*Sprint Source: [Sprint 3.3: Automated API Performance Testing & Lighthouse CI Quality Gates](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_3_3_automated_performance_and_lighthouse.md)*

These test cases validate automated API performance benchmarking with k6 and frontend quality gate enforcement with Lighthouse CI.

### **Suite: API Performance & Latency Benchmarks (k6)**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-PERF-001** | Catalog Load & Search Performance Benchmark | Execute virtual user ramp (0 to 50 VUs) across catalog endpoints (`GET /api/books`, `GET /api/books?q=gatsby`, `GET /api/books/:id`). Assert p95 latency < 250ms, p99 latency < 500ms, and failure rate < 1.0%. | Critical | API Performance (k6) | `@smoke` `@regression` `@perf` | **Yes**<br>- Script: `performance/k6/catalog-load.js`<br>- Runner: `npm run test:perf`<br>- Threshold: p95 < 250ms, p99 < 500ms under 50 concurrent VUs |
| **TC-PERF-002** | Inventory Delayed Endpoint Throughput Stress Test | Benchmark `GET /api/inventory/report` throughput and responsiveness under simulated delay and concurrent worker contention. Assert p95 latency < 500ms and report generation success rate > 98%. | High | API Stress (k6) | `@regression` `@perf` | **Yes**<br>- Script: `performance/k6/inventory-stress.js`<br>- Runner: `npm run test:perf:stress`<br>- Metrics: `inventory_duration`, `inventory_success_rate` |

### **Suite: Lighthouse CI Quality Gates**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-LHCI-001** | Lighthouse CI Core Web Vitals & Performance Gate | Audit frontend SPA distribution bundle in headless Chrome. Assert Lighthouse Performance category score is at least 0.90 (90%). Block pull requests on regression. | Critical | CI Quality Gate (Lighthouse CI) | `@smoke` `@regression` `@perf` | **Yes**<br>- Config: `.lighthouserc.json` (`categories:performance >= 0.90`)<br>- Workflow: `.github/workflows/ci.yml` (`lighthouse-ci` job)<br>- Artifacts: Saved in `.lighthouseci/` |
| **TC-LHCI-002** | Lighthouse CI Accessibility & SEO Quality Gate | Audit frontend SPA pages for WCAG accessibility compliance and SEO metadata. Assert Accessibility score is at least 0.95 (95%) and SEO score is at least 0.90 (90%). | High | CI Quality Gate (Lighthouse CI) | `@regression` `@a11y` | **Yes**<br>- Config: `.lighthouserc.json` (`categories:accessibility >= 0.95`, `categories:seo >= 0.90`)<br>- Optimization: `frontend/index.html` (semantic metadata, theme-color, title) |



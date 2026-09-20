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
| **TC-PERF-004** | Endurance Soak Benchmark & Capacity Breakpoint Saturation | Execute sustained load (20–30 VUs, 15–30 min) and continuous ramp capacity breakpoint tests. Verify memory stability, absence of event loop latency drift, and error rate < 0.1%. Identify system saturation concurrency threshold. | Critical | API Performance (k6) | `@perf` `@endurance` | **Yes**<br>- Scripts: `performance/scenarios/soak-load.js`, `performance/scenarios/breakpoint-test.js`<br>- Runners: `npm run test:perf:soak`, `npm run test:perf:breakpoint`<br>- Workflow: `.github/workflows/perf-endurance.yml`<br>- Assertions: p95 latency stability, error rate < 0.1% |
| **TC-PERF-005** | Automated Baseline Relative Regression Gate in CI | Automatically compare PR benchmark metrics against golden git baseline (`baseline-perf.json`). Calculate percentage delta: `((current - baseline) / baseline) * 100`. Strictly fail CI with exit code 1 if p95 latency degrades by > 20% on critical endpoints. | Critical | CI Quality Gate (k6 / Node.js) | `@perf` `@regression` | **Yes**<br>- Script: `performance/report-perf-summary.js` (`--baseline=<path>`)<br>- Baseline: `performance/baselines/baseline-perf.json`<br>- Gate Rule: Fail exit code 1 on > +20% p95 regression<br>- Workflow: `.github/workflows/ci.yml` (`perf-benchmarks`) |

### **Suite: Lighthouse CI Quality Gates**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-LHCI-001** | Lighthouse CI Core Web Vitals & Performance Gate | Audit frontend SPA distribution bundle in headless Chrome. Assert Lighthouse Performance category score is at least 0.90 (90%). Block pull requests on regression. | Critical | CI Quality Gate (Lighthouse CI) | `@smoke` `@regression` `@perf` | **Yes**<br>- Config: `.lighthouserc.json` (`categories:performance >= 0.90`)<br>- Workflow: `.github/workflows/ci.yml` (`lighthouse-ci` job)<br>- Artifacts: Saved in `.lighthouseci/` |
| **TC-LHCI-002** | Lighthouse CI Accessibility & SEO Quality Gate | Audit frontend SPA pages for WCAG accessibility compliance and SEO metadata. Assert Accessibility score is at least 0.95 (95%) and SEO score is at least 0.90 (90%). | High | CI Quality Gate (Lighthouse CI) | `@regression` `@a11y` | **Yes**<br>- Config: `.lighthouserc.json` (`categories:accessibility >= 0.95`, `categories:seo >= 0.90`)<br>- Optimization: `frontend/index.html` (semantic metadata, theme-color, title) |

---

## 8. CI/CD Pipeline Optimization, Fast-Feedback Gates & Concurrency Control

*Sprint Sources:*
- *[Sprint 4.1: Pipeline Deduplication & Build Artifact Sharing](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_4_1_pipeline_deduplication_and_artifact_sharing.md)*
- *[Sprint 4.2: Fast-Feedback Parallelization & Concurrency Control](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_4_2_fast_feedback_parallelization_and_concurrency.md)*
- *[Sprint 4.3: Performance Runner Resilience & Consolidated Test Reporting](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_4_3_performance_resilience_and_test_reporting.md)*
- *[Sprint 5.1: Ephemeral Playwright E2E Smoke Gate & Strict Failure Enforcement](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_5_1_ephemeral_e2e_smoke_and_strict_gates.md)*

These test cases validate CI/CD pipeline deduplication, GitHub Actions artifact upload/download sharing, deterministic `npm ci` execution, Stage 1 parallel static quality gates, workflow concurrency auto-cancellation, path-based trigger filtering, tiered performance gates (PR smoke vs main stress), consolidated test & coverage Step Summaries, ephemeral Playwright E2E smoke gates against pre-built artifacts, and strict zero-tolerance failure gate enforcement.

### **Suite: CI/CD Pipeline Optimization & Fast Feedback**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-CI-001** | Pipeline Build Artifact Sharing & Zero-Rebuild Downstream Consumption | Verify that `backend-build` and `frontend-build` upload `dist` directories as GitHub Actions artifacts (`actions/upload-artifact@v4`) and downstream jobs (`lighthouse-ci`, `perf-benchmarks`) download them (`actions/download-artifact@v4`) to execute audits and benchmarks with zero rebuilds and reduced runner time. | Critical | GitHub Actions CI (`ci.yml`) | `@smoke` `@regression` `@perf` | **Yes**<br>- Workflow: `.github/workflows/ci.yml`<br>- Jobs: `backend-build`, `frontend-build`, `lighthouse-ci`, `perf-benchmarks`<br>- Artifacts: `backend-dist`, `frontend-dist` (retention: 1 day) |
| **TC-CI-002** | Deterministic Dependency Resolution & Compiler Deduplication | Verify that all jobs in `ci.yml` strictly use `npm ci` for deterministic dependency resolution and that `e2e-quality-gate` removes redundant `npx tsc --noEmit`, relying exclusively on internal `runTypeScriptCheck()` inside `finalize-spec.ts`. | High | CI Quality Gate & POM Validator | `@regression` | **Yes**<br>- Workflow: `.github/workflows/ci.yml`<br>- Script: `playwright-e2e/scripts/finalize-spec.ts`<br>- Coverage: 0 `npm install` instances, single-invocation typechecking |
| **TC-CI-003** | Stage 1 Parallel Static Architecture Quality Gate | Verify that `e2e-quality-gate` executes concurrently in Stage 1 without upstream `needs` dependencies (`backend-tests`, `frontend-tests`, `backend-build`, `frontend-build`), executing POM architecture encapsulation validation and typechecking within ~60 seconds of code push for immediate developer feedback. | High | GitHub Actions CI (`ci.yml`) / Playwright Quality Gate | `@smoke` `@regression` | **Yes**<br>- Workflow: `.github/workflows/ci.yml`<br>- Job: `e2e-quality-gate` (Stage 1C)<br>- Script: `playwright-e2e/scripts/finalize-spec.ts`<br>- Latency: ~60s fast feedback |
| **TC-CI-004** | Workflow Concurrency Cancellation & Path-Based Trigger Filtering | Verify that `ci.yml` defines top-level `concurrency` with `cancel-in-progress: true` keyed by `${{ github.workflow }}-${{ github.ref }}` to terminate redundant runs upon newer commits, and `paths-ignore` (`'**.md'`, `'docs/**'`, `'.vscode/**'`, `'.gitignore'`) on `push` and `pull_request` triggers to skip CI on documentation-only commits. | Medium | GitHub Actions CI (`ci.yml`) | `@regression` | **Yes**<br>- Workflow: `.github/workflows/ci.yml`<br>- Concurrency: `group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true`<br>- Filter: `paths-ignore` on push & PR |
| **TC-CI-005** | Tiered API Performance Gates (PR Smoke vs Main Stress) | Verify that `perf-benchmarks` branches execution by event type: running lightweight 5-VU smoke benchmark (`smoke-load.js`) completing in ~10s on pull requests with tuned tolerances (`http_req_failed < 0.02`), and reserving full 50-VU catalog load and 30-VU inventory stress benchmarks for `main` branch pushes. | Critical | GitHub Actions CI (`ci.yml`) / k6 Performance | `@smoke` `@regression` `@perf` | **Yes**<br>- Workflow: `.github/workflows/ci.yml` (`perf-benchmarks`)<br>- Scripts: `performance/k6/smoke-load.js`, `catalog-load.js`, `inventory-stress.js`<br>- Reporter: `performance/report-perf-summary.js`<br>- Artifact: `perf-summaries` (retention: 7 days) |
| **TC-CI-006** | Consolidated Test Results & Coverage Reporting into GitHub Step Summary | Verify that unit and component test suites (`backend-tests` with Jest, `frontend-tests` with Vitest) generate machine-readable test results (`test-results.json`) and coverage summaries (`coverage-summary.json`), render formatted GitHub Flavored Markdown summary tables into `$GITHUB_STEP_SUMMARY`, and upload coverage reports as downloadable artifacts (`actions/upload-artifact@v4`). | High | GitHub Actions CI (`ci.yml`) / Test Reporting | `@smoke` `@regression` | **Yes**<br>- Workflow: `.github/workflows/ci.yml`<br>- Script: `scripts/generate-test-summary.js`<br>- Artifacts: `backend-coverage`, `frontend-coverage` (retention: 7 days)<br>- Summary: Pass/fail counts & statement/branch/function/line coverage % |
| **TC-CI-007** | Ephemeral Playwright E2E Smoke Gate on Pull Requests | Verify that pull requests in `ci.yml` execute an ephemeral Playwright `@smoke` test suite in Stage 3 (`e2e-smoke`) against locally spun-up backend and frontend preview instances using pre-built `dist` artifacts, completing in under 60 seconds with 2 parallel workers and blocking pull request merges upon any assertion failure. | Critical | GitHub Actions CI (`ci.yml`) / Playwright E2E Smoke | `@smoke` `@regression` | **Yes**<br>- Workflow: `.github/workflows/ci.yml` (`e2e-smoke`)<br>- Command: `npx playwright test --grep "@smoke" --grep-invert "@quarantine" --workers=2`<br>- Artifacts: `playwright-smoke-failure-artifacts`, `ephemeral-server-logs` (retention: 7 days) |
| **TC-CI-008** | Strict Quality Gate Enforcement & Flaky Test Quarantine | Verify that all Playwright CI workflows (`playwright-ci.yml`, `playwright-docker.yml`, and `ci.yml`) strictly fail workflow runs upon assertion failures with zero error suppression (`continue-on-error: true` removed), while preserving Allure report deployment via `if: always()` and excluding quarantined tests via `grepInvert: /@quarantine/`. | Critical | GitHub Actions CI (`playwright-ci.yml`, `playwright-docker.yml`) / Quality Gate | `@smoke` `@regression` | **Yes**<br>- Workflows: `.github/workflows/playwright-ci.yml`, `.github/workflows/playwright-docker.yml`, `.github/workflows/ci.yml`<br>- Config: `playwright-e2e/src/config/playwright.config.ts` (`grepInvert: /@quarantine/`)<br>- Quality Gate: Zero failure masking, strict exit code enforcement |

---

## 9. Ephemeral WebServer Orchestration & Cross-Browser Matrix Tests

*Sprint Source: [Sprint 5.2: Self-Contained Local WebServer Orchestration & Multi-Browser Matrix](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_5_2_local_webserver_and_multi_browser_matrix.md)*

These test cases validate zero-dependency local developer execution via native Playwright `webServer` orchestration, automated fallback mock seed credentials, and multi-browser and mobile device emulation (Chromium, Firefox, WebKit, Pixel 5, and iPhone 13).

### **Suite: Self-Contained Local WebServer Orchestration & Cross-Browser Matrix**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-QA-009** | Native WebServer Local Orchestration & Seed Fallback Authentication | Verify that running `npx playwright test` or `npm run test:e2e:local` from a clean terminal without running servers automatically boots backend (`http://127.0.0.1:4000`) and frontend preview (`http://127.0.0.1:5173`) via Playwright `webServer` lifecycle hooks, uses seeded fallback credentials (`admin` / `password123`) when environment variables are omitted, and cleanly shuts down background processes upon test completion. | Critical | Playwright Orchestration & Auth Fixture | `@smoke` `@regression` | **Yes**<br>- Config: `playwright-e2e/src/config/playwright.config.ts` (`webServer` array with reuseExistingServer)<br>- Env: `playwright-e2e/src/config/env.config.ts` (`getLoginCredentials` fallback defaults)<br>- Runner: `npm run test:e2e:local` |
| **TC-QA-010** | Cross-Browser Engine & Mobile Device Emulation Matrix | Verify that core critical user journeys (Catalog search, cart addition, checkout, user authentication) execute successfully and render accurately across Desktop Chromium, Firefox (Gecko), WebKit (Desktop Safari), and mobile viewports with touch emulation (Pixel 5 mobile Chrome and iPhone 13 mobile Safari), adapting navigation to mobile drawer menus without DOM clipping or tap target errors. | Critical | Playwright Cross-Browser & Mobile Matrix | `@smoke` `@regression` | **Yes**<br>- Config: `playwright-e2e/src/config/playwright.config.ts` (`projects` matrix)<br>- Page Objects: `CatalogPage` (responsive mobile drawer handling)<br>- Runners: `npm run test:e2e:chromium`, `test:e2e:firefox`, `test:e2e:webkit`, `test:e2e:mobile`, `test:e2e:all` |

---

## 10. Hermetic Regression Orchestration, Session Chaos Isolation & Auth State Optimization

*Sprint Source: [Sprint 6.1: Hermetic Regression Environments, Session Chaos Isolation & Auth State Optimization](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_6_1_hermetic_regression_and_auth_optimization.md)*

These test cases validate decoupling regression from shared staging environments into containerized/ephemeral local stacks, session-partitioned chaos state isolation via `x-test-session-id`, global Playwright `storageState` authentication caching (`auth.setup.ts`), and migrating API test suites from Axios to native `APIRequestContext`.

### **Suite: Hermetic Regression Orchestration, Session Chaos Isolation & Auth State Optimization**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-QA-011** | Ephemeral Regression Execution & Session-Partitioned Chaos Isolation | Verify that regression test suites execute against ephemeral local services (`BASE_URL=http://127.0.0.1:5173`, `API_BASE_URL=http://127.0.0.1:4000`) with zero outbound requests to Render staging. Verify backend `testController.ts` isolates chaos configuration and reset actions to `x-test-session-id`, ensuring parallel execution of chaos tests does not interfere with concurrent worker datastores or reset active carts. Assert teardown hook cleans up session memory via `DELETE /api/test/session/:id`. | Critical | Backend Chaos & E2E Isolation | `@smoke` `@regression` `@chaos` | **Yes**<br>- Backend: `backend/src/controllers/testController.ts`, `backend/src/data/chaosStore.ts`<br>- Fixture: `playwright-e2e/src/core/base/base.fixture.ts`<br>- Workflows: `.github/workflows/playwright-ci.yml`<br>- Tests: `backend/src/__tests__/testController.test.ts`, `Test_010_VisualRegressionChaos.spec.ts` |
| **TC-QA-012** | Global Playwright Auth State Caching & Native APIRequestContext Migration | Verify that `auth.setup.ts` pre-authenticates seed credentials (`admin` / `password123`) and persists cookies and `authUser` localStorage into `.auth/user.json`. Dependent UI test suites consume inherited auth state, reducing UI test duration by at least 25% by removing redundant login steps. Verify API test specs execute via native Playwright `request: APIRequestContext` with auto-tracing, recording full request/response payloads in Playwright traces. | Critical | Playwright Auth & Native API Engine | `@smoke` `@regression` | **Yes**<br>- Setup: `playwright-e2e/src/tests/auth.setup.ts`<br>- Config: `playwright-e2e/src/config/playwright.config.ts` (`setup` project & `storageState`)<br>- Specs: `src/tests/ui/Checkout/`, `src/tests/api/BookCatalog/Test_001_BooksApi.spec.ts`<br>- Assertions: Web-first Playwright assertions (`expect(response).toBeOK()`) |

---

## 11. Multi-Tiered Performance Baselines, Endurance Telemetry & Quarantine Governance

*Sprint Source: [Sprint 6.3: Multi-Tiered Performance Baselines, Endurance Telemetry & Quarantine Governance](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_6_3_performance_telemetry_baselines_and_quarantine_governance.md)*

These test cases validate scenario-specific k6 golden baselines (`smoke`, `catalog`, `soak`), Node.js memory drift and event loop telemetry assertions (< 30% drift), production-mode benchmark execution, automated Playwright failure summaries in GitHub Step Summaries, universal failure trace uploads, and closed-loop quarantine stability index audits with `--repeat-each=5`.

### **Suite: Performance Baselines, Endurance Telemetry & Quarantine Governance**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-PERF-003** | Multi-Tiered Golden Baselines & Endurance Memory Drift Assertion | Verify that k6 benchmarks evaluate against tier-specific baselines (`baseline-smoke.json` for 5-VU smoke, `baseline-catalog.json` for 50-VU catalog, `baseline-soak.json` for 25-VU endurance soak) enforcing a strict +20% relative latency regression gate under `NODE_ENV=production`. Verify that endurance soak scenarios (`soak-load.js`) poll `GET /api/health` telemetry, measure heapUsed drift, and strictly assert process heap growth does not exceed 30% over test baseline. | Critical | k6 Performance & Node Telemetry | `@perf` `@regression` | **Yes**<br>- Baselines: `performance/baselines/baseline-*.json`<br>- Script: `performance/scenarios/soak-load.js`<br>- Gate: `performance/report-perf-summary.js`<br>- Workflows: `.github/workflows/ci.yml`, `.github/workflows/perf-endurance.yml` |
| **TC-QA-015** | Automated Quality Gate PR Summaries & Closed-Loop Quarantine Governance | Verify that Playwright CI workflows (`playwright-ci.yml`) parse test results to output markdown status tables directly into `$GITHUB_STEP_SUMMARY` with failure details and links to downloadable failure traces (`playwright-traces-*`, retention: 7 days). Verify that `.github/workflows/quarantine-audit.yml` and `scripts/quarantine-audit.js` execute quarantined tests with `--repeat-each=5`, compute the Quarantine Stability Index, and recommend de-quarantine upon achieving 100% pass rate. | Critical | Playwright CI & Flaky Test Governance | `@smoke` `@regression` | **Yes**<br>- Script: `playwright-e2e/scripts/quarantine-audit.js`<br>- Workflows: `.github/workflows/playwright-ci.yml`, `.github/workflows/quarantine-audit.yml`<br>- Traces: `test-results/` & `reports/test-artifacts/` |

---

## 12. Interactive Performance Reporting, Unified Exporters & Dynamic Baseline Governance

*Sprint Source: [Sprint 8.1: Interactive HTML Reporting, Unified Exporters & CI Baseline Alignment](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_8_1_interactive_html_reporting_and_baseline_governance.md)*

These test cases validate standalone interactive HTML performance reporting dashboards, universal summary exporters across all k6 execution tiers, golden baseline alignment for inventory stress benchmarks, and dynamic metric regression gating.

### **Suite: Interactive Performance Dashboards & Dynamic Baseline Governance**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-PERF-006** | Standalone Interactive HTML Performance Dashboard & UI Reporting | Verify that k6 test runs and summary processing (`report-perf-summary.js --html=<path>`) generate a self-contained, responsive HTML5 dashboard with inline styles, SVG response-time percentile charts ($p50, p90, p95, p99$), throughput timelines, error distributions, health check breakdowns, and golden baseline delta cards with zero external CDN dependencies. | Critical | k6 Visual Reporting & Dashboard UI | `@perf` `@regression` | **Yes**<br>- Generator: `performance/utils/html-reporter.js`<br>- Reporter: `performance/report-perf-summary.js`<br>- Handlers: `performance/utils/summary-handler.js`<br>- Artifact: `performance/report*.html` |
| **TC-PERF-007** | Dynamic Metric Baseline Regression Gate & Inventory Alignment | Verify that `report-perf-summary.js` dynamically discovers and evaluates all custom Trend metrics (`*_duration`) present in current data and golden baselines, enforcing a strict +20% latency regression failure threshold. Verify that `inventory-stress.js` evaluates against `baseline-inventory.json` rather than catalog baselines in `.github/workflows/ci.yml`. | Critical | CI Quality Gate (k6 / Node.js) | `@perf` `@regression` | **Yes**<br>- Baseline: `performance/baselines/baseline-inventory.json`<br>- Gate: `performance/report-perf-summary.js`<br>- Script: `performance/k6/inventory-stress.js`<br>- Workflow: `.github/workflows/ci.yml` (`perf-benchmarks`) |

---

## 13. Monorepo Workspaces Orchestration, Secret Hygiene & Artifact Cleanliness

*Sprint Source: [Sprint 9.1: Monorepo Workspaces, Dependency Governance & Secret Hygiene](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_9_1_monorepo_workspaces_dependency_governance_and_secret_hygiene.md)*

These test cases validate native npm workspaces orchestration across all five subprojects, elimination of cross-platform shell script fragility, git secret hygiene (purging committed auth token artifacts and isolating storage state), and repository cleanliness with linter ignore alignment.

### **Suite: Monorepo Workspaces Orchestration, Secret Hygiene & Artifact Cleanliness**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-ARCH-001** | Native NPM Workspaces Dependency Orchestration & Cross-Platform Script Execution | Verify that running `npm install` from repository root installs dependencies for all declared workspaces (`backend`, `frontend`, `playwright-e2e`, `performance`, `shared`) without manual folder navigation. Verify all workspace execution scripts (`npm run build`, `npm run dev:backend`, `npm run dev:frontend`, `npm run test:backend`, `npm run test:frontend`, `npm run test:e2e`) execute reliably across Windows PowerShell and Linux bash without relying on chained `cd dir &&` shell commands. | Critical | Monorepo Architecture & NPM Workspaces | `@arch` `@workspace` | **Yes**<br>- Config: `package.json` (`workspaces` array)<br>- Scripts: `package.json` workspace targets |
| **TC-SEC-001** | Git Secret Hygiene & Isolated Playwright Auth State Management | Verify that authentication storage state (`auth-state.json`) containing live/expired JWTs and cookies is permanently untracked from Git. Verify `auth.util.ts` saves test session state exclusively to gitignored `playwright-e2e/.auth/user.json`, creating parent directories automatically if absent. Assert `git status` displays zero untracked or modified credential files after running authentication fixtures. | Critical | Security Audit & Auth State Isolation | `@sec` `@auth` | **Yes**<br>- Helper: `playwright-e2e/src/utils/auth.util.ts`<br>- Setup: `playwright-e2e/src/tests/auth.setup.ts`<br>- Ignore: `.gitignore` |
| **TC-ARCH-002** | Clean Linter Execution & Test Artifact Git Exclusion | Verify that running `npm run lint` executes ESLint across workspaces and outputs 0 errors and 0 warnings. Assert that `frontend/eslint.config.js` properly ignores `coverage/` directories to prevent Istanbul/Vitest coverage files from raising unused-disable warnings. Verify `.gitignore` comprehensively excludes all ephemeral test databases (`backend/db.test.*.json`), test results, and performance test summaries (`perf-summary*.json`, `report*.html`). | High | Code Quality & Linter Hygiene | `@lint` `@dx` | **Yes**<br>- Linter: `frontend/eslint.config.js`<br>- Ignore: `.gitignore`<br>- Script: `npm run lint` |

---

## 14. Backend Atomic Persistence, Concurrency Mutex & Security Hardening

*Sprint Source: [Sprint 9.2: Backend Atomic Persistence, Concurrency Mutex & Security Hardening](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_9_2_backend_atomic_persistence_concurrency_mutex_and_security_hardening.md)*

These test cases validate atomic file persistence with Windows-safe file replacement fallbacks, serialized FIFO write queues preventing data loss under concurrency, multi-tenant CORS wildcard hardening, background timer lifecycle unreferencing, and LRU memory-bounded session caching.

### **Suite: Backend Atomic Persistence, Concurrency Mutex & Security Hardening**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-PERSIST-001** | Windows-Safe Atomic File Persistence & Concurrency Mutex Queue | Verify that database file writes in `storage.ts` execute atomically using unique temporary files (`${DB_PATH}.${timestamp}.${rand}.tmp`) and atomic `rename` with automatic fallback to `copyFile` + `unlink` upon encountering Windows file locking errors (`EPERM`, `EBUSY`, `EEXIST`, `EACCES`). Verify that concurrent asynchronous writes are serialized via a FIFO write queue without dropping intermediate updates, and that 50 rapid concurrent mutations flush cleanly with zero file corruption or unhandled errors. | Critical | Backend Persistence & Storage Layer | `@persist` `@concurrency` | **Yes**<br>- Engine: `backend/src/data/storage.ts`<br>- Tests: `backend/src/__tests__/storage.test.ts` |
| **TC-SEC-002** | Multi-Tenant CORS Origin Hardening & Hostname Restriction | Verify that CORS middleware in `backend/src/app.ts` strictly whitelists authorized frontend origins (`https://buggy-books-fe.onrender.com`, `http://localhost:*`, `http://127.0.0.1:*`, and `ALLOWED_ORIGINS` env). Assert that unauthorized wildcard subdomains on shared multi-tenant hosts (e.g. `https://attacker.onrender.com`, `https://malicious-app.onrender.com`) are rejected with CORS validation failure and no credentials/allow-origin headers are exposed. | Critical | Backend Security & CORS Boundary | `@sec` `@cors` | **Yes**<br>- Config: `backend/src/config.ts`<br>- Middleware: `backend/src/app.ts`<br>- Tests: `backend/src/__tests__/api.test.ts` |
| **TC-RESIL-001** | Server Lifecycle Timer Unreferencing & LRU Session Storage Bounds | Verify that periodic background simulation intervals in `backend/src/server.ts` call `.unref()` and are disabled in test environments (`NODE_ENV === 'test'`) to ensure clean Jest test worker shutdown without open handle leaks. Verify that `SessionStorageManager` in `backend/src/data/storage.ts` enforces an upper bound (`MAX_SESSIONS = 1000`) and automatically purges the least-recently-accessed (LRU) sessions to prevent heap exhaustion. | High | System Resilience & Resource Hygiene | `@resilience` `@lifecycle` | **Yes**<br>- Server: `backend/src/server.ts`<br>- Storage: `backend/src/data/storage.ts`<br>- Tests: `backend/src/__tests__/storage.test.ts` |

---

## 15. Frontend Dynamic CSRF Lifecycle, Route Safety & Mock Harmonization

*Sprint Source: [Sprint 9.3: Frontend Dynamic CSRF Lifecycle, Route Safety & Mock Harmonization](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_9_3_frontend_dynamic_csrf_route_safety_and_mock_harmonization.md)*

These test cases validate the self-healing CSRF token lifecycle, non-destructive React Router navigation callbacks upon authentication expiration, unified Mock Service Worker (MSW) component test mock harmonization, and baseline ARIA landmark accessibility inside the Shadow DOM component.

### **Suite: Frontend Dynamic CSRF Lifecycle, Route Safety & Mock Harmonization**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-CSRF-001** | Dynamic Self-Healing CSRF Lifecycle & Automatic Mutating Retry | Verify that `frontend/src/api.ts` transparently intercepts HTTP 403 Forbidden responses caused by stale or mismatched CSRF tokens on mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`). Verify that it clears the cached token, requests a fresh token from `/api/csrf-token`, and automatically retries the operation once before throwing. Verify that persistent errors fail cleanly after exactly one retry attempt. | Critical | Frontend API Client & Resilience | `@csrf` `@resilience` | **Yes**<br>- Client: `frontend/src/api.ts`<br>- Tests: `frontend/src/__tests__/api-csrf-lifecycle.test.ts` |
| **TC-ROUTER-001** | Client-Side Safe Unauthorized Navigation via AuthContext Callbacks | Verify that unauthenticated HTTP 401 responses in `frontend/src/api.ts` trigger registered client-side navigation callbacks via `AuthContext.tsx` (`navigate('/login')`) rather than executing hardcoded `window.location.href = '/login'`. Assert that SPA in-memory state is preserved and test runner environments are not crashed by full browser page navigation. | Critical | Frontend Routing & Authentication | `@auth` `@routing` | **Yes**<br>- Client: `frontend/src/api.ts`<br>- Context: `frontend/src/AuthContext.tsx`<br>- Bridge: `frontend/src/App.tsx`<br>- Tests: `frontend/src/__tests__/api-csrf-lifecycle.test.ts` |
| **TC-MOCK-001** | Harmonized Component Test Mocking via Mock Service Worker (MSW) | Verify that all frontend component and hook tests execute cleanly against a centralized Mock Service Worker (MSW) layer in `setupTests.ts` and `handlers.ts` without relying on brittle `globalThis.fetch` overrides. Verify that handlers for `/api/test/config`, `/api/books`, `/api/csrf-token`, and `/api/cart` cleanly handle requests across all 10 component test suites. | High | Test Infrastructure & Mock Harmonization | `@msw` `@vitest` | **Yes**<br>- Setup: `frontend/src/setupTests.ts`<br>- Handlers: `frontend/src/mocks/handlers.ts`<br>- Suites: `frontend/src/**/*.test.tsx` |
| **TC-A11Y-002** | Shadow DOM Web Component Accessible ARIA Landmark Roles | Verify that the `<order-summary-box>` custom Web Component in `frontend/src/components/OrderSummary.tsx` defines semantic landmark container attributes (`role="region"`, `aria-label="Order Summary"`, and `id="summary-title"`) within the shadow root. Assert that accessibility audits pass without violations when chaos mode is disabled, while maintaining isolated open shadow root encapsulation for test piercing automation. | High | Accessibility & Shadow DOM Automation | `@a11y` `@shadow-dom` | **Yes**<br>- Component: `frontend/src/components/OrderSummary.tsx`<br>- Tests: `frontend/src/__tests__/api-csrf-lifecycle.test.ts` |

---

## 16. Diagnostic Assertion Architecture, Step-by-Step Logging & Native Actionability

*Sprint Source: [Sprint 10.1: Diagnostic Assertion Architecture, Step-by-Step Logging & Native Actionability](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_10_1_diagnostic_assertion_architecture_and_step_logging.md)*

These test cases validate the diagnostic verification engine, direct Playwright failure diff generation, structured Winston step logging and Allure timeline persistence, native auto-waiting across Page Object action wrappers, and the complete elimination of boolean accumulator anti-patterns.

### **Suite: Diagnostic Assertion Architecture, Step-by-Step Logging & Native Actionability**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-ASSERT-001** | Diagnostic Assertion Architecture & Exact Failure Diffs | Verify that `CommonFunctions.verifyValue` and `verifyCondition` execute direct Playwright assertions producing exact expected vs received failure diffs (`Expected: [expected] but Received: [actual]`) while logging structured timestamped entries to Winston (`logs/framework.log`, `logs/error.log`) and Allure timeline steps. Verify that soft assertions (`soft: true`) continue execution when requested. | Critical | Automation Framework Core (`common.util.ts`) | `@assert` `@diagnostic` | **Yes**<br>- Engine: `playwright-e2e/src/utils/common.util.ts`<br>- Tests: `playwright-e2e/src/tests/ui/Diagnostic/Test_011_DiagnosticAssertionEngine.spec.ts` |
| **TC-AUTO-WAIT-001** | Native Playwright Auto-Waiting & Elimination of Fixed Wait Traps in BasePage | Verify that `BasePage` action wrappers (`doClick`, `doEnterText`, `doGetText`, `doGetAttribute`, `mouseHover`, `clearAndSetInputValue`, `addTextFieldValue`) rely on Playwright's native auto-waiting (attached, visible, stable, enabled, editable) with calibrated timeouts without wrapping actions in artificial 3000ms delay traps. Verify that all 8 Page Objects pass encapsulation and wrapper checks via `finalize-spec.ts --all-poms`. | High | Page Object Model Architecture (`base.page.ts`) | `@pom` `@auto-wait` | **Yes**<br>- Base: `playwright-e2e/src/core/base/base.page.ts`<br>- Validation: `scripts/finalize-spec.ts --all-poms` |
| **TC-LOG-001** | Structured Winston Step Logging and Allure Step Persistence | Verify that all UI test actions and verification steps across migrated test specs log structured entries to Winston (`logs/framework.log`, `logs/error.log`) with ISO timestamps and level indicators (`[PASS]`, `[FAIL]`, `[INFO]`), and generate corresponding Allure timeline steps with status emojis (`✅`, `❌`). | High | Observability & Test Reporting | `@observability` `@logging` | **Yes**<br>- Logger: `playwright-e2e/src/core/logger/logger.ts`<br>- Engine: `playwright-e2e/src/utils/common.util.ts` |
| **TC-ASSERT-002** | Complete Elimination of Boolean Accumulator Anti-Pattern in UI Test Specs | Verify that all UI test specs across Checkout, BookCatalog, UserManagement, Profile, Refresh, WebSockets, Styling, and VisualRegression suites execute direct step-level diagnostic assertions rather than accumulating boolean variables and asserting with trailing `expect(... && ...).toBeTruthy()`. Assert that failed steps fail fast at the exact line of code without cascading timeouts or opaque boolean error diffs. | Critical | E2E Test Suite Quality Governance | `@governance` `@e2e` | **Yes**<br>- Specs: `playwright-e2e/src/tests/ui/**/*.spec.ts`<br>- Validation: `playwright-e2e/scripts/finalize-spec.ts` |

---

## 17. Playwright Timeout Calibration, API Project Decoupling & Static Quality Linter

*Sprint Source: [Sprint 10.2: Playwright Timeout Calibration, API Project Decoupling & Static Quality Linter](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_10_2_playwright_timeout_calibration_api_decoupling_and_linter.md)*

These test cases validate calibrated 30s test timeouts and 10s expectation timeouts with fail-fast protection, dedicated headless API test project execution without browser dependencies or UI authentication bottlenecks, and static code quality governance using ESLint (`eslint-plugin-playwright`) and enhanced AST quality checks in `finalize-spec.ts`.

### **Suite: Playwright Timeout Calibration, API Project Decoupling & Static Quality Linter**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-TIMEOUT-001** | Playwright Fail-Fast Timeout Calibration & Per-Test Overrides | Verify that default test timeout is calibrated from 300s to 30s (`timeout: 30 * 1000`) and expectation timeout is set to 10s (`expect: { timeout: 10 * 1000 }`) in `playwright.config.ts`. Verify that hanging locators fail fast within 10–30s. Verify intentionally slow or chaos-heavy test suites (`Test_008_WebSocketResilienceValidation.spec.ts`, `Test_010_VisualRegressionChaos.spec.ts`) configure explicit `test.setTimeout(60000)` overrides and pass cleanly. | Critical | Playwright Test Configuration | `@timeout` `@fail-fast` | **Yes**<br>- Config: `playwright-e2e/src/config/playwright.config.ts`<br>- Suites: `Test_008_WebSocketResilienceValidation.spec.ts`, `Test_010_VisualRegressionChaos.spec.ts` |
| **TC-API-DECOUPLE-001** | Dedicated Headless API Test Project Decoupling | Verify that all 9 API test suites in `playwright-e2e/src/tests/api/` execute under a dedicated `api` Playwright project (`--project=api`) with `testDir: ../tests/api`, target `baseURL: envConfig.apiBaseUrl`, and default headers (`x-bypass-rate-limit: true`). Assert that `api` project does not depend on `setup` (`auth.setup.ts`) or launch any browser processes. Assert that browser UI projects (`chromium`, `firefox`, etc.) are restricted to `../tests/ui`. | Critical | Test Project Architecture & CI Acceleration | `@api` `@decoupled` | **Yes**<br>- Config: `playwright-e2e/src/config/playwright.config.ts`<br>- Specs: `playwright-e2e/src/tests/api/**/*.spec.ts`<br>- Workflow: `.github/workflows/playwright-ci.yml` |
| **TC-LINT-001** | Static Playwright ESLint & AST Quality Linter Governance | Verify that `playwright-e2e` configures ESLint with `eslint-plugin-playwright` and `@typescript-eslint` in `eslint.config.mjs`, enforcing rules against unawaited promises (`missing-playwright-await`), static waits (`no-wait-for-timeout`), element handles (`no-element-handle`), and evaluating strings (`no-eval`). Verify that `scripts/finalize-spec.ts` flags boolean accumulator assertions (`expect(.*&&.*).toBeTruthy()`). Assert that `npm run lint` and `npm run finalize-spec -- --all-poms` pass with 0 errors across the monorepo. | High | Code Quality & Static Analysis | `@lint` `@ast` `@governance` | **Yes**<br>- Linter: `playwright-e2e/eslint.config.mjs`<br>- Validator: `playwright-e2e/scripts/finalize-spec.ts`<br>- Workflow: `.github/workflows/ci.yml` (`e2e-quality-gate`) |

---

## 18. CI/CD Pipeline Hermetic Isolation, Process Management & Report Deployment

*Sprint Source: [Sprint 10.3: CI/CD Pipeline Hermetic Isolation, Process Management & Report Deployment](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_10_3_cicd_pipeline_hermetic_isolation_and_report_governance.md)*

These test cases validate native Playwright managed `webServer` lifecycle orchestration across CI and local workflows without shell background process traps, database snapshotting and isolation across sequential k6 performance benchmark tiers, resilient repository name and owner URL interpolation for Allure and Monocart publishing, and staging environment warm-up checks preventing cold-start timeout failures.

### **Suite: CI/CD Pipeline Hermetic Isolation, Process Management & Report Deployment**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-CICD-001** | Native Playwright Managed WebServer Lifecycle in CI | Verify that CI pipelines (`ci.yml`, `playwright-ci.yml`, `quarantine-audit.yml`) orchestrate backend and frontend server lifecycles exclusively through Playwright's native `webServer` block in `playwright.config.ts`. Assert that Playwright polls HTTP readiness endpoints (`http://127.0.0.1:4000/api/books` and `http://127.0.0.1:5173`) with calibrated 60s timeouts and `reuseExistingServer: !process.env.CI`. Assert that all child server processes are cleanly terminated at test completion with zero lingering background zombie processes or port binding conflicts. | Critical | CI/CD Process Governance & Orchestration | `@cicd` `@webserver` `@hermetic` | **Yes**<br>- Config: `playwright-e2e/src/config/playwright.config.ts`<br>- Workflows: `.github/workflows/ci.yml`, `.github/workflows/playwright-ci.yml`, `.github/workflows/quarantine-audit.yml` |
| **TC-PERF-ISOLATE-001** | Database State Isolation Across k6 Performance Benchmark Gates | Verify that `ci.yml` Stage 3B captures a pre-benchmark snapshot of `backend/db.json` to `backend/db.json.bak` and restores the database file and resets memory state (`POST /api/test/reset`) before every sequential benchmark tier (`smoke`, `catalog`, `inventory`, `journey`, `auth`, `checkout`). Verify that `perf-endurance.yml` establishes database state isolation between the endurance soak test and the breakpoint capacity saturation test, ensuring high-VU inventory depletion does not invalidate threshold metrics. | High | Performance Regression & Data Integrity | `@perf` `@k6` `@isolation` | **Yes**<br>- Workflows: `.github/workflows/ci.yml`, `.github/workflows/perf-endurance.yml`<br>- State: `backend/db.json` |
| **TC-REPORT-DEPLOY-001** | Resilient Report Deployment URL Resolution Across Trigger Contexts | Verify that Allure and Monocart report publishing steps in `playwright-ci.yml`, `playwright-docker.yml`, and `playwright-on-demand.yml` reliably extract repository name and owner from `GITHUB_REPOSITORY` (`${GITHUB_REPOSITORY#*/}` and `${GITHUB_REPOSITORY%/*}`) rather than fragile `github.event.repository.name`. Assert that GitHub Pages URLs in GitHub Step Summaries resolve accurately across all trigger types (`push`, `pull_request`, `workflow_dispatch`, `schedule`). | High | Test Reporting & GitHub Actions Context | `@reporting` `@allure` `@gh-pages` | **Yes**<br>- Workflows: `.github/workflows/playwright-ci.yml`, `.github/workflows/playwright-docker.yml`, `.github/workflows/playwright-on-demand.yml` |
| **TC-DOCKER-PREFLIGHT-001** | Staging Environment Pre-Flight Health Check & Render Cold-Start Warm-Up | Verify that `playwright-docker.yml` Job 1 executes an idempotent pre-flight warm-up check pinging Render backend (`https://buggy-books.onrender.com/api/books`) and frontend (`https://buggy-books-fe.onrender.com/`) with `curl` and `npx wait-on -t 90000` prior to launching 8 parallel dynamic test shards. Assert that cold-start spin-up delays on Render free tier do not trigger false-positive 502/504 gateway timeout failures during sharded test execution. | High | Staging Verification & Docker Dynamic Sharding | `@docker` `@staging` `@preflight` | **Yes**<br>- Workflow: `.github/workflows/playwright-docker.yml` |

---
## 19. Dual-Mode Mobile Authentication & Expo Scaffolding

*Sprint Source: [Sprint 11.1: Backend Dual-Auth & Expo Monorepo Scaffolding](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_11_1_backend_dual_auth_and_expo_monorepo_scaffolding.md)*

These test cases validate the backend dual-authentication architecture supporting both web cookie sessions and mobile Bearer tokens, silent refresh token rotation via JSON payloads and cookies, double-submit cookie CSRF exemption for Bearer token requests, authenticated Multer avatar uploads, and Expo React Native workspace integrity.

### **Suite: Dual-Mode Mobile Authentication & Expo Scaffolding**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **TC-DUAL-AUTH-001** | Dual-Mode Authentication (Bearer Token Header & Cookie Fallback) on Protected Routes | Verify that protected routes (`/api/cart`, `/api/profile`, `/api/orders`) accept valid `Authorization: Bearer <jwt>` headers. Verify that requests without `Authorization` header fall back to `req.cookies?.token`. Assert that requests with neither or invalid tokens receive `401 Unauthorized` or `403 Forbidden`. Verify structured logger context (`loggerStore`) accurately records authenticated username. | Critical | Backend API & Auth Middleware (`api.ts`) | `@auth` `@dual-auth` `@security` | **Yes**<br>- Middleware: `backend/src/routes/api.ts`<br>- Tests: `backend/src/__tests__/authRefresh.test.ts` |
| **TC-REFRESH-BODY-001** | Silent Token Refresh via JSON Body Payload & Silent Rotation | Verify that `POST /api/auth/refresh` accepts a JSON body containing `{ refreshToken: "<jwt>" }` (in addition to cookie fallback). Verify that successful refresh returns `{ success: true, username, token, refreshToken }` with a refreshed access token and newly rotated refresh token (`expiresIn: 30d`) in the JSON payload, while also setting the `token` and `refreshToken` cookies for web clients. | Critical | Backend Auth Service & Controller | `@auth` `@token-rotation` `@api` | **Yes**<br>- Service: `backend/src/services/auth.service.ts`<br>- Controller: `backend/src/controllers/authController.ts`<br>- Tests: `backend/src/__tests__/authRefresh.test.ts` |
| **TC-CSRF-BEARER-001** | CSRF Exemption for Native Mobile Bearer Token Requests | Verify that mutating HTTP requests (`POST`, `PUT`, `DELETE`) carrying a valid `Authorization: Bearer <token>` header (length > 10) bypass double-submit cookie CSRF checks without requiring `x-csrf-token` header or `psifi.x-csrf-token` cookie. Assert that cookie-authenticated mutating requests without valid CSRF tokens remain strictly rejected with `403 Forbidden`. | Critical | CSRF Protection & Security Gateway (`app.ts`) | `@csrf` `@security` `@bearer` | **Yes**<br>- Guard: `backend/src/app.ts`<br>- Tests: `backend/src/__tests__/authRefresh.test.ts` |
| **TC-AVATAR-BEARER-001** | Avatar File Upload Attribution with Bearer Token Authentication | Verify that `POST /api/profile/upload` multipart file uploads authorized via `Authorization: Bearer <token>` attribute the uploaded file filename with `<username>-<timestamp>.ext` using `req.user.username` populated by `authenticateToken` middleware without redundant JWT decoding. | High | Profile Service & Multer Engine | `@profile` `@avatar` `@upload` | **Yes**<br>- Controller: `backend/src/controllers/profileController.ts`<br>- Tests: `backend/src/__tests__/profile.test.ts` |
| **TC-EXPO-SCAFFOLD-001** | Expo React Native Workspace Scaffolding, Metro Resolution & Unit Parity | Verify that `mobile/` workspace is configured in root `package.json`, isolated to React 18.3.1 types, resolves hoisted `@buggybooks/types` through `metro.config.js`, passes TypeScript typecheck without errors, and executes mobile unit tests successfully via Jest. | Critical | Mobile Workspace & Monorepo Scaffolding | `@mobile` `@expo` `@metro` | **Yes**<br>- Workspace: `mobile/`<br>- Config: `mobile/metro.config.js`, `mobile/tsconfig.json`<br>- Tests: `mobile/__tests__/App.test.tsx` |

---
## 20. Mobile Core Navigation, Authentication & Catalog Flow

*Sprint Source: [Sprint 11.2: Core Navigation, Authentication & Catalog Flow](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_11_2_core_navigation_authentication_and_catalog_flow.md)*

These test cases validate hardware-backed token persistence in `expo-secure-store`, the mobile Axios API client with 401/403 refresh interceptor mutex queue serialization, offline session hydration in `AuthContext`, root and tab navigation hierarchies, and full user journeys for Login, Registration, Catalog browsing, debounced search, pull-to-refresh, and Book Detail interaction.

### **Suite: Mobile Authentication & Session Persistence**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **MOB_AUTH_01** | Valid Login & SecureStore Token Persistence | Verify that submitting valid user credentials on `LoginScreen` stores `token` and `refreshToken` into `expo-secure-store`, updates `AuthContext.isAuthenticated` to `true`, and seamlessly transitions navigation from `AuthNavigator` to `AppTabNavigator` (Catalog tab). Assert that subsequent app launches automatically hydrate the authenticated session from SecureStore without requiring re-login. | Critical | Mobile Auth Flow & SecureStore | `@mobile` `@auth` `@secure-store` | **Yes**<br>- Context: `mobile/src/context/AuthContext.tsx`<br>- Storage: `mobile/src/utils/storage.ts`<br>- Tests: `mobile/src/__tests__/AuthContext.test.tsx`, `mobile/src/__tests__/storage.test.ts` |
| **MOB_AUTH_02** | Invalid Credentials & Accessible Error Banner | Verify that submitting incorrect username or password credentials displays an accessible error banner with clear error messaging. Assert that `expo-secure-store` remains empty, `isAuthenticated` remains `false`, and the user stays on `LoginScreen`. | High | Login Form Validation & Error UI | `@mobile` `@login` `@ui` | **Yes**<br>- Screen: `mobile/src/screens/LoginScreen.tsx`<br>- Tests: `mobile/src/__tests__/AuthContext.test.tsx` |
| **MOB_AUTH_03** | Registration & Instant Navigation to App Tabs | Verify that submitting valid Full Name, Username, and Password on `RegisterScreen` registers the user via `POST /api/auth/register`, extracts returned access and refresh tokens, stores them in `expo-secure-store`, and immediately navigates into `AppTabNavigator`. Assert error banner displays if username is already taken. | High | Registration Flow & Auto-Login | `@mobile` `@register` `@auth` | **Yes**<br>- Screen: `mobile/src/screens/RegisterScreen.tsx`<br>- Tests: `mobile/src/__tests__/AuthContext.test.tsx` |
| **MOB_AUTH_04** | Silent Token Refresh on Expiration via Mutex Queue | Verify that when an access token expires and protected API requests receive `401 Unauthorized` or `403 Forbidden` (`Invalid token`), the Axios response interceptor intercepts the failure, serializes concurrent failing requests into a mutex queue, executes a single `POST /api/auth/refresh` request, saves updated tokens to `expo-secure-store`, and transparently replays queued requests without user interruption. Assert that if refresh fails, stored tokens are cleared and the user is redirected to `LoginScreen`. | Critical | API Client Interceptors & Refresh Mutex | `@mobile` `@api-client` `@mutex` `@refresh` | **Yes**<br>- Client: `mobile/src/api/client.ts`<br>- Tests: `mobile/src/__tests__/client.test.ts` |
| **MOB_AUTH_05** | User Logout & SecureStore Token Purge | Verify that triggering "Log Out" on `ProfileScreen` or auth expiration calls `clearTokens()`, purges all tokens from `expo-secure-store`, resets `AuthContext` state (`user = null`, `isAuthenticated = false`), and transitions the user back to `LoginScreen`. Assert that pressing Android back button does not navigate back into authenticated tabs. | High | Logout Lifecycle & Session Teardown | `@mobile` `@logout` `@security` | **Yes**<br>- Context: `mobile/src/context/AuthContext.tsx`<br>- Screen: `mobile/src/screens/ProfileScreen.tsx`<br>- Tests: `mobile/src/__tests__/AuthContext.test.tsx`, `mobile/src/__tests__/storage.test.ts` |

### **Suite: Mobile Book Catalog & Detail Interaction**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|

---
## 21. Mobile Cart, Checkout, Profile & Chaos Control Center

*Sprint Source: [Sprint 11.3: Cart, Checkout, Profile & Chaos Control Center](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_11_3_cart_checkout_profile_and_chaos_control_center.md)*

These test cases validate mobile shopping cart management, real-time bottom tab badge updates, multi-step checkout form validation, resilient order placement with chaos error handling, native camera and photo library avatar uploads using `expo-image-picker`, and the in-app Chaos Control Center for dynamic backend configuration and test data resets.

### **Suite: Mobile Shopping Cart & Tab Badge Synchronization**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **MOB_CART_01** | Add to Cart & Real-Time Tab Badge Counter Update | Verify that tapping "Add to Cart" on `BookDetailScreen` calls `POST /api/cart`, updates `CartContext.cart`, and instantly reflects the new total item count in the `AppTabNavigator` Cart tab icon badge. | Critical | Cart State & Tab Badge Live Sync | `@mobile` `@cart` `@tab-badge` | **Yes**<br>- Context: `mobile/src/context/CartContext.tsx`<br>- Screens: `mobile/src/screens/BookDetailScreen.tsx`, `mobile/src/navigation/AppTabNavigator.tsx`<br>- Tests: `mobile/src/__tests__/CartContext.test.tsx` |
| **MOB_CART_02** | Cart Quantity Recalculation & Financial Breakdown | Verify that `CartScreen` displays grouped cart items with thumbnails, titles, unit prices, and quantity steppers (`-`/`+`). Assert that incrementing or decrementing quantities recalculates subtotal, estimated tax (8%), and order total in real time. | High | Cart Item Grouping & Price Calculations | `@mobile` `@cart` `@financial-summary` | **Yes**<br>- Screen: `mobile/src/screens/CartScreen.tsx`<br>- Context: `mobile/src/context/CartContext.tsx`<br>- Tests: `mobile/src/__tests__/CartContext.test.tsx` |
| **MOB_CART_03** | Item Removal, Empty Cart State & Clear All Action | Verify that tapping the delete button on a cart item removes it via `DELETE /api/cart/:bookId` and updates the total. Assert that tapping "Clear All" calls `DELETE /api/cart`, clears all items, resets the Cart tab badge to 0/hidden, and displays the "Your cart is empty" empty state with "Explore Catalog" CTA. | High | Cart Item Deletion & Empty State | `@mobile` `@cart` `@empty-state` | **Yes**<br>- Screen: `mobile/src/screens/CartScreen.tsx`<br>- Context: `mobile/src/context/CartContext.tsx`<br>- Tests: `mobile/src/__tests__/CartContext.test.tsx` |

### **Suite: Mobile Checkout & Order Placement**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **MOB_CHECK_01** | Checkout Form Validation (Required Fields & 16-Digit Card) | Verify that navigating from `CartScreen` to `CheckoutScreen` displays the Order Summary and shipping/payment form. Assert that submitting with missing fields or a credit card under 16 digits triggers immediate visual validation error messages preventing submission. | High | Form Validation & Client Error States | `@mobile` `@checkout` `@validation` | **Yes**<br>- Screen: `mobile/src/screens/CheckoutScreen.tsx`<br>- Tests: `mobile/src/__tests__/Checkout.test.tsx` |
| **MOB_CHECK_02** | Order Placement, Flaky Gateway Handling & Order Confirmation | Verify that submitting valid checkout details dispatches `POST /api/checkout/process`. On success, assert that the cart is cleared, and an Order Confirmation view displays the generated `orderId` and a "Continue Shopping" CTA. If the backend triggers stochastic chaos payment gateway failure (500), assert that a descriptive error banner displays prompting retry. | Critical | Order Placement & Stochastic Chaos Resilience | `@mobile` `@checkout` `@order` `@chaos` | **Yes**<br>- Screen: `mobile/src/screens/CheckoutScreen.tsx`<br>- Tests: `mobile/src/__tests__/Checkout.test.tsx` |

### **Suite: Mobile Profile & Native Multipart Avatar Upload**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **MOB_PROF_01** | Profile Details Rendering & Security Metadata | Verify that `ProfileScreen` renders user metadata (Full Name, Username), account badges, and SecureStore status. Assert that tapping "Sign Out" triggers a confirmation dialog that purges session tokens and returns to login. | High | Profile UI & Session Governance | `@mobile` `@profile` `@logout` | **Yes**<br>- Screen: `mobile/src/screens/ProfileScreen.tsx`<br>- Tests: `mobile/src/__tests__/Profile.test.tsx` |
| **MOB_PROF_02** | Native Avatar Upload via Camera & Gallery with 2MB Audit | Verify that tapping the avatar circle displays an ActionSheet/modal offering "Take Photo" and "Choose from Gallery". Assert that selecting an image via `expo-image-picker` constructs multipart `FormData` without explicit `Content-Type` header, dispatches `POST /api/profile/upload` with Bearer token, and immediately refreshes the profile avatar. Assert that permission denials present a graceful guidance alert. | Critical | Native Image Picker & Multipart Upload | `@mobile` `@avatar` `@camera` `@gallery` | **Yes**<br>- Screen: `mobile/src/screens/ProfileScreen.tsx`<br>- Setup: `mobile/jest.setup.js`<br>- Tests: `mobile/src/__tests__/Profile.test.tsx` |

### **Suite: Mobile Chaos Control Center**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **MOB_CHAOS_01** | Dynamic Chaos Configuration & Database Reset | Verify that `ChaosScreen` fetches active chaos settings from `GET /api/test/config`. Assert that adjusting `checkoutFailureRate` (0-100%) or `inventoryDelayMs` (0-5000ms) and saving posts to `POST /api/test/config`, dynamically modifying backend behavior. Assert that tapping "Reset Database & Chaos" posts to `POST /api/test/reset` and restores default test states with live banner confirmation. | High | In-App Chaos Controls & DB Reset | `@mobile` `@chaos` `@test-api` | **Yes**<br>- Screen: `mobile/src/screens/ChaosScreen.tsx`<br>- Tests: `mobile/src/__tests__/Chaos.test.tsx` |

---
## 22. Mobile Intentional Anti-Patterns & Chaos Injection (MOB-B1 to MOB-B6)

*Sprint Source: [Sprint 12.1: Intentional Mobile Anti-Patterns & Chaos Injection](file:///c:/BuggyBooks/buggy-books/planning/Sprints/sprint_12_1_intentional_mobile_anti_patterns_and_chaos_injection.md)*

These test cases validate deliberate mobile anti-patterns and testing obstacles implemented to serve as realistic automation targets for Appium and Maestro test suites, including obfuscated locators, soft keyboard occlusion, dynamic add-to-cart latency, stochastic checkout recovery, simulated offline network interruptions, and landscape orientation layout shifts.

### **Suite: Mobile Anti-Patterns & Automation Challenges**
| ID | Title | Description | Priority | Target Coverage | Tags | Covered |
|:---|:---|:---|:---|:---|:---|:---|
| **MOB_E2E_01** | Obfuscated Locators (Challenging Test Locators) | Verify that `LoginScreen`, `RegisterScreen`, and `CheckoutScreen` use obfuscated testIDs (`txt_usr_77`, `txt_pwd_99`, `txt_fn_55`, `txt_f1`, `txt_l1`, `txt_addr_88`, `txt_c99`) and catalog items use computed testIDs (`btn_item_${id}_add`). Assert that test scripts successfully locate elements via accessibility labels and chained selectors. | High | Obfuscated Native Selectors (MOB-B1) | `@mobile` `@anti-pattern` `@locators` | **Yes**<br>- Screens: `LoginScreen.tsx`, `RegisterScreen.tsx`, `CatalogScreen.tsx`, `CheckoutScreen.tsx`<br>- Tests: `mobile/src/__tests__/AntiPatterns.test.tsx` |
| **MOB_E2E_02** | Soft Keyboard Occlusion on Checkout | Verify that `CheckoutScreen` omits `KeyboardAvoidingView` so focusing credit card inputs on portrait devices occludes the "Place Order" CTA button. Assert that automation scripts must dismiss the keyboard (`driver.hideKeyboard()`) or perform upward drag gestures to reveal the CTA. | High | Keyboard Occlusion Handling (MOB-B2) | `@mobile` `@anti-pattern` `@keyboard` | **Yes**<br>- Screen: `CheckoutScreen.tsx`<br>- Tests: `mobile/src/__tests__/AntiPatterns.test.tsx` |
| **MOB_E2E_03** | Dynamic Asynchronous Add-to-Cart Delays | Verify that tapping "Add to Cart" simulates a randomized 500ms–3500ms client latency during which the button is disabled with an activity indicator. Assert that test automation must explicitly wait for the bottom tab badge count or confirmation banner rather than static sleep. | High | Dynamic Asynchronous Wait (MOB-B3) | `@mobile` `@anti-pattern` `@delay` | **Yes**<br>- Screens: `BookDetailScreen.tsx`, `CatalogScreen.tsx`<br>- Tests: `mobile/src/__tests__/AntiPatterns.test.tsx` |
| **MOB_E2E_04** | Stochastic Gateway Timeout & In-Screen Retry | Verify that stochastic payment gateway timeouts (HTTP 500) render an in-screen error banner (`banner_checkout_error`) with a "Retry Payment" CTA button (`btn_retry_payment`) while preserving cart items. Assert that tapping retry initiates payment resubmission leading to order confirmation without rebuilding the cart. | Critical | Stochastic Chaos Recovery (MOB-B4) | `@mobile` `@chaos` `@checkout-retry` | **Yes**<br>- Screen: `CheckoutScreen.tsx`<br>- Tests: `mobile/src/__tests__/Checkout.test.tsx`, `mobile/src/__tests__/AntiPatterns.test.tsx` |
| **MOB_E2E_05** | Simulated Network Interruption & Offline Banner | Verify that toggling simulated offline mode in `ChaosScreen` causes `apiClient` requests to immediately reject with `ECONNABORTED` and renders a floating top `OfflineBanner` (`offline_banner`). Assert that turning offline mode off restores normal HTTP connectivity. | Critical | Offline Simulation & Recovery (MOB-B5) | `@mobile` `@chaos` `@offline-mode` | **Yes**<br>- Api: `client.ts`<br>- Components: `OfflineBanner.tsx`<br>- Screens: `ChaosScreen.tsx`<br>- Tests: `mobile/src/__tests__/AntiPatterns.test.tsx`, `mobile/src/__tests__/Chaos.test.tsx` |
| **MOB_E2E_06** | Landscape Orientation Layout Shifts | Verify that `app.json` has `"orientation": "default"`. When rotating device into landscape mode (`width > height`), assert that the layout shift styling applies, challenging automation to handle viewport re-orientation and scroll-into-view interactions. | Medium | Multi-Orientation Responsiveness (MOB-B6) | `@mobile` `@orientation` `@landscape` | **Yes**<br>- Config: `mobile/app.json`<br>- Screens: `CheckoutScreen.tsx`<br>- Tests: `mobile/src/__tests__/AntiPatterns.test.tsx` |







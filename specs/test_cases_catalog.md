# 📋 BuggyBooks Test Case Catalog

This document provides a unified master catalog of all test cases for the BuggyBooks application. Test cases are categorized by their function, target execution tier, and implementation status.

---

## 1. UI Test Cases (Web Automation)
These test cases verify user-facing interfaces and behaviors inside a real browser environment. The primary tool for automating these is **Playwright UI**.

### **Suite: Authentication & User Management**
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **UI_AUTH_01** | Successful Registration | Navigate to `/register`, fill all fields with valid data, and submit. Verify redirect to Home and presence of username in navbar. | Smoke | Playwright UI | **Yes**<br>- File: `UserManagement/Test_001_RegisterUser.spec.ts`<br>- Test: `Testcase 1: Register New User` |
| **UI_AUTH_02** | Login with Valid Credentials | Navigate to `/login`, enter credentials from `USER_NAME` / `PASSWORD` environment variables. Verify successful login and cookie persistence. | Smoke | Playwright UI | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts` (`Testcase 1` & `Testcase 2`) |
| **UI_AUTH_03** | Login Validation Errors | Attempt login with wrong password. Verify error message "Unauthorized: Invalid credentials" appears. | Regression | Playwright UI | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts` (`Testcase 3: Login Validation Errors`) |
| **UI_AUTH_04** | Password Strength Indicator | On Register page, type a simple password ("123") and verify label is "weak". Type a complex one and verify label is "strong". | Regression | Playwright UI | **Yes**<br>- File: `UserManagement/Test_001_RegisterUser.spec.ts` (`Testcase 3: Password Strength Indicator`) |
| **UI_AUTH_05** | Logout Functionality | Click "Logout" in the navbar. Verify user is redirected to Login and cannot access the `/cart` page directly. | Smoke | Playwright UI | **Yes**<br>- File: `UserManagement/Test_002_LoginWithExistingUser.spec.ts` (`Testcase 1` & `Testcase 2` logout steps) |

### **Suite: Catalog & Book Discovery**
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **UI_CAT_01** | Initial Catalog Load | Verify that exactly 8 books are displayed on the first page of the catalog. | Smoke | Playwright UI | **Yes**<br>- File: `BookCatalog/Test_001_InitialCatalog.spec.ts`<br>- Test: `Verify Books Count in pagination` |
| **UI_CAT_02** | Pagination Navigation | Click the "2" or "Next" button in the pagination bar. Verify that new books are loaded and URL contains `page=2`. | Regression | Playwright UI | **Yes**<br>- File: `BookCatalog/Test_001_InitialCatalog.spec.ts`<br>- Test: `Verify Next Page Navigation` |
| **UI_CAT_03** | Search Filtering | Type "Mockingbird" in the search bar and submit. Verify that the list updates to show the matching book. | Regression | Playwright UI | **No** |
| **UI_CAT_04** | Search - No Results | Search for a gibberish string and submit. Verify a "No books found" message is displayed. | Regression | Playwright UI | **No** |
| **UI_CAT_05** | Book Detail View | Click on the book cover or title. Verify the description, author, and price match the catalog data. | Smoke | Playwright UI | **No** |

### **Suite: Cart & Checkout**
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **UI_CART_01** | Add to Cart from Catalog | Click "Add to Cart" on a book. Verify that the item is successfully added to the cart (toast/badge updates). | Smoke | Playwright UI | **Yes**<br>- File: `Checkout/Test_001_CompleteBookPurchase.spec.ts` (`Testcase 1`) & `Checkout/Test_002_CartPersistenceCheckout.spec.ts` (`Testcase 1`) |
| **UI_CART_02** | Remove Item from Cart | Navigate to `/cart`. Click "Remove" on an item. Verify the item disappears and the total price updates. | Regression | Playwright UI | **No** *(Note: Existing tests only clear cart in bulk via "Clear All")* |
| **UI_CART_03** | User Cart Isolation | **(Critical)** Login as User A, add items. Logout. Login as User B. Verify User B's cart is empty. | Regression | Playwright UI | **No** |
| **UI_CHECK_01** | Checkout Form Validation | Attempt to submit the checkout form with empty fields. Verify inline validation error tags appear. | Regression | Playwright UI | **No** |
| **UI_CHECK_02** | Successful Order Placement | Complete the checkout form and submit. Verify that the payment successful message appears and the cart is cleared. | Smoke | Playwright UI | **Yes**<br>- File: `Checkout/Test_001_CompleteBookPurchase.spec.ts` (`Testcase 1`) & `Checkout/Test_002_CartPersistenceCheckout.spec.ts` (`Testcase 1`) |

### **Suite: Multi-Step Checkout Wizard**
*Spec Source: [checkout_wizard_and_validation_tests.md](file:///c:/BuggyBooks/buggy-books/specs/checkout_wizard_and_validation_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **UI_WIZ_01** | Stepper Transition Validation | Complete Step 1 shipping, click Next. Verify `step-indicator-2` is active, shipping inputs are hidden, and payment inputs appear. | Smoke | Playwright UI | **No** |
| **UI_WIZ_02** | Validation Messaging Validation | Submit blank fields on Step 1, and invalid inputs on Step 2. Verify all inline error message nodes become visible with exact error texts. | Regression | Playwright UI | **No** |
| **UI_WIZ_03** | Wizard Back Step History preservation | Go to Step 2, type in card inputs, click Back. Click Next. Assert card inputs are preserved and error banners are cleared. | Regression | Playwright UI | **No** |
| **UI_WIZ_04** | Dirty Navigation Alert Dialog | Fill First Name input. Click "Catalog" link in the navbar. Assert that a native browser `confirm` dialog is triggered, and navigation is blocked unless accepted. | Critical | Playwright UI | **No** |

### **Suite: Profile Picture Upload**
*Spec Source: [file_upload_and_validation_tests.md](file:///c:/BuggyBooks/buggy-books/specs/file_upload_and_validation_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **UI_UPL_01** | Valid Profile Picture Upload | Choose a valid PNG/JPEG image under 2MB. Click Upload. Assert that the preview image source points to the new path, and a success message renders. | Smoke | Playwright UI | **No** |
| **UI_UPL_02** | File Extension Filter Validation | Choose an invalid file format (e.g. `document.txt`). Assert that the upload fails with `400` and displays warning element. | Smoke | Playwright UI | **No** |
| **UI_UPL_03** | File Size Limit Validation | Choose an image file larger than 2MB. Assert that the upload fails with `400` and displays a file size limit warning. | Smoke | Playwright UI | **No** |
| **UI_UPL_04** | Upload Chaos Failure Recovery | Configure `uploadFailureRate: 1.0` via chaos config. Submit a valid file. Assert that status code `500` is returned, and an error banner displays. | Regression | Playwright UI | **No** |

### **Suite: JWT Expiration & Silent Refresh UI**
*Spec Source: [jwt_expiration_and_refresh_tests.md](file:///c:/BuggyBooks/buggy-books/specs/jwt_expiration_and_refresh_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **UI_REF_01** | Transparent Client Request Retry | Set access token to expire in 2 seconds. Trigger an action in the UI (e.g. Add to Cart) after 3 seconds. Verify the action completes successfully (API client silently refreshed the token and retried). | Regression | Playwright UI | **No** |
| **UI_REF_02** | Session Expiry Redirection | Set access and refresh tokens to be invalid/expired. Trigger any UI action. Verify that the user is logged out and redirected to `/login`. | Smoke | Playwright UI | **No** |

### **Suite: Accessibility (a11y) Scans**
*Spec Source: [a11y_violation_injector_tests.md](file:///c:/BuggyBooks/buggy-books/specs/a11y_violation_injector_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **A11Y_01** | Standard Accessibility Compliance | Verify that when `injectA11yViolations` is `false`, the book catalog, login screen, and checkout step forms pass Axe scans with zero violations. | Smoke | Playwright UI | **No** |
| **A11Y_02** | Image Alternative Text Scan Failure | Enable `injectA11yViolations: true`. Scan the Book Catalog. Assert that Axe detects `image-alt` failures on catalog images. | Regression | Playwright UI | **No** |
| **A11Y_03** | Orphaned Form Label Scan Failure | Enable `injectA11yViolations: true`. Scan the Login page. Assert that Axe detects `label` (orphaned labels without htmlFor-id link) violations. | Regression | Playwright UI | **No** |
| **A11Y_04** | Text Color Contrast Scan Failure | Enable `injectA11yViolations: true`. Scan the Catalog summary text. Assert that Axe flags a color contrast ratio regression on the books count tag. | Regression | Playwright UI | **No** |

### **Suite: Modern UI Styling & Layout**
*Spec Source: [ui_styling_and_transition_tests.md](file:///c:/BuggyBooks/buggy-books/specs/ui_styling_and_transition_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **UI_STYLE_01** | Retained Automation Selectors | Search and list books. Assert that all legacy automation classnames and element IDs exist on the new semantic `div` nodes. | Smoke | Playwright UI | **No** |
| **UI_STYLE_02** | Catalog Grid Layout Responsiveness | Emulate desktop, tablet, and mobile viewports. Verify that cards align to their correct grid patterns (`repeat(auto-fill, minmax(280px, 1fr))`). | Regression | Playwright UI | **No** |
| **UI_STYLE_03** | Hover Animation CSS Verification | Trigger a hover state on a book card. Assert that the scale and transform styles are applied to the cover image. | Regression | Playwright UI | **No** |
| **UI_STYLE_04** | HSL CSS Variable Theme Verification | Emulate light and dark mode preferences. Assert that root variables (like `--bg` and `--card-bg`) resolve to their correct HSL values. | Regression | Playwright UI | **No** |

### **Suite: Visual Regression & Layout Chaos**
*Spec Source: [visual_regression_chaos_tests.md](file:///c:/BuggyBooks/buggy-books/specs/visual_regression_chaos_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **VIS_REG_01** | Baseline Catalog Screenshot | Navigate to `/`. Capture a screenshot when `visualChaos` is `false`. Assert screenshot matches the approved baseline file. | Smoke | Playwright UI | **No** |
| **VIS_REG_02** | Chaos-Enabled Catalog Pixel Diff | Enable `visualChaos` via API. Navigate to `/`. Capture screenshot and compare with baseline — assert significant pixel difference exists (diff > 0). | Regression | Playwright UI | **No** |
| **VIS_REG_03** | Book Card Border Color Assertion | Enable chaos. Query `.complex-item-box-alpha` and assert `border-color` computed style equals `rgb(242, 36, 36)`. | Regression | Playwright UI | **No** |
| **VIS_REG_04** | Book Cover Blur Filter Assertion | Enable chaos. Query `.catalog-book-cover` and assert `filter` computed style includes `blur(1.5px)`. | Regression | Playwright UI | **No** |
| **VIS_REG_05** | Search Bar Displacement Assertion | Enable chaos. Query `.catalog-search-form` and assert `transform` includes `translateX(-18px)`. | Regression | Playwright UI | **No** |
| **VIS_REG_06** | Price Tag Rotation Assertion | Enable chaos. Query `.price-tag-value` and assert `transform` includes `rotate(-3deg)`. | Regression | Playwright UI | **No** |
| **VIS_REG_07** | Checkout Button Margin Shift | Navigate to `/checkout`, enable chaos. Query `.submit-action-btn.primary-x2` and assert `marginLeft` computed value is `15px`. | Regression | Playwright UI | **No** |
| **VIS_REG_08** | Book Card Text Line Height Chaos | Enable chaos. Query `.info-cell-beta h3` and assert `lineHeight` computed value reflects `3.2` multiplier. | Regression | Playwright UI | **No** |
| **VIS_REG_09** | Reset Restores Visual Baseline | After enabling chaos and capturing diff screenshot, call `POST /api/test/reset`. Re-capture screenshot. Assert it matches original baseline. | E2E | Playwright UI | **No** |

### **Suite: WebSockets Event & Resilience**
*Spec Source: [websocket_event_and_resilience_tests.md](file:///c:/BuggyBooks/buggy-books/specs/websocket_event_and_resilience_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **WS_CONN_01** | WebSocket State Indicator | Open page. Assert that `ws-status-dot` is present and contains the class `status-connected` (indicating successful handshakes). | Smoke | Playwright UI | **No** |
| **WS_EVENT_01** | Broadcasted Event Reception | Click the bell button to open the dropdown. Assert that mock bookstore events (e.g. view, purchase, sale) populate the list inside the dropdown. | Smoke | Playwright UI | **No** |
| **WS_EVENT_02** | Hot-Toast Alert Trigger | Listen for incoming events. Assert that if the event type is `purchase` or `sale`, a toast notification banner is rendered. | Regression | Playwright UI | **No** |
| **WS_RESIL_01** | Automatic Connection Recovery | Configure `websocketDropRate: 1.0` via chaos config. Verify that when disconnected, the client changes state to disconnected and attempts auto-reconnection. | Critical | Playwright UI | **No** |

---

## 2. API Test Cases (Backend Automation)
These test cases verify the logic, security, and integrity of backend endpoints without launching the browser. Automated using **Playwright API** request fixtures.

### **Suite: API Authentication**
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **API_AUTH_01** | `POST /api/login` Success | Send valid credentials. Verify 200 OK and that `Set-Cookie` header contains a valid JWT token. | Smoke | Playwright API | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 7: Positive and Contract` |
| **API_AUTH_02** | `POST /api/register` Conflict | Send a username that already exists. Verify 409 Conflict. | Smoke | Playwright API | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 3: Duplicate usernames` |
| **API_AUTH_03** | Protected Route Access | Attempt `GET /api/cart` without a cookie. Verify 401 Unauthorized. | Smoke | Playwright API | **Yes**<br>- File: `api/UserManagement/Test_001_RegisterAndLoginUser.spec.ts`<br>- Test: `Testcase 13: Security: GET /api/cart without auth cookies should return 401 Unauthorized` |
| **API_REF_01** | Dynamic Access Token Expiry | Inject `jwtExpirySeconds: 2` via chaos configuration. Request a protected route after 3 seconds. Verify `403 Forbidden` response is returned. | Smoke | Playwright API | **No** |
| **API_REF_02** | Refresh Token Issuance | Login. Verify that both access `token` and `refreshToken` cookies are returned with security and `httpOnly` flags set. | Smoke | Playwright API | **No** |
| **API_REF_03** | Silent Token Refresh | Request `/api/auth/refresh` using the `refreshToken` cookie. Verify status is `200` and a new `token` cookie is returned. | Regression | Playwright API | **No** |

### **Suite: Cart & Inventory**
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **API_CART_01** | Persistence after server crash | Add item -> Restart server -> Get Cart. Verify item is still there. | Smoke | Playwright API | **Yes**<br>- File: `api/CartAndInventory/Test_001_CartAndInventoryApi.spec.ts`<br>- Test: `API_CART_01: Cart persistence after server crash` |
| **API_INV_01** | Inventory Report Latency | Trigger the inventory report. Verify it returns a list of all 15 books with stock data. | Smoke | Playwright API | **Yes**<br>- File: `api/CartAndInventory/Test_001_CartAndInventoryApi.spec.ts`<br>- Test: `API_INV_01: Trigger inventory report` |

### **Suite: File Upload API**
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **API_UPL_01** | Unauthorized Session Check | Attempt upload without cookie tokens. Assert that status code `401` is returned. | Regression | Playwright API | **No** |

### **Suite: Chaos & Testing Utilities**
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **API_TEST_01** | Global Reset | Call `POST /api/test/reset`. Verify all users (except defaults) and all carts are cleared. | Smoke | Playwright API | **Yes**<br>- File: `api/ChaosAndTesting/Test_001_ChaosAndTestingApi.spec.ts`<br>- Test: `API_TEST_01: Global reset clears all non-default users and carts` |
| **API_CHAOS_01** | Inject Checkout Failures | Set `checkoutFailureRate` to 1.0 via `/api/test/config`. Verify all checkout attempts return 500. | Smoke | Playwright API | **Yes**<br>- File: `api/ChaosAndTesting/Test_001_ChaosAndTestingApi.spec.ts`<br>- Test: `API_CHAOS_01: Inject checkout failures` |
| **API_CHAOS_02** | Inject API Latency | Set `inventoryDelayMs` to 3000. Verify `/api/inventory/report` takes at least 3 seconds to respond. | Smoke | Playwright API | **Yes**<br>- File: `api/ChaosAndTesting/Test_001_ChaosAndTestingApi.spec.ts`<br>- Test: `API_CHAOS_02: Inject API latency` |
| **API_VIS_01** | Toggle visualChaos Config via API | `POST /api/test/config` with `{ "visualChaos": true }`. Assert 200 and `config.visualChaos === true`. | Smoke | Playwright API | **No** |
| **API_VIS_02** | Default visualChaos is False | `GET /api/test/config` after reset. Assert `visualChaos === false`. | Smoke | Playwright API | **No** |
| **API_VIS_03** | Invalid Type Rejected | `POST /api/test/config` with `{ "visualChaos": "yes" }`. Assert 400 and validation error in body. | Regression | Playwright API | **No** |
| **API_VIS_04** | Combine with Other Chaos Params | Set `{ "visualChaos": true, "checkoutFailureRate": 0.5 }` in one request. Assert both fields are saved correctly. | Regression | Playwright API | **No** |

### **Suite: Structured JSON Logging & Correlation**
*Spec Source: [logging_and_correlation_tests.md](file:///c:/BuggyBooks/buggy-books/specs/logging_and_correlation_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **API_LOG_01** | Correlation ID Header Generation | Send any HTTP request. Verify `x-correlation-id` is returned in response headers and is a valid UUIDv4. | Smoke | Playwright API | **No** |
| **API_LOG_02** | Correlation ID Header Preservation | Send a request with a custom `x-correlation-id` header. Verify the API preserves it and returns the exact same ID. | Regression | Playwright API | **No** |
| **API_LOG_03** | Error Body Correlation ID Mapping | Trigger a server-side error. Verify that the JSON response body contains the exact same `correlationId`. | Regression | Playwright API | **No** |
| **API_LOG_04** | User Context Log Association | Login, add an item to the cart, and checkout. Inspect the server logs for that correlation ID and verify that the logs contain the correct `username` field. | E2E | Playwright API / Log Analysis | **No** |

---

## 3. Frontend Component Mocking Test Cases (Vitest)
These test cases isolate frontend logic and UI pages by mocking backend API responses. Written inside the frontend directory using **Vitest** + **React Testing Library** + **Mock Service Worker (MSW)**.

### **Suite: API Mocking via MSW**
*Spec Source: [dockerization_and_ci_tests.md](file:///c:/BuggyBooks/buggy-books/specs/dockerization_and_ci_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **MSW_01** | Mock Books Endpoint | In a Vitest component test, import `server` from `src/mocks/server.ts`. Assert `GET /api/books` returns the 3 mock books without a real backend. | Smoke | Frontend Component (Vitest) | **No** |
| **MSW_02** | Mock Login Success | POST to `/api/login` with `testuser/password123`. Assert mock returns `200` with username. | Smoke | Frontend Component (Vitest) | **No** |
| **MSW_03** | Override Handler Per Test | Override `GET /api/books` to return an empty array in a specific test. Assert the Catalog renders the "No books found" empty state. | Regression | Frontend Component (Vitest) | **No** |
| **MSW_04** | Override Checkout to Always Fail | Override `POST /api/checkout/process` to return 500. Assert the Checkout component shows the error banner. | Regression | Frontend Component (Vitest) | **No** |

---

## 4. DevOps & CI/CD Verification (Infrastructure Automation)
These test cases are run at deployment/CI run-time to verify environmental integrity. They are checked via GitHub Actions and Docker scripts.

### **Suite: Dockerization & Environment**
*Spec Source: [dockerization_and_ci_tests.md](file:///c:/BuggyBooks/buggy-books/specs/dockerization_and_ci_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **DOCKER_01** | Full Stack Boot | Run `docker-compose up --build`. Assert both `buggy-books-backend` and `buggy-books-frontend` containers are running and healthy. | Smoke | DevOps Infrastructure | **No** |
| **DOCKER_02** | Backend Health Check | With containers running, `GET http://localhost:4000/api/books`. Assert `200 OK` and JSON array in body. | Smoke | DevOps Infrastructure | **No** |
| **DOCKER_03** | Frontend Reachable | `GET http://localhost:5173`. Assert `200 OK` and HTML response contains `BuggyBooks`. | Smoke | DevOps Infrastructure | **No** |
| **DOCKER_04** | JWT_SECRET Required | Start backend container without `JWT_SECRET` env var. Assert container exits with a fatal error log. | Regression | DevOps Infrastructure | **No** |
| **DOCKER_05** | Graceful Restart | Run `docker-compose restart backend`. Assert backend recovers and responds to health checks within 15 seconds. | Regression | DevOps Infrastructure | **No** |

### **Suite: CI/CD Pipeline Checks**
*Spec Source: [dockerization_and_ci_tests.md](file:///c:/BuggyBooks/buggy-books/specs/dockerization_and_ci_tests.md)*
| ID | Title | Description | Priority | Target Coverage | Covered |
|:---|:---|:---|:---|:---|:---|
| **CI_01** | CI Pipeline Triggers on Push | Push a commit to `feature/**`. Assert GitHub Actions workflow `CI` runs automatically. | Smoke | CI/CD Pipeline | **No** |
| **CI_02** | Backend Tests Pass in CI | Assert `Backend Tests (Jest)` job completes with ✅ and all tests pass. | Smoke | CI/CD Pipeline | **No** |
| **CI_03** | Frontend Tests Pass in CI | Assert `Frontend Tests (Vitest)` job completes with ✅ and all tests pass. | Smoke | CI/CD Pipeline | **No** |
| **CI_04** | CI Fails on Broken Test | Intentionally break a test. Push to branch. Assert the CI workflow fails and marks the PR as blocked. | Regression | CI/CD Pipeline | **No** |
| **CI_05** | TypeScript Build Verified in CI | Assert `Backend TypeScript Build` job produces no compilation errors. | Regression | CI/CD Pipeline | **No** |

---

## 5. End-to-End (E2E) Journey

### **Scenario: The New Customer Journey**
1. **Register**: Create a new account.
2. **Search**: Search for "Harry Potter".
3. **Inspect**: Click to see details.
4. **Add**: Add the book to the cart.
5. **Review**: Go to the cart and verify the title and price.
6. **Checkout**: Complete the checkout process.
7. **Verify**: Verify the order appears in the order history (if implemented) or that a Success ID or message is provided.

*Note: This specific end-to-end user scenario is **not fully automated as a single script** in the existing Playwright E2E folder, but parts of it (registration, adding to cart, checkout details) are tested across different spec files.*

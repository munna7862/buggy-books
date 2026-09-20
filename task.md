# Sprint 11.3: Cart, Checkout, Profile & Chaos Control Center

**Sprint Identifier**: `SPRINT-11.3-CART-CHECKOUT-PROFILE-AND-CHAOS-CONTROL-CENTER`  
**Phase Mapping**: [Phase 11: Cross-Platform Mobile App Foundations (Android & iOS) & Dual-Auth](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_11_mobile_foundations_and_full_stack_core.md)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Implement CartContext and CartScreen, multi-step CheckoutScreen with order placement, ProfileScreen with native Camera/Gallery avatar upload via `expo-image-picker`, and the in-app Chaos Control Center screen.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint burndown tracking, live backlog management in `task.md`, cross-persona coordination, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Author Section 21 in `specs/test_cases_catalog.md` (`MOB_CART_01`–`MOB_CHAOS_01`), design test cases and edge cases. |
| **Mobile Developer** | AI Agent / Mobile | Implement `CartContext`, `CartScreen`, `CheckoutScreen`, `ProfileScreen`, `ChaosScreen`, and `CartNavigator`. |
| **Hardware / Native Specialist** | AI Agent / Native | Implement camera/gallery permission lifecycles, image cropping, and multipart uploads via `expo-image-picker`. |
| **Chaos Specialist** | AI Agent / Chaos | Ensure Chaos Control Center maps to `GET /api/test/config`, `POST /api/test/config`, and `POST /api/test/reset`. |
| **Security Champion** | AI Agent / SEC | Audit multipart avatar upload stream, 2MB size limit, MIME type whitelist, and token handling. |
| **QA Specialist** | AI Agent / QA | Author unit tests in `mobile/src/__tests__/`, verify end-to-end purchasing flows and regression suites. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-MOB-1131: Shopping Cart Management & Live Sync
*As a Mobile Shopper, I want to view items in my cart, adjust quantities, and remove unwanted books, so that I can manage my purchase before checking out.*
- [x] **US-MOB-1131.1** (`Mobile Developer`): Implement `mobile/src/context/CartContext.tsx` with `cart`, `loading`, `cartCount`, `total`, `addToCart(bookId)`, `removeFromCart(bookId)`, `clearCart()`, and `refreshCart()`.
- [x] **US-MOB-1131.2** (`Mobile Developer`): Update `mobile/App.tsx` and `mobile/src/navigation/AppTabNavigator.tsx` to wrap with `CartProvider` and display dynamic `tabBarBadge` on the Cart tab icon.
- [x] **US-MOB-1131.3** (`Mobile Developer`): Update `mobile/src/screens/BookDetailScreen.tsx` to integrate with `useCart()` for live badge updates and error handling.
- [x] **US-MOB-1131.4** (`Mobile Developer`): Implement `mobile/src/screens/CartScreen.tsx` with item list, grouped quantities, price subtotal, tax calculation, total, item deletion, clear cart, and "Proceed to Checkout" CTA.
- [x] **US-MOB-1131.5** (`SDET Architect` & `QA Specialist`): Author unit tests in `mobile/src/__tests__/CartContext.test.tsx` verifying cart addition, badge count calculation, item removal, and clearing.

### User Story US-MOB-1132: Checkout Screen & Order Submission
*As a Mobile Shopper, I want to enter my shipping and payment details and submit my order, so that I can complete my book purchase.*
- [x] **US-MOB-1132.1** (`Mobile Developer`): Configure `CartNavigator` or `CartStackParamList` with `Cart` and `Checkout` screens in `mobile/src/navigation/CartNavigator.tsx`.
- [x] **US-MOB-1132.2** (`Mobile Developer`): Implement `mobile/src/screens/CheckoutScreen.tsx` with First Name, Last Name, Shipping Address, Credit Card (16 digits), validation, Order Summary preview, and "Place Order" button.
- [x] **US-MOB-1132.3** (`Mobile Developer`): Connect `CheckoutScreen` to `POST /api/checkout/process`, handle chaos errors gracefully, clear cart on success, and show Order Confirmation modal/card with `orderId`.
- [x] **US-MOB-1132.4** (`QA Specialist`): Author unit tests in `mobile/src/__tests__/Checkout.test.tsx` verifying form validation, API submission, and order confirmation.

### User Story US-MOB-1133: Profile Screen & Native Avatar Multipart Upload
*As an Authenticated User, I want to view my account profile and upload a custom avatar from my camera or photo library, so that I can personalize my bookstore profile.*
- [x] **US-MOB-1133.1** (`Hardware / Native Specialist` & `Mobile Dev`): Update `mobile/jest.setup.js` with `expo-image-picker` mocks.
- [x] **US-MOB-1133.2** (`Mobile Developer` & `Hardware Specialist`): Implement `mobile/src/screens/ProfileScreen.tsx` with user details, avatar preview, "Take Photo", "Choose from Gallery", permission checks, and `POST /api/profile/upload`.
- [x] **US-MOB-1133.3** (`Security Champion`): Audit multipart upload (omitted explicit Content-Type for boundary generation, 2MB size limit, JPEG/PNG MIME verification).
- [x] **US-MOB-1133.4** (`QA Specialist`): Author unit tests in `mobile/src/__tests__/Profile.test.tsx` verifying profile details rendering, image picker launch, and avatar upload handling.

### User Story US-MOB-1134: Mobile Chaos Control Center & Test Catalog
*As an SDET / QA Engineer testing the mobile app, I want a dedicated Chaos Settings tab and test case traceability in test_cases_catalog.md, so that I can perform chaos experiments and guarantee full test coverage governance.*
- [x] **US-MOB-1134.1** (`Chaos Specialist` & `Mobile Dev`): Implement `mobile/src/screens/ChaosScreen.tsx` with `GET /api/test/config`, sliders/steppers for `checkoutFailureRate`, `inventoryDelayMs`, `inventoryLockingRate`, `uploadFailureRate`, "Save Configuration", and "Reset Database & Chaos" (`POST /api/test/reset`).
- [x] **US-MOB-1134.2** (`SDET Architect`): Author Section 21 in `specs/test_cases_catalog.md` documenting `MOB_CART_01`–`MOB_CART_03`, `MOB_CHECK_01`–`MOB_CHECK_02`, `MOB_PROF_01`–`MOB_PROF_02`, and `MOB_CHAOS_01`.
- [x] **US-MOB-1134.3** (`QA Specialist`): Author unit tests in `mobile/src/__tests__/Chaos.test.tsx` verifying config retrieval, updating, and reset triggers.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Section 21 authored in `specs/test_cases_catalog.md`. API contracts and test coverage mapped. | `[APPROVED]` |
| **Cart & Checkout Gate** | Mobile Dev & QA Specialist | CartContext state sync, tab badge counter, and Checkout order placement validated. | `[APPROVED]` |
| **Native Hardware & Security Gate** | Native Specialist & Security Champion | Camera/gallery image picker, multipart upload stream, and 2MB limit verified. | `[APPROVED]` |
| **Full Regression QA Gate** | QA Specialist | Mobile (41/41), Backend (97/97), Frontend (80/80), and Playwright API (55/55) tests all 100% green. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All 4 user stories accepted. Definition of Done complete. Ready for merge. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] All 4 user stories implemented with strict TypeScript typing (0 `any`).
- [x] `CartContext` synchronizes cart with `GET /api/cart`, updates badge count, and supports add/remove/clear.
- [x] `CheckoutScreen` provides validation, order summary, and order placement via `POST /api/checkout/process`.
- [x] `ProfileScreen` supports camera/gallery avatar upload via `expo-image-picker` to `POST /api/profile/upload`.
- [x] `ChaosScreen` connects to `GET /api/test/config`, `POST /api/test/config`, and `POST /api/test/reset`.
- [x] Section 21 authored in `specs/test_cases_catalog.md`.
- [x] Mobile unit tests pass with 100% success (`npm test --workspace=mobile` - 41/41 tests).
- [x] Full monorepo typecheck and lint pass cleanly (`npm run typecheck`, `npm run lint`).
- [x] Backend and frontend test suites pass cleanly without regressions.
- [x] Feature branch committed with conventional commits, pushed to remote, Pull Request raised, and all CI checks passed.


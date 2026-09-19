# Sprint 11.3: Cart, Checkout, Profile & Chaos Control Center

**Sprint Identifier**: `SPRINT-11.3-CART-CHECKOUT-PROFILE-AND-CHAOS-CONTROL-CENTER`  
**Phase Mapping**: [Phase 11: Cross-Platform Mobile App Foundations (Android & iOS) & Dual-Auth](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_11_mobile_foundations_and_full_stack_core.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement CartContext and CartScreen, multi-step CheckoutScreen with order placement, ProfileScreen with native Camera/Gallery avatar upload via `expo-image-picker`, and the in-app Chaos Control Center screen.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint burndown tracking, story refinement, and acceptance audits. |
| **Mobile Developer** | AI Agent / Mobile | Build `CartContext`, `CartScreen`, `CheckoutScreen`, `ProfileScreen`, and `ChaosScreen`. |
| **Hardware / Native Specialist** | AI Agent / Native | Handle camera/gallery permission lifecycles, image cropping, and multipart uploads. |
| **Chaos Specialist** | AI Agent / Chaos | Ensure the Chaos Control Center correctly maps to `GET /api/test/config` and `POST /api/test/config`. |
| **Security Champion** | AI Agent / SEC | Audit multipart avatar upload stream, 2MB size limit, MIME type whitelist, and Multer disk storage security. |
| **QA Specialist** | AI Agent / QA | Test end-to-end purchasing flows, avatar upload resilience, and chaos toggle updates. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-MOB-1131: Shopping Cart Management & Live Sync
- **Story Statement**:  
  *As a* Mobile Shopper,  
  *I want* to view items in my cart, adjust quantities, and remove unwanted books,  
  *So that* I can manage my purchase before checking out.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Implement `mobile/src/context/CartContext.tsx`:
    - Synchronizes items with `GET /api/cart`.
    - Methods: `addToCart(bookId)`, `removeFromCart(bookId)`, `clearCart()`.
    - Badge counter computed property displayed on the bottom Cart tab icon.
  - [ ] Implement `CartScreen`:
    - List of cart items with thumbnail, title, price, quantity controls.
    - Swipe-to-delete gesture or explicit delete button.
    - Subtotal calculation, tax estimation, and total price display.
    - "Proceed to Checkout" CTA button.
  - [ ] Author unit tests in `mobile/src/__tests__/CartContext.test.tsx` verifying cart addition, quantity updates, and cart badge counter updates.
- **Acceptance Criteria**:
  - [ ] Adding an item from `BookDetailScreen` updates the Cart badge count immediately.
  - [ ] Removing an item updates the subtotal and fires `DELETE /api/cart/:bookId`.
  - [ ] Cart unit tests pass cleanly via `npm test --workspace=mobile`.

---

### User Story US-MOB-1132: Checkout Screen & Order Submission
- **Story Statement**:  
  *As a* Mobile Shopper,  
  *I want* to enter my shipping and payment details and submit my order,  
  *So that* I can complete my book purchase.
- **Story Points**: 1.5 SP
- **Technical Subtasks**:
  - [ ] Implement `CheckoutScreen`:
    - Input fields: First Name, Last Name, Shipping Address, Credit Card Number (16 digits).
    - Client-side validation using standard format regex.
    - Order summary review section.
    - "Place Order" button calling `POST /api/checkout/process`.
  - [ ] Order confirmation modal / success screen displaying generated `orderId`.
- **Acceptance Criteria**:
  - [ ] Valid order submission clears the cart and displays order confirmation details.
  - [ ] Invalid card or missing required fields display immediate visual validation errors.

---

### User Story US-MOB-1133: Profile Screen & Native Avatar Multipart Upload
- **Story Statement**:  
  *As an* Authenticated User,  
  *I want* to view my account profile and upload a custom avatar from my camera or photo library,  
  *So that* I can personalize my bookstore profile.
- **Story Points**: 1 SP
- **Technical Subtasks**:
  - [ ] Implement `ProfileScreen`:
    - Displays user details: Username, Full Name, joined date.
    - Avatar preview circle with edit badge icon.
    - Modal sheet allowing choice between "Take Photo" and "Choose from Gallery".
  - [ ] Integrate `expo-image-picker`:
    - Handle camera and photo permissions gracefully.
    - Format image payload into React Native `FormData`:
      ```typescript
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.fileName || `avatar_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg'
      } as any);
      ```
    - **Crucial**: Omit explicit `'Content-Type': 'multipart/form-data'` in headers so Axios/fetch lets the native network layer append the boundary parameter automatically.
    - Ensure fallback filename and MIME type match Multer's backend file filter (`/jpeg|jpg|png/`).
    - Dispatch to `POST /api/profile/upload` using `Authorization: Bearer <token>`.
  - [ ] Security Champion (SEC) Audit: Verify 2MB size limit and file type filters prevent arbitrary uploads.
  - [ ] Implement "Sign Out" button with confirmation alert.
- **Acceptance Criteria**:
  - [ ] Uploaded avatar is named with the authenticated username on backend disk storage (leveraging Sprint 11.1 Multer update).
  - [ ] Successfully uploading a photo updates the avatar display immediately.
  - [ ] Permission denials display a helpful user alert directing to device settings.

---

### User Story US-MOB-1134: Mobile Chaos Control Center & Test Catalog
- **Story Statement**:  
  *As an* SDET / QA Engineer testing the mobile app,  
  *I want* a dedicated Chaos Settings tab and test case traceability in `test_cases_catalog.md`,  
  *So that* I can perform chaos experiments and guarantee full test coverage governance.
- **Story Points**: 0.5 SP
- **Technical Subtasks**:
  - [ ] Implement `ChaosScreen`:
    - Fetch current chaos settings from `GET /api/test/config`.
    - Sliders and numeric steppers for `checkoutFailureRate` (0% to 100%) and `inventoryDelayMs` (0ms to 5000ms).
    - Save button updating config via `POST /api/test/config`.
    - "Reset Database & Chaos" button executing `POST /api/test/reset`.
  - [ ] SDET Task: Document test cases in `specs/test_cases_catalog.md`:
    - `MOB_CART_01` to `MOB_CART_03`: Cart Addition, Quantity Recalculation, Item Removal.
    - `MOB_CHECK_01` & `MOB_CHECK_02`: Checkout Form Validation & Order Placement.
    - `MOB_PROF_01` & `MOB_PROF_02`: Profile Summary & Avatar Upload.
    - `MOB_CHAOS_01`: Dynamic Chaos Configuration from Mobile UI.
- **Acceptance Criteria**:
  - [ ] Adjusting sliders and tapping Save immediately affects subsequent backend requests.
  - [ ] Tapping Reset restores default failure rates and clears test carts and orders.
  - [ ] `specs/test_cases_catalog.md` updated with complete Phase 11 test specifications.

---

## 3. Definition of Done (DoD)

- [ ] All 4 user stories implemented and integrated into the bottom tab navigator.
- [ ] End-to-end shopping flow (Add to Cart -> Checkout -> Success) passes on both Android and iOS.
- [ ] Avatar upload operates smoothly with both Camera and Photo Library inputs and links to authenticated username.
- [ ] Chaos settings dynamically update backend behavior.
- [ ] TypeScript compilation succeeds with zero errors (`npm run typecheck:mobile`).
- [ ] Mobile unit tests pass cleanly (`npm test --workspace=mobile`).
- [ ] Test cases cataloged in `specs/test_cases_catalog.md`.

---

## 4. Verification Commands

```bash
# Verify unit tests of mobile workspace
npm test --workspace=mobile

# Verify TypeScript build of mobile workspace
npm run typecheck:mobile

# Run full development app
npm run dev:mobile
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Multer DiskStorage Token Blindness** | High | High | Inspect `req.headers.authorization` in Multer storage engine before running `authenticateToken` middleware so file names reflect the authenticated username. |
| **Permission Revocation Crashes** | Medium | Medium | Wrap `ImagePicker.requestCameraPermissionsAsync` and `requestMediaLibraryPermissionsAsync` in try-catch blocks with graceful user dialog fallbacks. |
| **Image Memory Exhaustion on Upload** | Medium | Low | Configure `expo-image-picker` with `quality: 0.7` compression and maximum resolution limits before building multipart form payloads. |


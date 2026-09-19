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
- **Acceptance Criteria**:
  - [ ] Adding an item from `BookDetailScreen` updates the Cart badge count immediately.
  - [ ] Removing an item updates the subtotal and fires `DELETE /api/cart/:bookId`.

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

### User Story US-MOB-1133: Profile Screen & Native Avatar Upload
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
    - Compress and format image payload as multipart/form-data.
    - Dispatch to `POST /api/profile/upload`.
  - [ ] Implement "Sign Out" button with confirmation alert.
- **Acceptance Criteria**:
  - [ ] Successfully uploading a photo updates the avatar display immediately.
  - [ ] Permission denials display a helpful user alert directing to device settings.

---

### User Story US-MOB-1134: Mobile Chaos Control Center
- **Story Statement**:  
  *As an* SDET / QA Engineer testing the mobile app,  
  *I want* a dedicated Chaos Settings tab to view and adjust backend error rates and delay parameters,  
  *So that* I can perform chaos engineering experiments directly from the device.
- **Story Points**: 0.5 SP
- **Technical Subtasks**:
  - [ ] Implement `ChaosScreen`:
    - Fetch current chaos settings from `GET /api/test/config`.
    - Sliders and numeric steppers for `checkoutFailureRate` (0% to 100%) and `inventoryDelayMs` (0ms to 5000ms).
    - Save button updating config via `POST /api/test/config`.
    - "Reset Database & Chaos" button executing `POST /api/test/reset`.
- **Acceptance Criteria**:
  - [ ] Adjusting sliders and tapping Save immediately affects subsequent backend requests.
  - [ ] Tapping Reset restores default failure rates and clears test carts and orders.

---

## 3. Definition of Done (DoD)

- [ ] All 4 user stories implemented and integrated into the bottom tab navigator.
- [ ] End-to-end shopping flow (Add to Cart -> Checkout -> Success) passes on both Android and iOS.
- [ ] Avatar upload operates smoothly with both Camera and Photo Library inputs.
- [ ] Chaos settings dynamically update backend behavior.
- [ ] TypeScript compilation succeeds with zero errors.

---

## 4. Verification Commands

```bash
# Verify TypeScript build of mobile workspace
npm run typecheck

# Run full development app
npm run dev:mobile
```

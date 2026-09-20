# Sprint 12.1: Intentional Mobile Anti-Patterns & Chaos Injection

**Sprint Identifier**: `SPRINT-12.1-INTENTIONAL-MOBILE-ANTI-PATTERNS-AND-CHAOS-INJECTION`  
**Phase Mapping**: [Phase 12: Mobile Chaos Engineering, Appium/Maestro Automation & Mobile CI/CD](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_12_mobile_anti_patterns_automation_and_cicd.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement deliberate mobile anti-patterns (MOB-B1 through MOB-B6) including obfuscated `testID`s, keyboard occlusion, dynamic add-to-cart delays, stochastic checkout recovery, offline network dropouts, and orientation layout glitches, and catalog them in `intentional_bugs.md`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog coordination, bug catalog verification, and DoD audit. |
| **Mobile Developer** | AI Agent / Mobile | Implement deliberate anti-patterns across mobile screens and components. |
| **Chaos Specialist** | AI Agent / Chaos | Ensure error injection and latencies conform strictly to chaos configurations. |
| **Security Champion** | AI Agent / SEC | Audit client-side error states, verify offline mode doesn't store plain tokens, and approve intentional bug specs. |
| **Principal SDET** | AI Agent / SDET | Verify that all anti-patterns provide genuine automation challenges for Appium and Maestro. |
| **Product Owner** | Human PO / AI PO | Review intentional bugs catalog and validate that functional UX remains operable despite obstacles. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-MOB-1211: Obfuscated Native Locators & Keyboard Occlusion
- **Story Statement**:  
  *As an* SDET writing mobile automation scripts,  
  *I want* mobile screens to present non-trivial locators and keyboard occlusion hurdles,  
  *So that* my automated test scripts must utilize advanced locator chaining, scrolling, and keyboard management rather than trivial IDs.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [x] **MOB-B1: Obfuscated Locators**:
    - Refactor Login/Register inputs to use dynamic or obfuscated testIDs: `testID="txt_usr_77"`, `testID="txt_pwd_99"`.
    - Catalog book card buttons use computed testIDs (e.g. `testID={`btn_item_${book.id}_add`}`).
    - Checkout form inputs use non-semantic labels: `testID="txt_f1"`, `testID="txt_l1"`, `testID="txt_c99"`.
  - [x] **MOB-B2: Keyboard Occlusion on Checkout**:
    - Omit `KeyboardAvoidingView` on `CheckoutScreen`.
    - When user focuses credit card input on standard portrait phones, soft keyboard covers the "Place Order" CTA button.
    - Automation must execute `driver.hideKeyboard()` (Android), tap outside the form (iOS), or perform upward drag gestures to reveal the CTA button.
- **Acceptance Criteria**:
  - [x] Standard element queries without proper scrolling fail when the keyboard is open.
  - [x] Explicit keyboard dismissal or upward scroll reveals the CTA button.

---

### User Story US-MOB-1212: Dynamic Delays & Stochastic Checkout Gateway Timeout
- **Story Statement**:  
  *As an* SDET testing asynchronous stability,  
  *I want* client-side dynamic delays and stochastic 500 errors on mobile checkout,  
  *So that* automation scripts must implement dynamic waiting and retry/backoff strategies.
- **Story Points**: 1.5 SP
- **Technical Subtasks**:
  - [x] **MOB-B3: Dynamic Add-to-Cart Delay**:
    - In `BookDetailScreen` and `CatalogScreen`, clicking "Add to Cart" simulates processing latency by imposing a randomized `setTimeout` between 500ms and 3500ms before dispatching the API request and animating the cart badge.
    - Disable button and display subtle loading state during timeout to prevent unintended double-submits while challenging explicit assertion waits.
  - [x] **MOB-B4: Stochastic Gateway Timeout Handling**:
    - `POST /api/checkout/process` returns HTTP 500 when `checkoutFailureRate` is set (e.g. 15% via `POST /api/test/config { "checkoutFailureRate": 0.15 }`; defaults to 0.0 on backend restart).
    - Note that `checkoutService.ts` throws before `dataStore.clearCart()`, preserving cart contents upon error.
    - On mobile, display a distinct in-screen error banner (`testID="banner_checkout_error"`) with a "Retry Payment" CTA button (`testID="btn_retry_payment"`).
    - Automation must detect the error banner and tap "Retry Payment" up to 3 times to achieve success without re-adding items.
- **Acceptance Criteria**:
  - [x] Add-to-cart requires explicit wait for badge update rather than static sleep.
  - [x] Checkout failure displays clear in-screen retry banner allowing recovery without modal locking.

---

### User Story US-MOB-1213: Simulated Network Interruption & Orientation Glitches
- **Story Statement**:  
  *As an* SDET testing resilience and visual regression,  
  *I want* simulated network dropout modes and orientation layout shifts,  
  *So that* my automation suites can test offline recovery and multi-orientation snapshots.
- **Story Points**: 1.5 SP
- **Technical Subtasks**:
  - [x] **MOB-B5: Simulated Network Interruption**:
    - Add a toggle in `ChaosScreen` to simulate offline mode.
    - When active, API client simulates network timeout (`ECONNABORTED`), rendering a top floating `OfflineBanner`.
  - [x] **MOB-B6: Orientation Layout Shift**:
    - Ensure `app.json` has `"orientation": "default"` enabled to allow landscape rotation.
    - When rotating device to landscape on `CheckoutScreen`, the bottom navigation bar overlaps the submit section unless layout responds to orientation changes.
    - For Android emulators in CI, configure `adb shell settings put system accelerometer_rotation 1` so system auto-rotation allows landscape orientation.
  - [x] Document all mobile anti-patterns (MOB-B1 to MOB-B6) in `intentional_bugs.md` with SEC and PO review, aligned with automated test scenarios `MOB_E2E_01` to `MOB_E2E_06`.
- **Acceptance Criteria**:
  - [x] Toggling simulated offline mode displays the offline banner and catches requests gracefully.
  - [x] Landscape rotation skews layout and triggers MOB-B6 as intended.
  - [x] `intentional_bugs.md` contains complete catalog of mobile bugs with detection instructions.

---

## 3. Definition of Done (DoD)

- [x] Anti-patterns MOB-B1 through MOB-B6 implemented cleanly in the mobile codebase.
- [x] [intentional_bugs.md](file:///c:/BuggyBooks/buggy-books/intentional_bugs.md) updated with a dedicated "Mobile Testing Challenges" section.
- [x] Mobile app functions normally for human testers while providing challenging automation targets.
- [x] Security Champion (SEC) signs off on anti-pattern implementations.
- [x] TypeScript compilation passes with zero errors (`npm run typecheck:mobile`).

---

## 4. Verification Commands

```bash
# Verify TypeScript build
npm run typecheck:mobile

# Launch app to verify anti-patterns
npm run dev:mobile
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Orientation Locked by OS / Expo Defaults** | High | High | Explicitly configure `"orientation": "default"` in `mobile/app.json`, enable emulator accelerometer via `adb shell settings put system accelerometer_rotation 1`, and install `expo-screen-orientation` if programmatic rotation locking is required. |
| **Dynamic Delay Flakiness in Fast Smoke Tests** | Medium | Medium | Provide a chaos toggle or query parameter to clamp `inventoryDelayMs` and client-side add-to-cart delays during deterministic smoke test runs. |
| **Platform-Specific Keyboard Inconsistencies** | Medium | Low | Verify keyboard dismissal behaviors across both Android (`driver.hideKeyboard()`) and iOS (tapping keyboard toolbar 'Done' button `$('~Done').click()` or tapping outside) in test design. |


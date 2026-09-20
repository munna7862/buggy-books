# Task Backlog: BuggyBooks Phase 12

## Current Focus: Sprint 12.1 - Intentional Mobile Anti-Patterns & Chaos Injection

**Sprint Identifier**: `SPRINT-12.1-INTENTIONAL-MOBILE-ANTI-PATTERNS-AND-CHAOS-INJECTION`  
**Goal**: Implement deliberate mobile anti-patterns (MOB-B1 through MOB-B6) including obfuscated `testID`s, keyboard occlusion, dynamic add-to-cart delays, stochastic checkout recovery, offline network dropouts, and orientation layout glitches, and catalog them in `intentional_bugs.md` and `specs/test_cases_catalog.md`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Member | Responsibilities | Status |
| :--- | :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog coordination, bug catalog verification, and DoD audit. | `ACTIVE` |
| **Mobile Developer** | AI Agent / Mobile | Implement deliberate anti-patterns across mobile screens and components. | `ACTIVE` |
| **Chaos Specialist** | AI Agent / Chaos | Ensure error injection and latencies conform strictly to chaos configurations. | `ACTIVE` |
| **Security Champion** | AI Agent / SEC | Audit client-side error states, verify offline mode doesn't store plain tokens, and approve intentional bug specs. | `ACTIVE` |
| **Principal SDET** | AI Agent / SDET | Verify that all anti-patterns provide genuine automation challenges for Appium and Maestro. | `ACTIVE` |
| **Product Owner** | Human PO / AI PO | Review intentional bugs catalog and validate that functional UX remains operable despite obstacles. | `ACTIVE` |

---

## 2. Granular Task Breakdown

### US-MOB-1211: Obfuscated Native Locators & Keyboard Occlusion
- [x] **US-MOB-1211.1** (`Mobile Dev`): Update `LoginScreen.tsx` and `RegisterScreen.tsx` to use obfuscated `testID="txt_usr_77"`, `testID="txt_pwd_99"`, and `testID="txt_fn_55"` (MOB-B1).
- [x] **US-MOB-1211.2** (`Mobile Dev`): Add quick Add-to-Cart button with computed `testID={`btn_item_${item.id}_add`}` on `CatalogScreen.tsx` book cards (MOB-B1).
- [x] **US-MOB-1211.3** (`Mobile Dev`): Refactor `CheckoutScreen.tsx` inputs to non-semantic `testID="txt_f1"`, `testID="txt_l1"`, `testID="txt_addr_88"`, and `testID="txt_c99"` (MOB-B1).
- [x] **US-MOB-1211.4** (`Mobile Dev`): Omit `KeyboardAvoidingView` on `CheckoutScreen.tsx` to induce keyboard occlusion over the Place Order CTA button (MOB-B2).

### US-MOB-1212: Dynamic Delays & Stochastic Checkout Gateway Timeout
- [x] **US-MOB-1212.1** (`Mobile Dev`): Add randomized dynamic delay (500ms–3500ms) on Add to Cart in `BookDetailScreen.tsx` and `CatalogScreen.tsx`, disabling the button with loading spinner during latency (MOB-B3).
- [x] **US-MOB-1212.2** (`Mobile Dev` & `Chaos Specialist`): Implement in-screen retry banner `testID="banner_checkout_error"` with "Retry Payment" CTA `testID="btn_retry_payment"` on `CheckoutScreen.tsx` when gateway returns 500 (MOB-B4).

### US-MOB-1213: Simulated Network Interruption & Orientation Glitches
- [x] **US-MOB-1213.1** (`Mobile Dev`): Implement simulated offline network mode in `mobile/src/api/client.ts` rejecting with `ECONNABORTED`, create `OfflineBanner.tsx`, and mount in `App.tsx` (MOB-B5).
- [x] **US-MOB-1213.2** (`Chaos Specialist`): Add simulated offline toggle switch `testID="toggle_simulated_offline"` and status badge in `ChaosScreen.tsx` (MOB-B5).
- [x] **US-MOB-1213.3** (`Mobile Dev`): Implement landscape orientation layout shift on `CheckoutScreen.tsx` overlapping the submit CTA (MOB-B6).
- [x] **US-MOB-1213.4** (`Security Champion` & `SDET Architect`): Document MOB-B1 to MOB-B6 in `intentional_bugs.md` and Section 22 in `specs/test_cases_catalog.md` (`MOB_E2E_01` to `MOB_E2E_06`).
- [x] **US-MOB-1213.5** (`Principal SDET` & `QA Specialist`): Author and update comprehensive unit tests in `mobile/src/__tests__/`.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | MOB-B1 to MOB-B6 requirements and automation challenges validated. | `[APPROVED]` |
| **Anti-Patterns & Locators Gate** | Mobile Dev & SDET | Obfuscated locators, keyboard occlusion, and dynamic delays verified. | `[APPROVED]` |
| **Resilience & Security Gate** | Security Champion & Chaos Specialist | Offline mode interceptor security and chaos error banners verified. | `[APPROVED]` |
| **Full Regression QA Gate** | QA Specialist | All mobile, backend, frontend, and API tests passing 100% green. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All 3 user stories accepted. Definition of Done complete. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Anti-patterns MOB-B1 through MOB-B6 implemented cleanly in the mobile codebase.
- [x] `intentional_bugs.md` updated with Section 5 "Mobile Testing Challenges".
- [x] Section 22 authored in `specs/test_cases_catalog.md` (`MOB_E2E_01` to `MOB_E2E_06`).
- [x] Mobile app functions normally for human testers while providing challenging automation targets.
- [x] TypeScript compilation passes with zero errors (`npm run typecheck`).
- [x] Monorepo lint passes cleanly (`npm run lint`).
- [x] All test suites pass (Mobile, Backend, Frontend, API).
- [x] Pull Request opened, all CI checks green, squash merged to `main`.

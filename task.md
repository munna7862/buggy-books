# Task Backlog: BuggyBooks Phase 12

## Current Focus: Sprint 12.2 - Maestro & Appium Mobile Test Automation Suites

**Sprint Identifier**: `SPRINT-12.2-MAESTRO-AND-APPIUM-MOBILE-TEST-AUTOMATION-SUITES`  
**Goal**: Author end-to-end mobile test automation suites using both Maestro (declarative YAML flows) and Appium (WebdriverIO + TypeScript Page Object Model), covering authentication, catalog search, asynchronous cart delays, keyboard management, and stochastic checkout retry loops.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Member | Responsibilities | Status |
| :--- | :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Story sizing, sprint tracking, and milestone DoD verification. | `ACTIVE` |
| **Principal SDET** | AI Agent / SDET | Architect the Appium WebdriverIO POM framework and Maestro declarative flow structure. | `ACTIVE` |
| **Mobile Automation Engineer** | AI Agent / QA | Author YAML flows for Maestro and TypeScript spec files for Appium. | `ACTIVE` |
| **Security Champion** | AI Agent / SEC | Audit test credentials in test fixtures and ensure zero token leaks in Allure and Winston logs. | `ACTIVE` |
| **Observability Specialist** | AI Agent / DevOps | Implement Winston structured step logging and Allure reporting for Appium runs. | `ACTIVE` |
| **Product Owner** | Human PO / AI PO | Review test execution reports and validate full user journey test coverage. | `ACTIVE` |

---

## 2. Granular Task Breakdown

### US-MOB-1221: Maestro Declarative Mobile Flow Automation
- [x] **US-MOB-1221.1** (`Mobile Automation Eng`): Initialize `mobile-automation/.maestro/` directory and configure `.maestro/config.yaml` with `appId: com.buggybooks.app`.
- [x] **US-MOB-1221.2** (`Mobile Automation Eng`): Author `auth/01_login_success.yaml` (obfuscated inputs `txt_usr_77`, `txt_pwd_99`) and `auth/02_login_invalid_creds.yaml` (401 error message).
- [x] **US-MOB-1221.3** (`Mobile Automation Eng`): Author `catalog/03_search_and_filter.yaml` (search input, count assertion) and `catalog/04_add_to_cart_delay.yaml` (`extendedWaitUntil` for dynamic delay).
- [x] **US-MOB-1221.4** (`Mobile Automation Eng`): Author `checkout/05_checkout_retry_loop.yaml` (occluded keyboard dismissal, 500 retry handling) and `checkout/06_orientation_layout_glitch.yaml` (device rotation & layout shift).

### US-MOB-1222: Appium WebdriverIO Page Object Model Architecture & Monorepo Registration
- [x] **US-MOB-1222.1** (`Principal SDET`): Register `"mobile-automation"` in root `package.json` workspaces array.
- [x] **US-MOB-1222.2** (`Principal SDET`): Scaffold `mobile-automation/package.json`, `tsconfig.json`, and `eslint.config.mjs` with WebdriverIO, Appium, Winston, and Allure.
- [x] **US-MOB-1222.3** (`DevOps` & `Principal SDET`): Implement `wdio.shared.conf.ts`, `wdio.android.conf.ts`, and `wdio.ios.conf.ts`.
- [x] **US-MOB-1222.4** (`Security Champion` & `Observability`): Implement `Logger.ts` with credential/token masking to ensure zero secret leakage.
- [x] **US-MOB-1222.5** (`Principal SDET`): Implement `BaseMobileScreen.ts` with cross-platform locator abstraction, gestures, and Allure step recording.
- [x] **US-MOB-1222.6** (`Mobile Automation Eng`): Implement Page Object Models: `LoginScreen.ts`, `CatalogScreen.ts`, `CartScreen.ts`, `CheckoutScreen.ts`, `ChaosScreen.ts`, `NavigationTab.ts`.

### US-MOB-1223: Appium Cross-Platform E2E Test Scenarios & Test Catalog Traceability
- [x] **US-MOB-1223.1** (`Mobile Automation Eng`): Author `auth.e2e.spec.ts` (sign in, profile inspection, logout).
- [x] **US-MOB-1223.2** (`Mobile Automation Eng`): Author `catalog.e2e.spec.ts` (search, filtering, quick add dynamic latency).
- [x] **US-MOB-1223.3** (`Mobile Automation Eng`): Author `checkout_chaos.e2e.spec.ts` (cart management, keyboard dismissal under occlusion, payment retry loop).
- [x] **US-MOB-1223.4** (`Mobile Automation Eng`): Author `orientation_chaos.e2e.spec.ts` (landscape orientation shift on checkout).
- [x] **US-MOB-1223.5** (`Principal SDET`): Document automation coverage mapping in `specs/test_cases_catalog.md` (`MOB_E2E_01` to `MOB_E2E_06`).
- [x] **US-MOB-1223.6** (`DevOps`): Configure root npm test, typecheck, and lint scripts for `mobile-automation`.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Maestro flows and Appium POM architecture validated. | `[APPROVED]` |
| **Maestro Flows Gate** | Mobile Automation Eng | All 6 declarative YAML flows verified covering auth, search, delay, checkout retry, orientation. | `[APPROVED]` |
| **Appium POM & Security Gate** | Security Champion & SDET | Credential masking in Winston/Allure logs and Page Object encapsulation verified. | `[APPROVED]` |
| **Monorepo Quality Gate** | DevOps & SDET | Monorepo build, typecheck, lint, and unit test verification. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All user stories accepted, DoD complete. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Maestro YAML flows authored across all critical paths (auth, search, dynamic delay, checkout retry, orientation).
- [x] Appium WebdriverIO framework registered in monorepo with strict TypeScript compilation.
- [x] Both Android UIAutomator2 and iOS XCUITest driver config profiles established.
- [x] Allure reports and Winston log outputs verified with zero token/credential leaks.
- [x] Mobile automation workspace cataloged in `specs/test_cases_catalog.md` (`MOB_E2E_01` to `MOB_E2E_06`).
- [ ] Pull Request opened, all CI checks green, squash merged to `main`.

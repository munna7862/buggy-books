# Sprint 12.2: Maestro & Appium Mobile Test Automation Suites

**Sprint Identifier**: `SPRINT-12.2-MAESTRO-AND-APPIUM-MOBILE-TEST-AUTOMATION-SUITES`  
**Phase Mapping**: [Phase 12: Mobile Chaos Engineering, Appium/Maestro Automation & Mobile CI/CD](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_12_mobile_anti_patterns_automation_and_cicd.md)  
**Estimated Velocity**: 8 Story Points  
**Sprint Goal**: Author end-to-end mobile test automation suites using both Maestro (declarative YAML flows) and Appium (WebdriverIO + TypeScript Page Object Model), covering authentication, catalog search, asynchronous cart delays, keyboard management, and stochastic checkout retry loops.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Story sizing, sprint tracking, and milestone DoD verification. |
| **Principal SDET** | AI Agent / SDET | Architect the Appium WebdriverIO POM framework and Maestro declarative flow structure. |
| **Mobile Automation Engineer** | AI Agent / QA | Author YAML flows for Maestro and TypeScript spec files for Appium. |
| **Observability Specialist** | AI Agent / DevOps | Implement Winston structured step logging and Allure reporting for Appium runs. |
| **Product Owner** | Human PO / AI PO | Review test execution reports and validate full user journey test coverage. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-MOB-1221: Maestro Declarative Mobile Flow Automation
- **Story Statement**:  
  *As an* SDET running fast mobile smoke tests,  
  *I want* declarative Maestro YAML test flows covering critical user journeys,  
  *So that* I can run lightning-fast tests on physical devices and emulators with zero driver boilerplate.
- **Story Points**: 3 SP
- **Technical Subtasks**:
  - [ ] Initialize `mobile-automation/.maestro/` directory.
  - [ ] Configure `.maestro/config.yaml` with `appId: com.buggybooks.app`.
  - [ ] Author test flows:
    - `auth/01_login_success.yaml`: Valid login with `txt_usr_77` and `txt_pwd_99`.
    - `auth/02_login_invalid_creds.yaml`: Verify 401 error message display.
    - `catalog/03_search_and_filter.yaml`: Search books and assert item count.
    - `catalog/04_add_to_cart_delay.yaml`: Add item, handle dynamic delay, assert badge increment.
    - `checkout/05_checkout_retry_loop.yaml`: Fill checkout form, dismiss keyboard, handle 500 retry loop.
- **Acceptance Criteria**:
  - [ ] `maestro test mobile-automation/.maestro/` executes all flows with 100% pass rate.
  - [ ] Tests successfully dismiss the soft keyboard and handle the stochastic checkout retry.

---

### User Story US-MOB-1222: Appium WebdriverIO Page Object Model Architecture
- **Story Statement**:  
  *As an* Enterprise Automation Engineer,  
  *I want* an Appium + WebdriverIO + TypeScript Page Object Model test suite,  
  *So that* I can write modular, maintainable, and type-safe cross-platform mobile tests.
- **Story Points**: 3 SP
- **Technical Subtasks**:
  - [ ] Initialize `mobile-automation/` workspace in monorepo with `@wdio/cli`, `@wdio/appium-service`, `appium`.
  - [ ] Create `mobile-automation/src/config/`:
    - `wdio.android.conf.ts`: UIAutomator2 capability profile.
    - `wdio.ios.conf.ts`: XCUITest capability profile.
  - [ ] Implement `mobile-automation/src/core/BaseMobileScreen.ts`:
    - Action methods: `clickElement`, `typeText`, `waitForElement`, `swipeUp`, `hideKeyboard`.
    - Integrated Winston structured logging and Allure step recording.
  - [ ] Implement Page Object Models:
    - `LoginScreen.ts`, `CatalogScreen.ts`, `CartScreen.ts`, `CheckoutScreen.ts`, `ChaosScreen.ts`.
- **Acceptance Criteria**:
  - [ ] Page objects encapsulate locators via private getters.
  - [ ] Core actions log structured events to Winston and Allure.

---

### User Story US-MOB-1223: Appium Cross-Platform E2E Test Scenarios
- **Story Statement**:  
  *As a* QA Lead,  
  *I want* comprehensive end-to-end regression specs written in Appium,  
  *So that* regression tests run automatically against Android and iOS platforms.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Author specs in `mobile-automation/src/specs/`:
    - `auth.e2e.spec.ts`: Sign in, profile inspection, logout.
    - `catalog.e2e.spec.ts`: Search, paging, book details navigation.
    - `checkout_chaos.e2e.spec.ts`: Cart management, keyboard dismissal, payment retry loop.
  - [ ] Add root npm scripts:
    - `"test:mobile:appium:android": "npm run test:android --workspace=mobile-automation"`
    - `"test:mobile:appium:ios": "npm run test:ios --workspace=mobile-automation"`
- **Acceptance Criteria**:
  - [ ] All test specs execute cleanly against Android Emulator and iOS Simulator.
  - [ ] Execution produces structured logs and Allure report artifacts.

---

## 3. Definition of Done (DoD)

- [ ] Maestro YAML flows execute with zero failures across all critical paths.
- [ ] Appium WebdriverIO framework passes linting and strict TypeScript compilation.
- [ ] Both Android UIAutomator2 and iOS XCUITest configurations execute cleanly.
- [ ] Allure reports and Winston log outputs verified.

---

## 4. Verification Commands

```bash
# Run Maestro declarative flows
maestro test mobile-automation/.maestro/

# Run Appium Android E2E suite
npm run test:mobile:appium:android
```

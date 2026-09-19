# Sprint 12.2: Maestro & Appium Mobile Test Automation Suites

**Sprint Identifier**: `SPRINT-12.2-MAESTRO-AND-APPIUM-MOBILE-TEST-AUTOMATION-SUITES`  
**Phase Mapping**: [Phase 12: Mobile Chaos Engineering, Appium/Maestro Automation & Mobile CI/CD](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_12_mobile_anti_patterns_automation_and_cicd.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Author end-to-end mobile test automation suites using both Maestro (declarative YAML flows) and Appium (WebdriverIO + TypeScript Page Object Model), covering authentication, catalog search, asynchronous cart delays, keyboard management, and stochastic checkout retry loops.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Story sizing, sprint tracking, and milestone DoD verification. |
| **Principal SDET** | AI Agent / SDET | Architect the Appium WebdriverIO POM framework and Maestro declarative flow structure. |
| **Mobile Automation Engineer** | AI Agent / QA | Author YAML flows for Maestro and TypeScript spec files for Appium. |
| **Security Champion** | AI Agent / SEC | Audit test credentials in test fixtures and ensure zero token leaks in Allure and Winston logs. |
| **Observability Specialist** | AI Agent / DevOps | Implement Winston structured step logging and Allure reporting for Appium runs. |
| **Product Owner** | Human PO / AI PO | Review test execution reports and validate full user journey test coverage. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-MOB-1221: Maestro Declarative Mobile Flow Automation
- **Story Statement**:  
  *As an* SDET running fast mobile smoke tests,  
  *I want* declarative Maestro YAML test flows covering critical user journeys,  
  *So that* I can run lightning-fast tests on physical devices and emulators with zero driver boilerplate.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Initialize `mobile-automation/.maestro/` directory.
  - [ ] Configure `.maestro/config.yaml` with `appId: com.buggybooks.app`.
  - [ ] Author test flows:
    - `auth/01_login_success.yaml`: Valid login with `txt_usr_77` and `txt_pwd_99`.
    - `auth/02_login_invalid_creds.yaml`: Verify 401 error message display.
    - `catalog/03_search_and_filter.yaml`: Search books and assert item count.
    - `catalog/04_add_to_cart_delay.yaml`: Add item, handle dynamic delay via `extendedWaitUntil` condition, assert badge increment.
    - `checkout/05_checkout_retry_loop.yaml`: Fill checkout form, dismiss keyboard, handle 500 retry loop.
    - `checkout/06_orientation_layout_glitch.yaml`: Rotate device to landscape and assert layout shift handling.
- **Acceptance Criteria**:
  - [ ] `maestro test mobile-automation/.maestro/` executes all flows with 100% pass rate.
  - [ ] Tests successfully dismiss the soft keyboard and handle the stochastic checkout retry.

---

### User Story US-MOB-1222: Appium WebdriverIO Page Object Model Architecture & Monorepo Registration
- **Story Statement**:  
  *As an* Enterprise Automation Engineer,  
  *I want* an Appium + WebdriverIO + TypeScript Page Object Model workspace integrated into the monorepo,  
  *So that* I can write modular, maintainable, and type-safe cross-platform mobile tests.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Add `"mobile-automation"` to root `package.json` `workspaces` array.
  - [ ] Initialize `mobile-automation/` workspace with `@wdio/cli`, `@wdio/appium-service`, `appium`, and `@buggybooks/types`.
  - [ ] Add platform-scoped driver provisioning scripts in `mobile-automation/package.json`:
    - `"driver:android": "appium driver install uiautomator2"` (cross-platform for Windows, Linux, macOS).
    - `"driver:ios": "appium driver install xcuitest"` (restricted to macOS/Xcode environments).
  - [ ] Create `mobile-automation/src/config/`:
    - `wdio.android.conf.ts`: UIAutomator2 capability profile.
    - `wdio.ios.conf.ts`: XCUITest capability profile.
  - [ ] Implement `mobile-automation/src/core/BaseMobileScreen.ts`:
    - Action methods: `clickElement`, `typeText`, `waitForElement`, `swipeUp`, `hideKeyboard`, `setOrientation`.
    - Integrated Winston structured logging and Allure step recording.
  - [ ] Implement Page Object Models:
    - `LoginScreen.ts`, `CatalogScreen.ts`, `CartScreen.ts`, `CheckoutScreen.ts`, `ChaosScreen.ts`.
- **Acceptance Criteria**:
  - [ ] `mobile-automation/` installs cleanly via root `npm install`.
  - [ ] Page objects encapsulate locators via private getters.
  - [ ] Core actions log structured events to Winston and Allure.

---

### User Story US-MOB-1223: Appium Cross-Platform E2E Test Scenarios & Test Catalog Traceability
- **Story Statement**:  
  *As a* QA Lead & SDET,  
  *I want* comprehensive end-to-end regression specs in Appium tracked in `test_cases_catalog.md`,  
  *So that* regression tests run automatically against Android and iOS with complete coverage governance.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] Author specs in `mobile-automation/src/specs/`:
    - `auth.e2e.spec.ts`: Sign in, profile inspection, logout.
    - `catalog.e2e.spec.ts`: Search, paging, book details navigation.
    - `checkout_chaos.e2e.spec.ts`: Cart management, keyboard dismissal, payment retry loop.
    - `orientation_chaos.e2e.spec.ts`: Landscape orientation shift validation on checkout.
  - [ ] SDET Task: Document automation coverage mapping in `specs/test_cases_catalog.md`:
    - `MOB_E2E_01`: Mobile Auth Flow (Maestro & Appium).
    - `MOB_E2E_02`: Catalog Search & Dynamic Delay (Maestro & Appium).
    - `MOB_E2E_03`: Cart & Stochastic Checkout Retry Loop (Maestro & Appium).
    - `MOB_E2E_04`: Keyboard Occlusion Dismissal (Maestro & Appium).
    - `MOB_E2E_05`: Simulated Offline Recovery (Maestro & Appium).
    - `MOB_E2E_06`: Landscape Orientation Layout Shift (Maestro & Appium).
  - [ ] Add root npm scripts:
    - `"test:mobile:appium": "npm run test:android --workspace=mobile-automation"`
    - `"test:mobile:appium:android": "npm run test:android --workspace=mobile-automation"`
    - `"test:mobile:appium:ios": "npm run test:ios --workspace=mobile-automation"`
- **Acceptance Criteria**:
  - [ ] All test specs execute cleanly against Android Emulator and iOS Simulator.
  - [ ] Execution produces structured logs and Allure report artifacts.
  - [ ] `specs/test_cases_catalog.md` contains full automated traceability mapping covering `MOB_E2E_01` to `MOB_E2E_06`.

---

## 3. Definition of Done (DoD)

- [ ] Maestro YAML flows execute with zero failures across all critical paths (including orientation).
- [ ] Appium WebdriverIO framework passes linting and strict TypeScript compilation.
- [ ] Both Android UIAutomator2 and iOS XCUITest driver setups execute cleanly.
- [ ] Allure reports and Winston log outputs verified with zero token leaks.
- [ ] Mobile automation workspace registered in monorepo and cataloged in `specs/test_cases_catalog.md` (`MOB_E2E_01` to `MOB_E2E_06`).

---

## 4. Verification Commands

```bash
# Run Maestro declarative flows
maestro test mobile-automation/.maestro/

# Run Appium Android E2E suite
npm run test:mobile:appium:android
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Appium UIAutomator2 Session Cold-Start Timeouts** | High | Medium | Configure `appWaitActivity: "*"` and `uiautomator2ServerLaunchTimeout: 60000` in `wdio.android.conf.ts` to accommodate slow emulator initialization. |
| **Windows Platform Maestro DX** | Medium | Medium | Install Maestro on Windows via PowerShell (`irm https://get.maestro.mobile.dev | iex`) or run via WSL2 connected to the host emulator; use Appium for native Windows Node.js execution. |
| **Deep Component Tree XPath Latency** | Medium | Medium | Prefer accessibility labels (`~locator`) and resource IDs (`id=...`) over deep relative XPaths to maintain sub-second interaction speed. |
| **Test Credential Leakage in Reports** | High | Low | Sanitize all passwords and tokens in `MobileLogger.ts` and Allure step parameters before persisting logs. |


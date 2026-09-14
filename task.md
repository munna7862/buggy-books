# Sprint 10.1: Diagnostic Assertion Architecture, Step-by-Step Logging & Native Actionability

**Sprint Identifier**: `SPRINT-10.1-DIAGNOSTIC-ASSERTION-ARCHITECTURE-AND-STEP-LOGGING`  
**Phase**: [Phase 10: E2E Automation Modernization, Hermetic CI/CD & Test Governance](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_10_e2e_automation_modernization_hermetic_cicd_and_test_governance.md)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Upgrade test assertions across all Playwright specs to eliminate opaque boolean accumulators while preserving and enhancing structured Winston step logging, Allure attachments, and Playwright failure diffs, while modernizing Page Object actionability to leverage native auto-waiting.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **Principal SDET** | AI Agent / SDET | Architecting diagnostic verification engine in `common.util.ts`, modernizing `BasePage` action wrappers with native auto-waiting, and authoring assertion verification tests. |
| **Automation Test Engineer** | AI Agent / QA | Refactoring UI test specs across Checkout, BookCatalog, UserManagement, Profile, Refresh, WebSockets, and Styling suites to eliminate boolean accumulators. |
| **Observability Specialist** | AI Agent / DevOps | Verifying structured Winston logging (`logs/framework.log`, `logs/error.log`) and Allure report timelines retain complete step visibility with timestamps and status badges. |
| **Product Owner** | Human PO / AI PO | Validating that test reports output actionable business step descriptions alongside technical failure diffs, ensuring fast feedback. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-E2E-1011: Diagnostic Assertion Engine with Preserved Step Logging
*As an Automation Engineer reviewing test failures in CI or Allure, I want test validations to log detailed step information to Winston and Allure AND directly assert with Playwright matchers, so that I can clearly see execution history while immediately seeing exact failure diffs without opaque boolean masking.*
- [x] **US-E2E-1011.1** (`Principal SDET`): Implement typed verification helpers (`verifyValue`, `verifyCondition`, `verifyLocatorText`, `verifyItemCount`, `verifyElementVisible`) in `playwright-e2e/src/utils/common.util.ts` with Winston structured logging and Allure step recording.
- [x] **US-E2E-1011.2** (`Principal SDET`): Maintain backward compatibility for `compareTwoValues` with `@deprecated` annotation.
- [x] **US-E2E-1011.3** (`Principal SDET`): Add automated test suite `Test_011_DiagnosticAssertionEngine.spec.ts` verifying assertion helpers, diff output formatting, and soft assertions.

### User Story US-E2E-1012: Spec File Migration away from Boolean Accumulator Pattern
*As an Automation Engineer, I want spec files to use direct verification methods inside `test.step(...)` blocks instead of storing booleans in local variables, so that tests fail immediately at the exact line of code where the error occurred and do not waste time executing subsequent steps after a broken precondition.*
- [x] **US-E2E-1012.1** (`Automation Test Engineer`): Migrate Checkout specs (`Test_001_CompleteBookPurchase.spec.ts`, `Test_002_CartPersistenceCheckout.spec.ts`, `Test_003_CartAndCheckoutValidation.spec.ts`, `Test_004_CheckoutWizardValidation.spec.ts`, `Test_005_EndToEndNewCustomerJourney.spec.ts`, `Test_006_CartQuantityAdjustment.spec.ts`, `Test_007_ConcurrentStockRaceCondition.spec.ts`).
- [x] **US-E2E-1012.2** (`Automation Test Engineer`): Migrate BookCatalog specs (`Test_001_InitialCatalog.spec.ts`, `Test_002_SearchAndDetailCatalog.spec.ts`) and UserManagement specs (`Test_001_RegisterUser.spec.ts`, `Test_002_LoginWithExistingUser.spec.ts`, `Test_003_ProtectedRouteGuard.spec.ts`).
- [x] **US-E2E-1012.3** (`Automation Test Engineer`): Migrate Profile specs (`Test_005_ProfilePictureUpload.spec.ts`, `Test_006_ProfileSummaryAndOrderHistory.spec.ts`) and Refresh specs (`Test_006_JwtRefreshValidation.spec.ts`).
- [x] **US-E2E-1012.4** (`Automation Test Engineer`): Migrate WebSockets (`Test_008_WebSocketResilienceValidation.spec.ts`), Styling (`Test_009_UIStyleAndLayoutValidation.spec.ts`), and Visual Regression (`Test_010_VisualRegressionChaos.spec.ts`).

### User Story US-E2E-1013: Native Playwright Auto-Waiting in BasePage
*As an SDET, I want `BasePage` interaction methods to leverage Playwright's native auto-waiting and actionability engine, so that tests execute faster, handle dynamic delays naturally, and avoid artificial 3-second delay traps.*
- [x] **US-E2E-1013.1** (`Principal SDET`): Modernize `BasePage` interaction methods (`doClick`, `doEnterText`, `doGetText`, `doGetAttribute`, `mouseHover`, `clearAndSetInputValue`, `addTextFieldValue`) in `playwright-e2e/src/core/base/base.page.ts`.
- [x] **US-E2E-1013.2** (`Principal SDET`): Validate that all 8 Page Objects pass `finalize-spec.ts --all-poms` (33/33 checks passed).

### User Story US-E2E-1014: Test Cataloging & Quality Governance
*As a Quality Architect, I want the test cases catalog updated with Phase 10 verification standards and all monorepo checks passing cleanly.*
- [x] **US-E2E-1014.1** (`Principal SDET`): Document Section 16 in `specs/test_cases_catalog.md` (`TC-ASSERT-001`, `TC-AUTO-WAIT-001`, `TC-LOG-001`, `TC-ASSERT-002`).
- [x] **US-E2E-1014.2** (`Observability Specialist`): Validate structured logs in `logs/framework.log` and verify zero unhandled exceptions.
- [x] **US-E2E-1014.3** (`Product Owner`): Verify monorepo typecheck, linting, and test suites pass 100% green.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | Principal SDET | Diagnostic verification helpers and native auto-waiting design verified. All helpers implemented in `common.util.ts`. | `[APPROVED]` |
| **Dev Technical Review** | Automation Engineer | UI spec migration away from boolean accumulators verified across all suites; 0 `.toBeTruthy()` calls remain in UI specs. | `[APPROVED]` |
| **POM Encapsulation Gate** | SDET Architect | All 8 Page Objects pass `finalize-spec.ts` checks without raw Playwright leaks or static waits (33/33 checks passed). | `[APPROVED]` |
| **Observability Gate** | Observability Specialist | Winston structured logging and Allure step timelines verified without data loss. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All acceptance criteria satisfied. Monorepo builds, lints, and tests 100% green. Ready for PR. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `CommonFunctions` provides `verifyValue`, `verifyCondition`, `verifyLocatorText`, `verifyItemCount`, and `verifyElementVisible` with full Winston and Allure logging.
- [x] `compareTwoValues` maintained as backward-compatible wrapper.
- [x] `BasePage` action methods leverage native auto-waiting without redundant fixed 3000ms delay traps.
- [x] All 8 Page Objects pass `finalize-spec.ts --all-poms` (33/33 checks passed).
- [x] Boolean accumulator anti-pattern eliminated across all targeted UI test specs (zero `.toBeTruthy()` calls remain).
- [x] Section 16 documented in `specs/test_cases_catalog.md`.
- [x] New diagnostic assertion test suite passes (10/10 checks in `finalize-spec`).
- [x] `npm run typecheck` passes with 0 errors across all monorepo workspaces.
- [x] `npm run lint` passes with 0 errors and 0 warnings across frontend and backend.
- [x] Pull Request raised and linked: [#93 (Sprint 10.1)](https://github.com/munna7862/buggy-books/pull/93).

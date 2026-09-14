# Sprint 10.1: Diagnostic Assertion Architecture, Step-by-Step Logging & Native Actionability

**Sprint Identifier**: `SPRINT-10.1-DIAGNOSTIC-ASSERTION-ARCHITECTURE-AND-STEP-LOGGING`  
**Phase Mapping**: [Phase 10: E2E Automation Modernization, Hermetic CI/CD & Test Governance](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_10_e2e_automation_modernization_hermetic_cicd_and_test_governance.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Upgrade test assertions across all Playwright specs to eliminate opaque boolean accumulators while preserving and enhancing structured Winston step logging, Allure attachments, and Playwright failure diffs, while modernizing Page Object actionability to leverage native auto-waiting.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Backlog Grooming, Sprint Goal alignment, DoD verification, and velocity burndown tracking. |
| **Principal SDET** | AI Agent / SDET | Architecting the diagnostic verification engine in [common.util.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/utils/common.util.ts) and modernizing [base.page.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/core/base/base.page.ts). |
| **Automation Test Engineer** | AI Agent / QA | Refactoring UI spec files (Checkout, Catalog, UserManagement, Cart) to use the new verification helpers without losing step logs. |
| **Observability Specialist** | AI Agent / DevOps | Verifying that Winston log files (`logs/framework.log`, `logs/error.log`) and Allure report timelines retain complete step visibility. |
| **Product Owner** | Human PO / AI PO | Validating that test reports provide clear business step descriptions alongside technical failure diffs. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-E2E-1011: Diagnostic Assertion Engine with Preserved Step Logging
- **Story Statement**:  
  *As an* Automation Engineer reviewing test failures in CI or Allure,  
  *I want* test validations to log detailed step information to Winston and Allure AND directly assert with Playwright matchers,  
  *So that* I can clearly see the execution history in the logs while immediately seeing the exact failure diff (`Expected: 2, Received: 1`) without opaque `Expected: true, Received: false` masking.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Review current implementation in [common.util.ts lines 7-17](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/utils/common.util.ts#L7-L17):
    ```typescript
    // Current Anti-Pattern: returns boolean, causing tests to do expect(a && b && c).toBeTruthy()
    public async compareTwoValues(sActualValue: any, sExpectedValue: any, sLogMessage: string): Promise<boolean> {
      let bValidation = false;
      if (sActualValue === sExpectedValue) {
        await this.logMessage('PASS', ` ${sLogMessage} Success !! Actual and Expected Values are:: ${sActualValue}`);
        bValidation = true;
      } else {
        await this.logMessage('FAIL', ` ${sLogMessage} Failed!! Expected Value:: ${sExpectedValue} || Actual Value:: ${sActualValue}`);
      }
      expect.soft(sActualValue, sLogMessage).toBe(sExpectedValue);
      return bValidation;
    }
    ```
  - [ ] Implement upgraded, type-safe verification helpers in `CommonFunctions` / `BasePage`:
    ```typescript
    /**
     * Verifies scalar values with full Winston logging, Allure step tracking,
     * and immediate, descriptive Playwright assertion diffs.
     */
    public async verifyValue<T>(actual: T, expected: T, description: string, soft: boolean = false): Promise<void> {
      const isMatch = actual === expected;
      if (isMatch) {
        await this.logMessage('PASS', `${description} - Matched: [${actual}]`);
      } else {
        await this.logMessage('FAIL', `${description} - Expected: [${expected}] but Received: [${actual}]`);
      }
      if (soft) {
        expect.soft(actual, description).toBe(expected);
      } else {
        expect(actual, description).toBe(expected);
      }
    }

    /**
     * Verifies locator text with automatic Playwright polling, Winston logging,
     * and Allure attachment on failure.
     */
    public async verifyLocatorText(locator: Locator, expectedText: string | RegExp, description: string): Promise<void> {
      await this.logMessage('INFO', `Checking text: ${description}`);
      try {
        await expect(locator, description).toHaveText(expectedText);
        await this.logMessage('PASS', `Verified text for: ${description}`);
      } catch (error) {
        await this.logMessage('FAIL', `Text verification failed for: ${description} - ${error}`);
        throw error;
      }
    }

    /**
     * Verifies locator item count with polling and structured logging.
     */
    public async verifyItemCount(locator: Locator, expectedCount: number, description: string): Promise<void> {
      await this.logMessage('INFO', `Checking item count: ${description}`);
      try {
        await expect(locator, description).toHaveCount(expectedCount);
        await this.logMessage('PASS', `Verified count [${expectedCount}] for: ${description}`);
      } catch (error) {
        await this.logMessage('FAIL', `Count verification failed for: ${description} - ${error}`);
        throw error;
      }
    }
    ```
  - [ ] Ensure backward compatibility: keep `compareTwoValues` as a deprecated wrapper that logs to Winston and performs an assertion so existing tests run without breaking during the migration.
- **Acceptance Criteria**:
  - [ ] When an assertion fails, the test report outputs the exact diff (e.g., `Expected: 2, Received: 1` with locator description) instead of `Expected: true, Received: false`.
  - [ ] Winston logs (`logs/framework.log`) and Allure reports continue to contain all step logs with timestamps and PASS/FAIL badges.

---

### User Story US-E2E-1012: Spec File Migration away from Boolean Accumulator Pattern
- **Story Statement**:  
  *As an* Automation Engineer,  
  *I want* spec files to use direct verification methods inside `test.step(...)` blocks instead of storing booleans in local variables,  
  *So that* tests fail immediately at the exact line of code where the error occurred and do not waste time executing subsequent steps after a broken precondition.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Refactor [Test_003_CartAndCheckoutValidation.spec.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/tests/ui/Checkout/Test_003_CartAndCheckoutValidation.spec.ts):
    - Remove `let isInitialCountValid = false; let isCountReduced = false; let isTotalUpdated = false;`.
    - Remove the final `expect(isInitialCountValid && isCountReduced && isTotalUpdated).toBeTruthy();`.
    - Use `await commonFunctions.verifyValue(...)` and `await cartPage.verifyCartCount(...)` directly inside each `test.step`.
  - [ ] Migrate [Test_001_CompleteBookPurchase.spec.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/tests/ui/Checkout/Test_001_CompleteBookPurchase.spec.ts) and [Test_002_CartPersistenceCheckout.spec.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/tests/ui/Checkout/Test_002_CartPersistenceCheckout.spec.ts).
  - [ ] Migrate UserManagement, BookCatalog, and Profile test suites.
- **Acceptance Criteria**:
  - [ ] Tests fail immediately at the broken step when an assertion is violated.
  - [ ] Zero instances of `expect(flag1 && flag2 && flag3).toBeTruthy()` remain in migrated test specs.
  - [ ] Step trees in Allure and Monocart reports render with green checkmarks for passed steps and clear red indicators on the failed step.

---

### User Story US-E2E-1013: Native Playwright Auto-Waiting in BasePage
- **Story Statement**:  
  *As an* SDET,  
  *I want* `BasePage` interaction methods to leverage Playwright's native auto-waiting and actionability engine,  
  *So that* tests execute faster, handle dynamic delays naturally, and avoid artificial 3-second delay traps.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] In [base.page.ts lines 29-38](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/core/base/base.page.ts#L29-L38), refactor `doClick`:
    ```typescript
    public async doClick(locator: Locator, sLogMessage: string): Promise<void> {
      await this.logMessage('INFO', sLogMessage);
      await this.ensureNavElementVisible(locator);
      await locator.click({ timeout: BasePage.DEFAULT_TIMEOUT });
    }
    ```
  - [ ] In `doEnterText` and `doGetText`, rely directly on Playwright's built-in actionability waiting with `BasePage.DEFAULT_TIMEOUT`.
  - [ ] Run `npm run finalize-spec -- --all-poms` to ensure all 8 Page Objects continue to pass encapsulation and wrapper checks.
- **Acceptance Criteria**:
  - [ ] `finalize-spec` reports 33/33 checks passed across all 8 Page Objects.
  - [ ] Total execution duration of the UI smoke suite is reduced by at least 20%.

---

## 3. Definition of Done & Quality Gates

- [ ] `CommonFunctions` provides `verifyValue`, `verifyLocatorText`, and `verifyItemCount` helpers with full Winston and Allure logging.
- [ ] No migrated tests end with `expect(a && b && c).toBeTruthy()`.
- [ ] Assertion failures produce complete Playwright diffs with expected and actual values.
- [ ] `BasePage` interaction wrappers leverage native auto-waiting without redundant fixed 3000ms catches.
- [ ] All 8 Page Objects pass `finalize-spec` validation.
- [ ] Both Winston logs and Allure reports reflect full step-by-step visibility.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[PLANNED]`
- **Committed Story Points**: 5 SP
- **Primary Deliverables**:
  1. Diagnostic verification helpers in `common.util.ts`.
  2. Elimination of boolean accumulator anti-pattern across UI test specs.
  3. Streamlined `BasePage` action wrappers with native auto-waiting.
  4. Verified Winston logging and Allure step persistence.

# Sprint 10.2: Playwright Timeout Calibration, API Project Decoupling & Static Quality Linter

**Sprint Identifier**: `SPRINT-10.2-PLAYWRIGHT-TIMEOUT-CALIBRATION-API-DECOUPLING-AND-LINTER`  
**Phase Mapping**: [Phase 10: E2E Automation Modernization, Hermetic CI/CD & Test Governance](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_10_e2e_automation_modernization_hermetic_cicd_and_test_governance.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Calibrate test timeouts from 300s to 30s in `playwright.config.ts`, establish a lightweight headless API test project decoupled from browser UI authentication, configure ESLint for Playwright TypeScript files, and upgrade POM architecture rules in `finalize-spec.ts`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Backlog Grooming, Sprint Goal alignment, DoD verification, and velocity burndown tracking. |
| **Principal SDET** | AI Agent / SDET | Calibrating timeouts in [playwright.config.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/config/playwright.config.ts), configuring the headless `api` project, and writing Playwright ESLint rules. |
| **QA Automation Specialist** | AI Agent / QA | Verifying that all API specs (`src/tests/api/`) run under the decoupled project and execute in under 10 seconds. |
| **DevOps Engineer** | AI Agent / DevOps | Updating [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml) and [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml) to consume the new project configurations. |
| **Product Owner** | Human PO / AI PO | Validating accelerated CI cycle times and deterministic developer feedback. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-E2E-1021: Timeout Calibration & Fail-Fast Protection
- **Story Statement**:  
  *As an* SDET / CI Engineer,  
  *I want* test timeouts calibrated to realistic boundaries (30 seconds default),  
  *So that* failing or hanging tests fail fast rather than stalling CI runners for 5 minutes (300 seconds) per test attempt.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] In [playwright.config.ts line 14](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/config/playwright.config.ts#L14), update `timeout`:
    ```typescript
    timeout: 30 * 1000, // 30 seconds default
    ```
  - [ ] Update `expect.timeout`:
    ```typescript
    expect: {
      timeout: 10 * 1000, // 10 seconds expectation timeout
      toHaveScreenshot: {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      },
    },
    ```
  - [ ] Identify intentionally slow tests (such as [Test_008_WebSocketResilienceValidation.spec.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/tests/ui/WebSockets/Test_008_WebSocketResilienceValidation.spec.ts) or heavy inventory delay tests) and set explicit per-test overrides via `test.setTimeout(60000)`.
- **Acceptance Criteria**:
  - [ ] Broken or missing locators cause tests to fail within 10–30 seconds rather than hanging for 300 seconds.
  - [ ] Valid tests running with dynamic delays pass cleanly within the 30-second window.

---

### User Story US-E2E-1022: Dedicated Headless API Test Project Decoupling
- **Story Statement**:  
  *As an* Automation Engineer running backend API test suites,  
  *I want* API tests in `src/tests/api/` to execute in a headless API project without browser dependencies or UI login setups,  
  *So that* API tests execute instantaneously in a lightweight environment without launching Chromium.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] In [playwright.config.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/config/playwright.config.ts#L98-L125), define a dedicated `api` project:
    ```typescript
    {
      name: 'api',
      testDir: path.resolve(__dirname, '../tests/api'),
      testMatch: /.*\.spec\.ts/,
      use: {
        baseURL: envConfig.apiBaseUrl,
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-bypass-rate-limit': 'true',
        },
      },
    },
    ```
  - [ ] Ensure the `api` project does **not** declare `dependencies: ['setup']`.
  - [ ] Update UI projects (`chromium`, `firefox`, `webkit`) to restrict their `testDir` strictly to `../tests/ui` (or `testMatch: /.*tests\/ui\/.*\.spec\.ts/`).
  - [ ] Update [playwright-ci.yml line 190](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml#L190):
    ```bash
    npx playwright test --config=src/config/playwright.config.ts --project=api --workers=4
    ```
- **Acceptance Criteria**:
  - [ ] Running `npx playwright test --project=api` runs all API specs without launching a browser window or executing `auth.setup.ts`.
  - [ ] Total runtime of all 9 API test suites drops from ~45 seconds to under 10 seconds.

---

### User Story US-E2E-1023: Playwright ESLint Quality Gate & AST Rules
- **Story Statement**:  
  *As a* QA Lead,  
  *I want* ESLint configured in `playwright-e2e` with `eslint-plugin-playwright`,  
  *So that* anti-patterns (unawaited expects, boolean accumulators, unencapsulated locators) are caught at commit time and in CI Stage 1.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Add `eslint`, `typescript-eslint`, and `eslint-plugin-playwright` to `playwright-e2e/package.json`.
  - [ ] Create `playwright-e2e/eslint.config.mjs` configuring recommended Playwright rules:
    - `'playwright/missing-playwright-await': 'error'`
    - `'playwright/no-wait-for-timeout': 'error'`
    - `'playwright/no-element-handle': 'error'`
    - `'playwright/no-eval': 'error'`
    - `'playwright/prefer-web-first-assertions': 'error'`
  - [ ] Add `"lint"` script to `playwright-e2e/package.json` (`eslint src/`) and integrate into root `npm run lint`.
  - [ ] Update [finalize-spec.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/scripts/finalize-spec.ts) to flag any occurrences of `expect(.*&&.*).toBeTruthy()`.
- **Acceptance Criteria**:
  - [ ] Running `npm run lint` includes `playwright-e2e` and validates all test files.
  - [ ] `finalize-spec.ts` passes 100% of checks across all Page Objects and test specs.

---

## 3. Definition of Done & Quality Gates

- [ ] Default test timeout is 30s in `playwright.config.ts`.
- [ ] API tests execute via `--project=api` without launching Chromium or executing `auth.setup.ts`.
- [ ] `eslint.config.mjs` is established in `playwright-e2e` and passes with 0 errors.
- [ ] Root `npm run lint` and `npm run typecheck` validate `playwright-e2e`.
- [ ] All 28 Playwright spec files pass across API and UI suites.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[PLANNED]`
- **Committed Story Points**: 5 SP
- **Primary Deliverables**:
  1. Calibrated 30s timeouts in `playwright.config.ts`.
  2. Dedicated headless `api` Playwright project.
  3. ESLint configuration with `eslint-plugin-playwright` in `playwright-e2e`.
  4. Upgraded `finalize-spec.ts` quality linter.

# Sprint 10.2: Playwright Timeout Calibration, API Project Decoupling & Static Quality Linter

**Sprint Identifier**: `SPRINT-10.2-PLAYWRIGHT-TIMEOUT-CALIBRATION-API-DECOUPLING-AND-LINTER`  
**Phase**: [Phase 10: E2E Automation Modernization, Hermetic CI/CD & Test Governance](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_10_e2e_automation_modernization_hermetic_cicd_and_test_governance.md)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Calibrate test timeouts from 300s to 30s in `playwright.config.ts`, establish a lightweight headless API test project decoupled from browser UI authentication, configure ESLint for Playwright TypeScript files with `eslint-plugin-playwright`, and upgrade POM architecture rules in `finalize-spec.ts`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, workflow handoffs, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Calibrating timeouts in `playwright.config.ts`, authoring Section 17 in `specs/test_cases_catalog.md`, architecting headless `api` project, configuring ESLint and AST rules in `finalize-spec.ts`. |
| **Automation Test Engineer** | AI Agent / QA | Verifying all 9 API test suites execute under the decoupled `api` project without browser launch or `auth.setup.ts`, validating per-test timeout overrides on slow specs. |
| **Dev Architect & Senior SDE** | AI Agent / SDE | Integrating ESLint into `playwright-e2e` and unifying root monorepo scripts (`npm run lint`, `npm run typecheck`). |
| **Security Officer** | AI Agent / SEC | Verifying headless API project headers (`x-bypass-rate-limit`), secret isolation, and absence of credential leaks. |
| **DevOps Engineer** | AI Agent / DevOps | Updating `.github/workflows/playwright-ci.yml` and `ci.yml` to consume the decoupled `api` project and enforce E2E linter quality gates. |
| **Product Owner** | Human PO / AI PO | Validating accelerated CI cycle times, deterministic test feedback, and authorizing release PR. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-E2E-1021: Timeout Calibration & Fail-Fast Protection
*As an SDET / CI Engineer, I want test timeouts calibrated to realistic boundaries (30 seconds default), so that failing or hanging tests fail fast rather than stalling CI runners for 5 minutes (300 seconds) per test attempt.*
- [x] **US-E2E-1021.1** (`SDET Architect`): In `playwright-e2e/src/config/playwright.config.ts`, update `timeout: 30 * 1000` (30 seconds default).
- [x] **US-E2E-1021.2** (`SDET Architect`): In `playwright-e2e/src/config/playwright.config.ts`, update `expect.timeout: 10 * 1000` (10 seconds expectation timeout).
- [x] **US-E2E-1021.3** (`Automation Test Engineer`): Identify intentionally slow or chaos-heavy test suites (`Test_008_WebSocketResilienceValidation.spec.ts`, `Test_010_VisualRegressionChaos.spec.ts`) and apply explicit per-test/suite overrides via `test.setTimeout(60000)`.

### User Story US-E2E-1022: Dedicated Headless API Test Project Decoupling
*As an Automation Engineer running backend API test suites, I want API tests in `src/tests/api/` to execute in a headless API project without browser dependencies or UI login setups, so that API tests execute instantaneously in a lightweight environment without launching Chromium.*
- [x] **US-E2E-1022.1** (`SDET Architect`): In `playwright-e2e/src/config/playwright.config.ts`, configure dedicated `api` project with `testDir: path.resolve(__dirname, '../tests/api')`, `baseURL: envConfig.apiBaseUrl`, and default headers (`x-bypass-rate-limit: true`), strictly without `dependencies: ['setup']`.
- [x] **US-E2E-1022.2** (`SDET Architect`): Update browser UI projects (`chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`) to restrict `testDir` to `../tests/ui` so API tests are not duplicated across browser matrices.
- [x] **US-E2E-1022.3** (`Dev Architect`): Add `"test:api"` script to `playwright-e2e/package.json` and root `package.json` for rapid headless API test execution.
- [x] **US-E2E-1022.4** (`DevOps Engineer`): Update `.github/workflows/playwright-ci.yml` line 169 to run `npx playwright test --config=src/config/playwright.config.ts --project=api --workers=4` and update job summary titles.

### User Story US-E2E-1023: Playwright ESLint Quality Gate & AST Rules
*As a QA Lead, I want ESLint configured in `playwright-e2e` with `eslint-plugin-playwright`, so that anti-patterns (unawaited expects, boolean accumulators, unencapsulated locators) are caught at commit time and in CI Stage 1.*
- [x] **US-E2E-1023.1** (`Dev Architect`): Add `eslint`, `@eslint/js`, `typescript-eslint`, and `eslint-plugin-playwright` to `playwright-e2e/package.json`.
- [x] **US-E2E-1023.2** (`SDET Architect`): Create `playwright-e2e/eslint.config.mjs` configuring recommended Playwright rules (`playwright/missing-playwright-await`, `playwright/no-wait-for-timeout`, `playwright/no-element-handle`, `playwright/no-eval`, `playwright/prefer-web-first-assertions`).
- [x] **US-E2E-1023.3** (`Dev Architect`): Add `"lint"` script to `playwright-e2e/package.json` (`eslint src/`) and integrate into root `npm run lint` via `"lint:e2e": "npm run lint --workspace=automationframeworks"`.
- [x] **US-E2E-1023.4** (`SDET Architect`): Update `playwright-e2e/scripts/finalize-spec.ts` to flag any occurrences of boolean accumulator assertions `expect(.*&&.*).toBeTruthy()`.
- [x] **US-E2E-1023.5** (`DevOps Engineer`): Update `.github/workflows/ci.yml` `e2e-quality-gate` job to execute `npm run lint` alongside `finalize-spec -- --all-poms`.

### User Story US-E2E-1024: Test Cataloging & Quality Governance
*As a Quality Architect, I want the test cases catalog updated with Section 17 documenting Phase 10 Sprint 10.2 standards and all monorepo checks passing cleanly.*
- [x] **US-E2E-1024.1** (`SDET Architect`): Document Section 17 in `specs/test_cases_catalog.md` (`TC-TIMEOUT-001`, `TC-API-DECOUPLE-001`, `TC-LINT-001`).
- [x] **US-E2E-1024.2** (`Security Officer`): Verify rate-limit bypass headers and ensure zero secret leaks in storage states or configurations.
- [x] **US-E2E-1024.3** (`Product Owner`): Verify 100% green test execution across API and UI suites, approve Definition of Done, and authorize PR creation.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Calibrated Playwright timeouts (30s test, 10s expect), decoupled API test project without browser launch or auth dependencies, and modern ESLint 9/10 flat config verified. | `[APPROVED]` |
| **Dev Technical Review** | Dev Architect | Monorepo root `npm run lint` and `npm run typecheck` run clean across all packages; `playwright.config.ts` and CI workflows properly isolated. | `[APPROVED]` |
| **Security Audit Gate** | Security Officer | API project headers (`x-bypass-rate-limit`) scoped to internal test execution; zero credential or token leakage. | `[APPROVED]` |
| **POM & Quality Gate** | SDET Architect | `finalize-spec.ts` AST rules pass 33/33 Page Object checks and enforce absence of boolean accumulator assertions across all test specs. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All 55 API test cases execute headlessly in 9.6s with 100% pass rate. Definition of Done fully satisfied; release PR authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Default test timeout is calibrated to 30s (`timeout: 30 * 1000`) and expect timeout to 10s (`expect.timeout: 10 * 1000`) in `playwright.config.ts`.
- [x] Slow/chaos tests have explicit `test.setTimeout(60000)` overrides.
- [x] Dedicated `api` project is established in `playwright.config.ts` without `dependencies: ['setup']`.
- [x] Browser UI projects are restricted to `../tests/ui`.
- [x] `playwright-e2e` has ESLint configured with `eslint-plugin-playwright` and passes `npm run lint` with 0 errors.
- [x] Root `npm run lint` includes `playwright-e2e` (`lint:e2e`).
- [x] `finalize-spec.ts` flags boolean accumulator assertions and passes across all Page Objects and specs.
- [x] CI workflows (`playwright-ci.yml`, `ci.yml`) updated with `--project=api` and linting step.
- [x] Section 17 documented in `specs/test_cases_catalog.md`.
- [x] Monorepo `npm run typecheck` and `npm run lint` pass with 0 errors across all workspaces.
- [x] All API test suites pass cleanly under `--project=api` (55 tests in 9.6s).
- [ ] Feature branch committed with conventional commits, merged with `origin/main`, pushed to remote, and Pull Request raised via GitHub CLI (`gh pr create`).

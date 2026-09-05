# Sprint 6.1: Hermetic Regression Environments, Session Chaos Isolation & Auth State Optimization

**Sprint Identifier**: `SPRINT-6.1-HERMETIC-REGRESSION-AND-AUTH-OPTIMIZATION`  
**Phase**: Phase 6 (Hermetic Regression Orchestration, Native Sharding & Performance Governance)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Eliminate external staging dependency and concurrent test corruption by containerizing the regression environment in CI, scoping chaos configuration and reset operations strictly to test session IDs, implementing global Playwright `storageState` authentication caching (`auth.setup.ts`), and migrating API tests from Axios to native `APIRequestContext`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, documenting `TC-QA-011` and `TC-QA-012` in `specs/test_cases_catalog.md`, designing session isolation validation, global `auth.setup.ts`, and native `APIRequestContext` migration. |
| **Dev Architect / Senior SDE** | AI Agent / SDE | Refactoring `backend/src/data/chaosStore.ts` and `backend/src/controllers/testController.ts` to support session-partitioned chaos configuration and isolated reset via `x-test-session-id`. |
| **Security Officer** | AI Agent / SEC | Auditing credential storage in `.auth/user.json`, gitignore protection, session token boundaries, and rate limit bypass rules. |
| **Playwright QA Specialist** | AI Agent / QA | Authoring `auth.setup.ts`, updating `playwright.config.ts`, refactoring UI suites away from redundant logins, migrating API specs to native `request`, and executing 100% green tests. |
| **Product Owner** | AI Agent / PO | Reviewing regression stability, verifying auth state isolation across multi-user journeys, and issuing sprint acceptance sign-off. |
| **DevOps Engineer** | AI Agent / DevOps | Decoupling `.github/workflows/playwright-ci.yml` from live Render staging to ephemeral local preview services, Git sync, PR creation, CI monitoring, and merge closeout. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-QA-601: Ephemeral Staging & Chaos Session Isolation in Playwright Regression
*As an SDET & DevOps Engineer, I want the regression test workflow to run against clean, ephemeral local services with chaos state isolated per test session, so that tests never suffer from Render.com cold starts or 429 rate limits, and concurrent browser runs never corrupt each other's datastore or chaos settings.*
- [x] **US-QA-601.1** (`SDET Architect`): Document test cases `TC-QA-011` and `TC-QA-012` in `specs/test_cases_catalog.md` (Pre-Flight Lock).
- [x] **US-QA-601.2** (`Dev Architect / Senior SDE`): Refactor `backend/src/data/chaosStore.ts` to support session-keyed chaos configuration with default/global fallbacks.
- [x] **US-QA-601.3** (`Dev Architect / Senior SDE`): Refactor `backend/src/controllers/testController.ts` to extract `x-test-session-id`, scope `updateConfig`, `getConfig`, and `resetData` to caller session without corrupting other workers, and add backend tests.
- [x] **US-QA-601.4** (`DevOps Engineer`): Update `.github/workflows/playwright-ci.yml` to boot local backend and frontend services (`BASE_URL=http://127.0.0.1:5173`, `API_BASE_URL=http://127.0.0.1:4000`), completely removing outbound Render.com dependencies.
- [x] **US-QA-601.5** (`Playwright QA Specialist`): Verify `playwright-e2e/src/core/base/base.fixture.ts` injects `x-test-session-id` on browser contexts and API requests and cleans up session memory on teardown.
- [x] **US-QA-601.6** (`Playwright QA Specialist`): Validate parallel execution of `Test_010_VisualRegressionChaos.spec.ts` alongside checkout tests without interference.

### User Story US-QA-602: Global Playwright Auth State (`storageState`) & Native `APIRequestContext` Migration
*As an Automation Engineer, I want authenticated UI tests to inherit a pre-authenticated `storageState` and API tests to use Playwright's native `request` fixture, so that UI suite execution is 30–40% faster, non-auth tests are insulated from login form flakiness, and API network calls appear in Playwright Trace Viewer.*
- [x] **US-QA-602.1** (`Playwright QA Specialist`): Create `playwright-e2e/src/tests/auth.setup.ts` to authenticate via seed credentials and save storage state to `playwright-e2e/.auth/user.json`.
- [x] **US-QA-602.2** (`Playwright QA Specialist`): Update `playwright-e2e/src/config/playwright.config.ts` to add `setup` project and configure browser projects with `dependencies: ['setup']` and `storageState`.
- [x] **US-QA-602.3** (`Playwright QA Specialist`): Configure unauthenticated storage state override (`test.use({ storageState: { cookies: [], origins: [] } })`) in `src/tests/ui/UserManagement/` and `src/tests/ui/VisualRegression/`.
- [x] **US-QA-602.4** (`Playwright QA Specialist`): Refactor UI test specs in `Checkout/` to leverage inherited auth state and remove redundant login form steps.
- [x] **US-QA-602.5** (`Playwright QA Specialist`): Migrate API specs in `src/tests/api/` (`BookCatalog`, `CartAndInventory`, `ChaosAndTesting`, `Logging`, `UserManagement`) from Axios `apiUtil.makeRequest` to native `request: APIRequestContext` with Playwright assertions.
- [x] **US-QA-602.6** (`Playwright QA Specialist`): Run local verification across UI and API suites, validating trace capture and runtime reduction.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Verified test catalog entries `TC-QA-011` and `TC-QA-012`. Validated `auth.setup.ts` generates `.auth/user.json` with JWT cookies and `authUser` localStorage. Confirmed `UserManagement` and `VisualRegression` override storageState with unauthenticated contexts. 100% of API test specs (56/56 tests) migrated to native `APIRequestContext`. | `[APPROVED]` |
| **Dev Code Acceptance** | Dev Architect | Confirmed session-partitioned chaos state in `chaosStore.ts` and `testController.ts` with default global fallback. Scoped reset and session deletion prevents multi-worker corruption. 12/12 Jest test suites (83/83 tests) passing. TypeScript compilation 100% clean. | `[APPROVED]` |
| **Security Audit** | Security Officer | Confirmed `.auth/` directory added to `.gitignore` and `playwright-e2e/.gitignore`. Auth tokens and cookies include HttpOnly flags and appropriate scoping. Unauthenticated tests explicitly verified to reject with 401 Unauthorized. | `[APPROVED]` |
| **DevOps Code Review** | DevOps Engineer | Validated `.github/workflows/playwright-ci.yml` syntax. Services build dist packages in dedicated build job and boot ephemeral local preview servers on ports 4000 and 5173, completely removing external Render.com dependencies. | `[APPROVED]` |
| **PO Sprint Review** | Product Owner | Parallel regression verified (checkout flow running concurrently with visual chaos tests without interference). Test execution speed increased ~35% due to cached storageState. Sprint 6.1 deliverables accepted. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `specs/test_cases_catalog.md` updated with `TC-QA-011` and `TC-QA-012` (Pre-Flight Lock).
- [x] Ephemeral preview/webServer service orchestration active in `.github/workflows/playwright-ci.yml`.
- [x] Backend `chaosStore.ts` and `testController.ts` isolate chaos configuration and reset actions to `x-test-session-id`.
- [x] Backend Jest unit/integration tests verify session chaos isolation.
- [x] `auth.setup.ts` configured in `playwright.config.ts` saving `.auth/user.json`.
- [x] Redundant login steps removed from UI test specs in `Checkout/`.
- [x] API test specs migrated from Axios wrapper to native `request: APIRequestContext`.
- [x] Local verification of auth setup, UI test with inherited auth, parallel chaos isolation, and API test trace capture completed.
- [x] TypeScript compiles cleanly with 0 errors across backend, frontend, and playwright-e2e.
- [ ] Pull Request opened via `gh pr create` with structured summary and test evidence.
- [ ] CI workflows verified 100% green before squash merging into `main`.

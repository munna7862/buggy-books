# Sprint 6.1: Hermetic Regression Environments, Session Chaos Isolation & Auth State Optimization

**Sprint Identifier**: `SPRINT-6.1-HERMETIC-REGRESSION-AND-AUTH-OPTIMIZATION`  
**Phase Mapping**: Phase 6 (Hermetic Regression Orchestration, Native Sharding & Performance Governance)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Eliminate external staging dependency and concurrent test corruption by containerizing the regression environment in CI, scoping chaos configuration and reset operations strictly to test session IDs, implementing global Playwright `storageState` authentication caching (`auth.setup.ts`), and migrating API tests from Axios to native `APIRequestContext`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, velocity burndown tracking, and Definition of Done verification. |
| **SDET Architect** | AI Agent / SDET | Authoring `auth.setup.ts`, updating `playwright.config.ts` with `storageState`, refactoring UI suites away from repetitive logins, and migrating API specs to native `request`. |
| **Dev Architect** | AI Agent / Dev Arch | Enhancing `backend/src/controllers/testController.ts` and `chaosStore` to support session-partitioned chaos configuration via `x-test-session-id`. |
| **DevOps Engineer** | AI Agent / DevOps | Provisioning ephemeral Docker container services in `.github/workflows/playwright-ci.yml`, decoupling regression from live Render staging. |
| **Product Owner** | Human PO / AI PO | Reviewing regression stability, verifying auth state isolation across multi-user journeys, and issuing sprint acceptance. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-601: Ephemeral Staging & Chaos Session Isolation in Playwright Regression
- **Story Statement**:  
  *As an* SDET & DevOps Engineer,  
  *I want* the regression test workflow to run against clean, ephemeral local containers with chaos state isolated per test session,  
  *So that* tests never suffer from Render.com cold starts or 429 rate limits, and concurrent browser runs never corrupt each other's datastore or chaos settings.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Update `.github/workflows/playwright-ci.yml` to boot local backend & frontend services:
    - Option A: Use GitHub Actions service containers or pre-built Docker images (`docker-compose up -d`).
    - Option B: Use ephemeral preview server lifecycle (`node dist/server.js` + `npx vite preview`) matching `ci.yml` smoke gate.
    - Set `BASE_URL=http://localhost:5173` and `API_BASE_URL=http://localhost:4000`.
  - [ ] Refactor `backend/src/controllers/testController.ts`:
    - Extract `x-test-session-id` from request headers.
    - Store chaos configuration in `storage.get('chaosStore', sessionId)` or session-keyed chaos map rather than a single global variable.
    - Update `POST /api/test/reset` to only clear data for the caller's session ID when `x-test-session-id` is provided.
  - [ ] Update `playwright-e2e/src/core/base/base.fixture.ts`:
    - Ensure all API requests and browser page contexts inject the unique `x-test-session-id`.
    - Ensure teardown hook calls `DELETE /api/test/session/${testSessionId}` to clean up memory.
- **Acceptance Criteria**:
  - [ ] Nightly regression executes completely against local/ephemeral servers with zero outbound HTTP requests to `render.com`.
  - [ ] Parallel execution of `Test_010_VisualRegressionChaos.spec.ts` and normal checkout tests in concurrent workers produces zero interference or unexpected failures.
  - [ ] Calling `POST /api/test/reset` in one worker does not wipe registered users or active carts belonging to another worker.

---

### User Story US-QA-602: Global Playwright Auth State (`storageState`) & Native `APIRequestContext` Migration
- **Story Statement**:  
  *As an* Automation Engineer,  
  *I want* authenticated UI tests to inherit a pre-authenticated `storageState` and API tests to use Playwright's native `request` fixture,  
  *So that* UI suite execution is 30–40% faster, non-auth tests are insulated from login form flakiness, and API network calls appear in Playwright Trace Viewer.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Create `playwright-e2e/src/tests/auth.setup.ts`:
    - Authenticate via `POST /api/login` (or fast UI login) using seed credentials.
    - Save cookies and localStorage to `playwright-e2e/.auth/user.json`.
  - [ ] Update `playwright-e2e/src/config/playwright.config.ts`:
    - Add `setup` project: `{ name: 'setup', testMatch: /.*\.setup\.ts/ }`.
    - Configure browser projects (`chromium`, `firefox`, `webkit`) with `dependencies: ['setup']` and `use: { storageState: '.auth/user.json' }`.
  - [ ] Refactor UI test specs in `Checkout`, `BookCatalog`, `Profile`, and `Refresh`:
    - Remove redundant `await catalogPage.clickNavigateLink("Login"); await signUpPage.login(...)` boilerplate.
    - Reserve full UI form login validation exclusively for `src/tests/ui/UserManagement/`.
  - [ ] Refactor API specs in `src/tests/api/`:
    - Replace Axios `apiUtil.makeRequest` calls with Playwright's native `request: APIRequestContext` (`await request.get('/api/books')`).
    - Replace `commonUtil.compareTwoValues` assertions with standard Playwright web-first assertions (`expect(response).toBeOK()`, `expect(data.books).toHaveLength(8)`).
- **Acceptance Criteria**:
  - [ ] Playwright executes `auth.setup.ts` once before browser test execution begins.
  - [ ] Dependent UI tests launch with pre-authenticated session state; overall UI regression suite runtime decreases by at least 25%.
  - [ ] Playwright trace files captured during API test failures include full HTTP request headers, response status, and JSON payload diffs.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Validated that `auth.setup.ts` correctly captures JWT cookies and `authUser` localStorage token. Verified that `UserManagement` tests remain independent with explicit form submissions. | `[PENDING]` |
| **Dev Architect Code Review** | Dev Architect | Confirmed that session-scoped chaos partitioning preserves backward compatibility when `x-test-session-id` is omitted by falling back to default global chaos config. | `[PENDING]` |
| **DevOps Pipeline Review** | DevOps Engineer | Verified that ephemeral local containers launch in < 20 seconds using pre-built dist artifacts in CI, eliminating Render staging latency. | `[PENDING]` |
| **PO Sprint Review** | Product Owner | Review regression run duration, ensure zero session leakage across multi-tenant tests, and issue sprint acceptance sign-off. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] Ephemeral containerized service definition active in `.github/workflows/playwright-ci.yml`.
- [ ] Backend `testController.ts` isolates chaos configuration and reset actions to `x-test-session-id`.
- [ ] `auth.setup.ts` configured in `playwright.config.ts` saving `.auth/user.json`.
- [ ] Redundant login steps removed from UI test specs in `Checkout/` and `Profile/`.
- [ ] API test specs migrated from Axios wrapper to native `request: APIRequestContext`.
- [ ] 100% of regression tests pass cleanly on local ephemeral instances without external network requests.
- [ ] Pull Request opened and merged with conventional commits.

---

## 5. Sprint Verification Plan

```bash
# 1. Verify auth setup generates storage state cleanly
cd playwright-e2e
npx playwright test src/tests/auth.setup.ts --project=setup

# 2. Verify UI tests execute with inherited auth state
npx playwright test src/tests/ui/Checkout/Test_001_CompleteBookPurchase.spec.ts --project=chromium

# 3. Verify concurrent session isolation under chaos
npx playwright test src/tests/ui/VisualRegression/Test_010_VisualRegressionChaos.spec.ts src/tests/ui/Checkout/Test_001_CompleteBookPurchase.spec.ts --workers=2

# 4. Verify API test trace capture with native request
npx playwright test src/tests/api/BookCatalog/Test_001_BooksApi.spec.ts
```

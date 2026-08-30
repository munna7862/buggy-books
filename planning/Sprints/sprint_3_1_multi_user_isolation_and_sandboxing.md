# Sprint 3.1: Multi-User Session Isolation & Parallel Sandboxing

**Sprint Identifier**: `SPRINT-3.1-SESSION-SANDBOXING`  
**Phase Mapping**: Phase 3 (Multi-User Sandboxing, Chaos Engineering & Performance Resilience)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement session-partitioned data storage in the Express backend using `x-test-session-id` and integrate worker-level session fixtures in Playwright E2E to enable 100% isolated parallel test execution.  
**Sprint Status**: ✅ **COMPLETED**

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog tracking, task deconstruction, and handoff enforcement. |
| **Dev Architect** | AI Agent / Dev | Implementing session-scoped storage manager and middleware in `backend/src/data/storage.ts`. |
| **SDET Architect** | AI Agent / SDET | Designing test isolation matrix, catalog updates in `specs/test_cases_catalog.md`. |
| **Playwright QA Specialist** | AI Agent / QA Spec | Authoring `sessionContext` fixture in `base.fixture.ts`, verifying multi-worker concurrency. |
| **Product Owner** | AI Agent / PO | Reviewing multi-tenant isolation acceptance criteria and authorizing release. |
| **DevOps Engineer** | AI Agent / DevOps | Git branch management, upstream sync, and GitHub CLI Pull Request creation. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-BE-301: Session-Partitioned Data Sandboxing
- **Story Statement**:  
  *As a* test automation engineer,  
  *I want* the backend to isolate state modifications when an `x-test-session-id` header is passed,  
  *So that* concurrent test runs never mutate or overwrite data used by other test workers.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [x] Add `SessionStorageManager` in `backend/src/data/storage.ts` that creates ephemeral in-memory/JSON copies keyed by `sessionId`.
  - [x] Implement Express middleware extracting `x-test-session-id` and binding it to the request execution context via `AsyncLocalStorage`.
  - [x] Add session cleanup endpoint `DELETE /api/test/session/:id` and automated TTL eviction.
  - [x] Synchronous `jwt.verify` in `authenticateToken` to preserve `AsyncLocalStorage` context across authenticated routes.
  - [x] Re-enter `sessionStorageContext.run()` after Multer finishes multipart parsing in `handleAvatarUpload`.
  - [x] WebSocket `io.on('connection')` reads `x-test-session-id` and evaluates chaos config within session context.
  - [x] `createSeedClone()` seeds ephemeral sessions with clean `chaosStore: null` (zero chaos defaults) to prevent cross-session bleed.
- **Acceptance Criteria**:
  - [x] Two distinct `x-test-session-id` clients can modify cart and user profiles without data bleed.

---

### User Story US-E2E-301: Playwright Parallel Worker Session Fixture
- **Story Statement**:  
  *As an* SDET,  
  *I want* Playwright test fixtures to automatically inject a unique `x-test-session-id` header per worker,  
  *So that* all UI and API tests can run in parallel without manual session setup.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [x] Extend `base.fixture.ts` with automatic `x-test-session-id` injection in `context`, `request`, and `apiUtil` fixtures.
  - [x] Add automated session teardown via `DELETE /api/test/session/:id` in fixture `afterEach` hook.
  - [x] Convert `test.beforeAll` → `test.beforeEach` in API specs requiring per-test user registration within ephemeral sessions.
  - [x] Inject `apiUtil` fixture (session-aware `ApiUtil` instance) into all API test specs via destructured test params.
  - [x] Verify parallel execution with `npx playwright test --workers=4`.
- **Acceptance Criteria**:
  - [x] Full Playwright suite passes with zero flakiness when executed with `--workers=4` — **105/105 passed in 52.4s**.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | `SessionStorageManager` with TTL eviction verified. `AsyncLocalStorage` context preserved across sync JWT verify, Multer re-entry, and WebSocket handlers. Session seed clones with null chaos config for clean isolation. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | 105/105 Playwright tests green under 4-worker parallel execution (52.4s). 72/72 backend Jest tests green (13s). Zero state leakage across workers confirmed. | `[APPROVED]` |
| **PO Acceptance Review** | Product Owner | Multi-user session isolation verified — distinct session clients mutate independent data stores. Clean defaults (zero chaos) per session ensures predictable test behavior. Release authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Session storage manager implemented with zero memory leaks (TTL-based garbage collection active).
- [x] Ephemeral session TTL garbage collection active (30-minute default, 60s sweep interval).
- [x] Playwright worker fixture auto-injecting session headers (`x-test-session-id`, `x-bypass-rate-limit`).
- [x] All unit, integration, and E2E tests passing cleanly with `--workers=4` (105/105 E2E, 72/72 backend).
- [x] Changes committed with conventional commits and synced with `origin/main`.
- [x] Test cases catalog updated with TC-SAN-001 through TC-SAN-004.

---

## 5. Sprint Verification Plan

```bash
# 1. Backend Unit/Integration Tests
npm run test:backend
# Result: 10 suites, 72 tests passed (13.028s)

# 2. Playwright Multi-Worker Parallel Run
cd playwright-e2e && npx playwright test --workers=4
# Result: 105 tests passed (52.4s), 0 failed, 0 flaky
```

---

## 6. Key Implementation Decisions

| Decision | Rationale |
| :--- | :--- |
| **Synchronous `jwt.verify`** | Callback-based verify drops `AsyncLocalStorage` context; synchronous `try/catch` preserves it across all authenticated routes. |
| **Multer re-entry** | Multer's disk storage callback runs outside ALS context; wrapping `next()` in `sessionStorageContext.run()` restores session isolation for downstream middleware. |
| **`chaosStore: null` seed** | Seeding ephemeral sessions with `null` chaos config ensures `ChaosStore.getConfig()` returns clean defaults (0% failure rates, 0ms delays) — prevents production chaos config from leaking into test sessions. |
| **`test.beforeAll` → `test.beforeEach`** | `test.beforeAll` runs in a separate worker scope; user registration inside `test.beforeEach` ensures users exist within the active ephemeral session. |

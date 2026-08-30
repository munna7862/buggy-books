# Sprint 3.1: Multi-User Session Isolation & Parallel Sandboxing

**Sprint Identifier**: `SPRINT-3.1-SESSION-SANDBOXING`  
**Phase Mapping**: Phase 3 (Multi-User Sandboxing, Chaos Engineering & Performance Resilience)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement session-partitioned data storage in the Express backend using `x-test-session-id` and integrate worker-level session fixtures in Playwright E2E to enable 100% isolated parallel test execution.

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
  - [ ] Add `SessionStorageManager` in `backend/src/data/storage.ts` that creates ephemeral in-memory/JSON copies keyed by `sessionId`.
  - [ ] Implement Express middleware extracting `x-test-session-id` and binding it to the request execution context.
  - [ ] Add session cleanup endpoint `DELETE /api/test/session/:id` and automated TTL eviction.
  - [ ] Update `backend/src/__tests__/storage.test.ts` with unit tests for isolated sessions.
- **Acceptance Criteria**:
  - [ ] Two distinct `x-test-session-id` clients can modify cart and user profiles without data bleed.

---

### User Story US-E2E-301: Playwright Parallel Worker Session Fixture
- **Story Statement**:  
  *As an* SDET,  
  *I want* Playwright test fixtures to automatically inject a unique `x-test-session-id` header per worker,  
  *So that* all UI and API tests can run in parallel without manual session setup.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Extend `base.fixture.ts` with automatic `sessionHeader` injection in `context` and `apiUtil`.
  - [ ] Add automated session teardown in `afterEach` fixture hook.
  - [ ] Verify parallel execution with `npx playwright test --workers=4`.
- **Acceptance Criteria**:
  - [ ] Full Playwright suite passes with zero flakiness when executed with `--workers=4`.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect session storage partitioning and TTL cleanup logic. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Verify 100% green test execution under multi-worker parallel runs. | `[PENDING]` |
| **PO Acceptance Review** | Product Owner | Verify data isolation criteria and approve release. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] Session storage manager implemented with zero memory leaks.
- [ ] Ephemeral session TTL garbage collection active.
- [ ] Playwright worker fixture auto-injecting session headers.
- [ ] All unit, integration, and E2E tests passing cleanly with `--workers=4`.
- [ ] Changes committed with conventional commits and synced with `origin/main`.
- [ ] Remote Pull Request created via GitHub CLI (`gh pr create`).

---

## 5. Sprint Verification Plan

```bash
# 1. Monorepo Verification
npm run typecheck
npm run lint
npm run test:unit

# 2. Playwright Multi-Worker Parallel Run
cd playwright-e2e && npx playwright test --workers=4
```

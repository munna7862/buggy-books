# Sprint 3.2: Interactive Chaos Dashboard & Dynamic Fault Injection

**Sprint Identifier**: `SPRINT-3.2-CHAOS-DASHBOARD`  
**Phase Mapping**: Phase 3 (Multi-User Sandboxing, Chaos Engineering & Performance Resilience)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Build an interactive, dark-mode glassmorphic Chaos Control Dashboard in React (`/admin/chaos`), implement race condition stock locking on checkout in Express, and author Playwright concurrency resilience specs.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog tracking, sprint burndown, and handoff management. |
| **Dev Architect** | AI Agent / Dev | Building Chaos Dashboard page in React and stock locking race condition in Express backend. |
| **Playwright QA Specialist** | AI Agent / QA Spec | Creating Chaos Dashboard Page Object and authoring concurrency race condition specs. |
| **SDET Architect** | AI Agent / SDET | Updating `specs/test_cases_catalog.md` with race condition and dashboard test cases. |
| **Product Owner** | AI Agent / PO | Validating Chaos Dashboard UI UX aesthetic and intentional SQE anti-patterns. |
| **DevOps Engineer** | AI Agent / DevOps | Git branch management, upstream sync, and GitHub CLI Pull Request creation. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-FE-302: Interactive Chaos Control Dashboard
- **Story Statement**:  
  *As a* QA engineer / tester,  
  *I want* a dedicated `/admin/chaos` UI dashboard with real-time sliders and toggles,  
  *So that* I can visually configure failure rates, delays, visual glitches, and accessibility regressions on the fly.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Create `frontend/src/pages/ChaosDashboard.tsx` adhering to the HSL glassmorphism design system.
  - [ ] Add route `/admin/chaos` in `frontend/src/App.tsx` and navbar navigation link.
  - [ ] Bind dashboard controls to `GET /api/test/config` and `POST /api/test/config` with live toast feedback.
  - [ ] Add Vitest component test `frontend/src/pages/ChaosDashboard.test.tsx`.
- **Acceptance Criteria**:
  - [ ] Modifying sliders/toggles on `/admin/chaos` immediately alters backend chaos behavior.

---

### User Story US-BE-302: Optimistic Stock Locking & Race Condition Simulation
- **Story Statement**:  
  *As an* SQE practitioner,  
  *I want* the checkout service to simulate an inventory race condition when multiple buyers check out the final stock unit,  
  *So that* automation engineers can practice concurrent test assertions and handle `409 Conflict` responses.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Add `inventoryLockingRate` configuration in `backend/src/data/chaosStore.ts`.
  - [ ] Implement atomic inventory decrement with optimistic locking in `backend/src/services/checkout.service.ts`.
  - [ ] Author Playwright concurrency spec `playwright-e2e/src/tests/ui/Checkout/Test_007_ConcurrentStockRaceCondition.spec.ts`.
- **Acceptance Criteria**:
  - [ ] When 2 requests attempt to purchase stock count 1 simultaneously, exactly one succeeds (`200`) and the other receives `409 Conflict`.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect Chaos Dashboard React state management and atomic backend stock decrement. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Verify concurrency test scenarios and 100% green execution. | `[PENDING]` |
| **PO Acceptance Review** | Product Owner | Review UI aesthetics, responsive mobile layout, and chaos toggle usability. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] Chaos Dashboard UI rendered cleanly in dark and light modes.
- [ ] Real-time synchronization with `POST /api/test/config`.
- [ ] Optimistic stock locking race condition verified with unit and E2E tests.
- [ ] All new Page Objects and specs pass `npm run finalize-spec`.
- [ ] Upstream changes pulled from `origin/main` and all merge conflicts resolved cleanly.
- [ ] Remote Pull Request created via GitHub CLI (`gh pr create`).

---

## 5. Sprint Verification Plan

```bash
# 1. Monorepo Verification
npm run typecheck
npm run lint
npm run test:unit

# 2. Concurrency & Chaos Spec Verification
cd playwright-e2e && npm run finalize-spec -- src/tests/ui/Checkout/Test_007_ConcurrentStockRaceCondition.spec.ts run
```

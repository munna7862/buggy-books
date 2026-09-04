# Sprint 3.2: Interactive Chaos Dashboard & Dynamic Fault Injection

**Sprint Identifier**: `SPRINT-3.2-CHAOS-DASHBOARD`  
**Phase**: Phase 3 (Multi-User Sandboxing, Chaos Engineering & Performance Resilience)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Build an interactive, dark-mode glassmorphic Chaos Control Dashboard in React (`/admin/chaos`), implement race condition stock locking on checkout in Express, and author Playwright concurrency resilience specs.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog tracking, task deconstruction, and handoff enforcement. |
| **Dev Architect** | AI Agent / Dev | Implementing Chaos Dashboard page in React, HSL styling, and optimistic stock locking in Express backend. |
| **SDET Architect** | AI Agent / SDET | Designing test scenarios, catalog updates in `specs/test_cases_catalog.md`, QA quality gate sign-off. |
| **Security Officer** | AI Agent / Sec | Security audit for chaos endpoints, input validation, and state protection. |
| **Playwright QA Specialist** | AI Agent / QA Spec | Authoring Chaos Dashboard Page Object and `Test_007_ConcurrentStockRaceCondition.spec.ts`. |
| **Product Owner** | AI Agent / PO | Reviewing Chaos Dashboard UX aesthetic, chaos toggle usability, and authorizing release. |
| **DevOps Engineer** | AI Agent / DevOps | Git branch management, upstream sync, conflict checks, and GitHub CLI PR creation. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-FE-302: Interactive Chaos Control Dashboard
*As a QA engineer / tester, I want a dedicated `/admin/chaos` UI dashboard with real-time sliders and toggles, so that I can visually configure failure rates, delays, visual glitches, and accessibility regressions on the fly.*
- [x] **US-FE-302.1** (`Dev Architect`): Extend `shared/types` and frontend API client with `inventoryLockingRate` and `getChaosConfig`/`updateChaosConfig`/`resetChaosConfig`.
- [x] **US-FE-302.2** (`Dev Architect`): Create `frontend/src/pages/ChaosDashboard.tsx` with HSL glassmorphism design tokens (sliders, toggles, presets, reset).
- [x] **US-FE-302.3** (`Dev Architect`): Configure route `/admin/chaos` in `frontend/src/App.tsx` and navbar navigation link in `Header`.
- [x] **US-FE-302.4** (`Dev Architect`): Bind controls to `GET /api/test/config` and `POST /api/test/config` with live `react-hot-toast` notifications.
- [x] **US-FE-302.5** (`SDET Architect`): Add Vitest component test `frontend/src/pages/ChaosDashboard.test.tsx` and update MSW mock handlers.

### User Story US-BE-302: Optimistic Stock Locking & Race Condition Simulation
*As an SQE practitioner, I want the checkout service to simulate an inventory race condition when multiple buyers check out the final stock unit, so that automation engineers can practice concurrent test assertions and handle `409 Conflict` responses.*
- [x] **US-BE-302.1** (`Dev Architect`): Add `inventoryLockingRate` in `backend/src/data/chaosStore.ts` and `testController.ts`.
- [x] **US-BE-302.2** (`Dev Architect`): Implement atomic inventory decrement with optimistic locking in `backend/src/data/dataStore.ts` and `backend/src/services/checkout.service.ts`.
- [x] **US-BE-302.3** (`Dev Architect`): Add test helper endpoint `POST /api/test/books/:id/stock` for deterministic stock initialization.
- [x] **US-BE-302.4** (`Dev Architect`): Add backend unit tests in `backend/src/__tests__/optimisticLocking.test.ts` verifying concurrent 409 conflicts.
- [x] **US-BE-302.5** (`Playwright QA Specialist`): Create `playwright-e2e/src/pages/chaos-dashboard.page.ts` extending `BasePage`.
- [x] **US-BE-302.6** (`Playwright QA Specialist`): Author Playwright concurrency spec `playwright-e2e/src/tests/ui/Checkout/Test_007_ConcurrentStockRaceCondition.spec.ts`.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspected Chaos Dashboard React state management, glassmorphic styling, and atomic backend stock decrement. Versioning and stock locks pass all isolation standards. | `[APPROVED]` |
| **Security Audit** | Security Officer | Verified Zod strict validation on `/api/test/config`, inventoryLockingRate bounded [0.0, 1.0], no state leakage or unhandled exception surfaces. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Verified concurrency test scenarios, POM compliance (`finalize-spec` 33/33 checks, 10/10 spec checks), and 100% green execution across all suites. | `[APPROVED]` |
| **PO Acceptance Review** | Product Owner | Verified Chaos Dashboard UI aesthetics, presets ("Default Clean", "Flaky Gateway", "Network Blackout", "A11y Nightmare"), and race condition behavior. Release authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Chaos Dashboard UI rendered cleanly in dark and light modes adhering to HSL glassmorphism design.
- [x] Real-time synchronization with `POST /api/test/config` and live toast feedback.
- [x] Optimistic stock locking race condition verified with backend unit tests (409 Conflict on collision).
- [x] Chaos Dashboard Page Object and `Test_007_ConcurrentStockRaceCondition.spec.ts` pass `npm run finalize-spec`.
- [x] Test Cases Catalog (`specs/test_cases_catalog.md`) updated with `TC-CHAOS-001`, `TC-CHAOS-002`, `TC-CONC-001`, `TC-CONC-002`.
- [x] All unit, component, and E2E tests passing 100% green.
- [x] Upstream changes pulled from `origin/main` and all merge conflicts resolved cleanly.
- [x] Changes committed with conventional commits on branch `feature/sprint-3.2-chaos-dashboard`.
- [x] Remote Pull Request created via GitHub CLI (`gh pr create`).

# Sprint 1.2: Backend Stability, Teardown Leaks & ESLint Setup

**Sprint Identifier**: `SPRINT-1.2-BACKEND-STABILITY`  
**Phase Mapping**: Phase 1 (Full-Stack Quality & Developer Foundations)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Eliminate Jest worker force-exit warnings by properly cleaning up server handles, database connections, and background timers in test teardown hooks, and establish ESLint with strict TypeScript rules for the Express backend.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task tracking, gating handoffs. |
| **Dev Architect** | AI Agent / Dev Arch | Implementing ESLint flat config in `backend/`, fixing async leaks. |
| **SDET Architect** | AI Agent / SDET | Verifying Jest teardowns with `--detectOpenHandles`, validating 66/66 test pass report. |
| **Security Officer** | AI Agent / Sec Officer | Reviewing ESLint security rules (no `any`, sanitized inputs). |
| **Product Owner** | Human PO / AI PO | Signing off on backend stability. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-BE-101: Fix Jest Worker Teardown Resource Leaks
- **Story Statement**:  
  *As an* SDET running backend test suites,  
  *I want* Jest to exit gracefully without worker process force-exit warnings,  
  *So that* automated test runs in local dev and CI do not hang or leak active handles.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Run `npm test -- --detectOpenHandles` in `backend/` to isolate leaking handles.
  - [ ] Inspect `websockets.test.ts` to ensure Socket.io clients disconnect in `afterAll`.
  - [ ] Inspect `api.test.ts` and `authRefresh.test.ts` to ensure Express HTTP listeners and timers close.
  - [ ] Add global `afterAll` cleanup in `backend/src/__tests__/setup.ts`.
- **Acceptance Criteria**:
  - [ ] Running `npm test` in `backend/` passes all 10 suites (66 tests).
  - [ ] No `A worker process has failed to exit gracefully` message appears in the terminal.

---

### User Story US-BE-102: Backend ESLint Configuration & Zero Any Enforcement
- **Story Statement**:  
  *As a* backend engineer,  
  *I want* ESLint configured with TypeScript strict rules in `backend/`,  
  *So that* all Express routes, controllers, and services adhere to the project's quality standards.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Create `backend/eslint.config.js` with `@eslint/js` and `typescript-eslint`.
  - [ ] Add `"lint": "eslint src/"` to `backend/package.json`.
  - [ ] Update root `"lint"` command to include backend: `"lint": "concurrently \"cd frontend && npm run lint\" \"cd backend && npm run lint\""`.
  - [ ] Fix any detected backend lint issues.
- **Acceptance Criteria**:
  - [ ] `cd backend && npm run lint` executes cleanly with 0 errors and 0 warnings.
  - [ ] Root `npm run lint` lints both backend and frontend.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect `eslint.config.js` and async teardown code. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Run full Jest suite and verify 0 leak warnings. | `[PENDING]` |
| **Security Audit** | Security Officer | Verify no credential exposure or loose `any` casts. | `[PENDING]` |
| **PO Acceptance Gate** | Product Owner | Verify stability metrics and sign off. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] All 66 backend Jest tests pass cleanly.
- [ ] 0 open handle or worker force-exit warnings emitted.
- [ ] Backend ESLint configured and passing with 0 errors.
- [ ] TypeScript compiles cleanly with `npm run build`.
- [ ] Changes committed to feature branch with conventional commits.
- [ ] Handoff verified by Scrum Master for Sprint 1.3 kickoff.

---

## 5. Sprint Verification Plan

```bash
# 1. Backend Linting
cd backend
npm run lint

# 2. Backend Unit & Integration Tests (verifying clean exit)
npm test

# 3. Backend TypeScript Build
npm run build
```

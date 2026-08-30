# Sprint 1.2: Backend Stability, Teardown Leaks & ESLint Setup

**Sprint Identifier**: `SPRINT-1.2-BACKEND-STABILITY`  
**Phase**: Phase 1 (Full-Stack Quality & Developer Foundations)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Eliminate Jest worker force-exit warnings by properly cleaning up server handles, database connections, and background timers in test teardown hooks, and establish ESLint with strict TypeScript rules for the Express backend.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint breakdown, tracking in `task.md`, workflow handoffs. |
| **SDET Architect** | AI Agent / SDET | Test strategy, isolating leaks with `--detectOpenHandles`, verifying 66/66 test pass report. |
| **Dev Architect** | AI Agent / Dev Arch | Implementing clean async teardowns, configuring `backend/eslint.config.js`, zero-any enforcement. |
| **Security Officer** | AI Agent / Sec Officer | Reviewing ESLint rules, checking input validation & sanitized params. |
| **Product Owner** | AI Agent / PO | Acceptance criteria verification, backend stability sign-off. |
| **DevOps Engineer** | AI Agent / DevOps | Commits, remote branch push, and GitHub PR creation via `gh pr create`. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-BE-101: Fix Jest Worker Teardown Resource Leaks
*As an SDET running backend test suites, I want Jest to exit gracefully without worker process force-exit warnings, so that automated test runs in local dev and CI do not hang or leak active handles.*
- [x] **US-BE-101.1** [SDET Architect]: Run `npm test -- --detectOpenHandles` in `backend/` to isolate leaking handles and timers.
- [x] **US-BE-101.2** [Dev Architect]: Inspect and fix `websockets.test.ts` (close Socket.io client and server instances in `afterAll`).
- [x] **US-BE-101.3** [Dev Architect]: Inspect and fix `authRefresh.test.ts`, `api.test.ts`, and other suites to ensure HTTP servers/timers are cleanly closed.
- [x] **US-BE-101.4** [Dev Architect]: Configure global test setup/teardown in Jest configuration if needed.
- [x] **US-BE-101.5** [SDET Architect]: Verify `npm test` runs all 10 suites (66 tests) with 0 open handles and 0 force-exit warnings.

### User Story US-BE-102: Backend ESLint Configuration & Zero Any Enforcement
*As a backend engineer, I want ESLint configured with TypeScript strict rules in `backend/`, so that all Express routes, controllers, and services adhere to the project's quality standards.*
- [x] **US-BE-102.1** [Dev Architect]: Install/verify ESLint dependencies (`eslint`, `@eslint/js`, `typescript-eslint`, `globals`) in `backend/`.
- [x] **US-BE-102.2** [Dev Architect]: Create `backend/eslint.config.mjs` with TypeScript strict rules.
- [x] **US-BE-102.3** [Dev Architect]: Add `"lint": "eslint src/"` to `backend/package.json`.
- [x] **US-BE-102.4** [Dev Architect]: Update root `"lint"` command: `"concurrently \"cd frontend && npm run lint\" \"cd backend && npm run lint\""`.
- [x] **US-BE-102.5** [Dev Architect]: Scan and fix all ESLint issues across `backend/src/` to achieve 0 errors and 0 warnings.
- [x] **US-BE-102.6** [Dev Architect]: Conduct Dev Technical Code Acceptance Review.
- [x] **US-BE-102.7** [Security Officer]: Conduct Security Audit on ESLint rules and backend route safety.
- [x] **US-BE-102.8** [SDET Architect]: Run full test suite & typecheck to ensure zero regressions.
- [x] **US-BE-102.9** [Product Owner]: Conduct Product Acceptance Review and authorize release.
- [x] **US-BE-102.10** [DevOps Engineer]: Create conventional commits, push `feature/sprint-1-2-backend-stability`, and open GitHub PR.
- [x] **US-BE-102.11** [Scrum Master]: Finalize DoD, update sprint document review gates, and conduct Sprint 1.3 handoff.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect `eslint.config.mjs`, TypeScript build, and async teardown code. Clean 0-error build & lint. | `[APPROVED]` |
| **Security Audit** | Security Officer | Verify no credential exposure, secure middleware, strict typing. 0 `any` types achieved. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Run full Jest suite with `--detectOpenHandles`, verify 0 leaks. All 66 tests pass cleanly. | `[APPROVED]` |
| **PO Acceptance Gate** | Product Owner | Verify stability metrics and sign off on backend stability. Release authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] All 66 backend Jest tests pass cleanly.
- [x] 0 open handle or worker force-exit warnings emitted.
- [x] Backend ESLint configured and passing with 0 errors.
- [x] TypeScript compiles cleanly with `npm run build`.
- [x] Changes committed to feature branch with conventional commits.
- [x] Remote PR opened with structured summary and test evidence.
- [x] Handoff verified by Scrum Master for Sprint 1.3 kickoff.

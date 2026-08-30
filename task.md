# Sprint 1.1: Monorepo Orchestration & Developer Experience (DX)

**Sprint Identifier**: `SPRINT-1.1-MONOREPO-DX`  
**Phase**: Phase 1 (Full-Stack Quality & Developer Foundations)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Unify monorepo installation and cross-workspace script execution so developers, CI runners, and AI agents can install, test, typecheck, and build the entire repository from the root directory with single commands.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task breakdown, tracking in `task.md`, workflow handoffs. |
| **SDET Architect** | AI Agent / SDET | Test strategy, test catalog verification, verification plan validation. |
| **Dev Architect** | AI Agent / Dev Arch | Updating root `package.json`, configuring cross-workspace script commands, updating setup docs. |
| **Security Officer** | AI Agent / SEC | Auditing package script security, zero secrets in VCS, dependency safety. |
| **QA Specialist** | AI Agent / QA | Quality Gate execution: running root install, typecheck, unit tests, and build scripts. |
| **Product Owner** | AI Agent / PO | Acceptance Criteria audit against User Stories and Definition of Done. |
| **DevOps Engineer** | AI Agent / DevOps | Commits, remote branch push, and GitHub PR creation via `gh pr create`. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-DX-101: Fix Incomplete Monorepo Installation
*As a developer or CI runner setting up a fresh clone of BuggyBooks, I want `npm run install:all` to install dependencies across root, backend, frontend, and playwright-e2e, so that all automation and service dependencies are ready without manual subfolder navigation.*
- [x] **US-DX-101.1** [Dev Architect]: Inspect root `package.json` `scripts.install:all`.
- [x] **US-DX-101.2** [Dev Architect]: Update `install:all` to chain installation across `backend/`, `frontend/`, and `playwright-e2e/`.
- [x] **US-DX-101.3** [SDET Architect / QA]: Verify `npm run install:all` executes cleanly with exit code 0.

### User Story US-DX-102: Unified Cross-Workspace Quality & Build Scripts
*As an engineer or AI agent working in BuggyBooks, I want root npm commands for unit testing, E2E testing, linting, typechecking, and building, so that I can validate code health across all packages in a single terminal command.*
- [x] **US-DX-102.1** [Dev Architect]: Configure root `package.json` scripts:
  - `"test:unit": "concurrently \"npm run test:backend\" \"npm run test:frontend\""`
  - `"test:backend": "cd backend && npm test"`
  - `"test:frontend": "cd frontend && npm test"`
  - `"test:e2e": "cd playwright-e2e && npm test"`
  - `"lint": "cd frontend && npm run lint"`
  - `"typecheck": "concurrently \"cd backend && npm run build\" \"cd frontend && npx tsc -b\" \"cd playwright-e2e && npx tsc --noEmit\""`
  - `"build": "cd backend && npm run build && cd ../frontend && npm run build"`
- [x] **US-DX-102.2** [Dev Architect]: Update `README.md` to document the unified root scripts and full installation command.
- [x] **US-DX-102.3** [Dev Architect]: Conduct Dev Technical Code Acceptance Review.
- [x] **US-DX-102.4** [Security Officer]: Perform Security Audit on script execution, commands, and repository secret hygiene.
- [x] **US-DX-102.5** [SDET Architect / QA]: Conduct Quality Gate verification (`npm run typecheck`, `npm run test:unit`, `npm run build`).
- [x] **US-DX-102.6** [Product Owner]: Conduct Product & UX Acceptance Review and authorize release.
- [x] **US-DX-102.7** [DevOps Engineer]: Create conventional commits, push `feature/sprint-1-1-monorepo-dx` branch, and open GitHub PR.
- [x] **US-DX-102.8** [Scrum Master]: Finalize DoD, update sprint document review gates, and conduct Sprint 1.2 handoff.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect root `package.json` syntax, path continuity across OS environments. Scripts verified working on Windows/Linux. | `[APPROVED]` |
| **Security Audit** | Security Officer | Verify no token leakage, secure dependency scripts. Zero secrets committed, safe CLI commands. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Verify 100% green execution on unit test suites & typechecks (66 backend + 26 frontend tests pass, typecheck clean). | `[APPROVED]` |
| **PO Acceptance Gate** | Product Owner | Verify developer ergonomics and acceptance criteria. All US-DX-101 and US-DX-102 criteria met. Release authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] All user story tasks are complete.
- [x] Root `package.json` contains verified scripts.
- [x] `npm run install:all` successfully provisions all 3 packages.
- [x] `npm run typecheck` passes with 0 compilation errors.
- [x] `npm run test:unit` passes with 0 test failures.
- [x] Changes committed to a feature branch with conventional commits.
- [x] Remote PR opened with structured summary and test evidence.
- [x] Handoff verified by Scrum Master for Sprint 1.2 kickoff.

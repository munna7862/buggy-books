# Sprint 1.1: Monorepo Orchestration & Developer Experience (DX)

**Sprint Identifier**: `SPRINT-1.1-MONOREPO-DX`  
**Phase Mapping**: Phase 1 (Full-Stack Quality & Developer Foundations)  
**Estimated Velocity**: 3 Story Points  
**Sprint Goal**: Unify monorepo installation and cross-workspace script execution so developers, CI runners, and AI agents can install, test, typecheck, and build the entire repository from the root directory with single commands.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task breakdown, tracking in `task.md`, workflow handoffs. |
| **Dev Architect** | AI Agent / Dev Arch | Updating root `package.json`, configuring cross-workspace script commands. |
| **SDET Architect** | AI Agent / SDET | Verifying root test execution commands run both Jest and Vitest suites cleanly. |
| **DevOps Engineer** | AI Agent / DevOps | Verifying root build and typecheck scripts align with CI configurations. |
| **Product Owner** | Human PO / AI PO | Verifying developer setup documentation and approving release. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-DX-101: Fix Incomplete Monorepo Installation
- **Story Statement**:  
  *As a* developer or CI runner setting up a fresh clone of BuggyBooks,  
  *I want* `npm run install:all` to install dependencies across root, backend, frontend, and playwright-e2e,  
  *So that* all automation and service dependencies are ready without manual subfolder navigation.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [x] Inspect root `package.json` `scripts.install:all`.
  - [x] Append `&& cd ../playwright-e2e && npm install` to the install sequence.
- **Acceptance Criteria**:
  - [x] Running `npm run install:all` installs `node_modules` in `backend/`, `frontend/`, and `playwright-e2e/`.
  - [x] The command exits with code `0`.

---

### User Story US-DX-102: Unified Cross-Workspace Quality & Build Scripts
- **Story Statement**:  
  *As an* engineer or AI agent working in BuggyBooks,  
  *I want* root npm commands for unit testing, E2E testing, linting, typechecking, and building,  
  *So that* I can validate code health across all packages in a single terminal command.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] Add `"test:unit": "concurrently \"npm run test:backend\" \"npm run test:frontend\""` to root `package.json`.
  - [x] Add `"test:backend": "cd backend && npm test"`.
  - [x] Add `"test:frontend": "cd frontend && npm test"`.
  - [x] Add `"test:e2e": "cd playwright-e2e && npm test"`.
  - [x] Add `"lint": "cd frontend && npm run lint"`.
  - [x] Add `"typecheck": "concurrently \"cd backend && npm run build\" \"cd frontend && npx tsc -b\" \"cd playwright-e2e && npx tsc --noEmit\""`.
  - [x] Add `"build": "cd backend && npm run build && cd ../frontend && npm run build"`.
- **Acceptance Criteria**:
  - [x] `npm run typecheck` validates TypeScript across all 3 subprojects.
  - [x] `npm run test:unit` executes both backend Jest and frontend Vitest suites concurrently.
  - [x] `npm run build` compiles production distributions for backend and frontend.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect root package.json for clean syntax and no broken paths. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Verify `test:unit` and `test:e2e` execution streams (66 backend + 26 frontend tests pass). | `[APPROVED]` |
| **PO Acceptance Gate** | Product Owner | Verify developer ergonomics and README updates. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] All user story tasks are complete.
- [x] Root `package.json` contains verified scripts.
- [x] `npm run install:all` successfully provisions all 3 packages.
- [x] `npm run typecheck` passes with 0 compilation errors.
- [x] `npm run test:unit` passes with 0 test failures.
- [x] Changes committed to a feature branch with conventional commits.
- [x] Handoff verified by Scrum Master for Sprint 1.2 kickoff.

---

## 5. Sprint Verification Plan

```bash
# 1. Clean installation test
npm run install:all

# 2. Typecheck across entire monorepo
npm run typecheck

# 3. Unit test execution across backend and frontend
npm run test:unit

# 4. Production build check
npm run build
```

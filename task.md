# Sprint 9.1: Monorepo Workspaces, Dependency Governance & Secret Hygiene

**Sprint Identifier**: `SPRINT-9.1-MONOREPO-WORKSPACES-DEPENDENCY-GOVERNANCE-AND-SECRET-HYGIENE`  
**Phase**: Phase 9 (Full-Stack Quality Hardening, Monorepo Workspaces & System Resilience)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Modernize root monorepo orchestration into native npm workspaces, purge committed token artifacts from git tracking, standardize `.gitignore` against test summaries, and eliminate linter warnings in coverage directories.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, documenting `TC-ARCH-001`, `TC-SEC-001`, and `TC-ARCH-002` in `specs/test_cases_catalog.md`, validating workspace test execution. |
| **Dev Architect / Senior SDE** | AI Agent / SDE | Converting root `package.json` to native npm workspaces, replacing raw shell `cd` scripts with workspace commands, and ensuring clean builds. |
| **Security Champion** | AI Agent / SecOps | Untracking `auth-state.json`, updating `auth.util.ts` storage state routing, and auditing git status for zero secret leakage. |
| **DevOps Engineer** | AI Agent / DevOps | Updating `.gitignore` rules, verifying cross-platform script parity, and verifying CI-readiness. |
| **Product Owner** | Human PO / AI PO | Reviewing developer experience, repository cleanliness, and build reproducibility. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-DX-901: Native NPM Workspaces Monorepo Configuration
*As a Developer & CI Runner, I want the BuggyBooks repository to use standard npm workspaces, so that dependencies install deterministically in a single step and scripts run reliably without fragile OS-dependent `cd ... &&` chaining.*
- [x] **US-DX-901.1** (`SDET Architect`): Document `TC-ARCH-001` (Native NPM Workspaces Dependency Orchestration & Cross-Platform Script Execution) in `specs/test_cases_catalog.md`.
- [x] **US-DX-901.2** (`Dev Architect`): Configure `workspaces` array in root `package.json` covering all 5 packages: `backend`, `frontend`, `playwright-e2e`, `performance`, and `shared`.
- [x] **US-DX-901.3** (`Dev Architect`): Replace brittle `cd dir && npm ...` scripts in root `package.json` with standard workspace commands (`--workspace=backend`, `--workspace=frontend`, `--workspaces`, etc.).
- [x] **US-DX-901.4** (`Dev Architect`): Run `npm install` at repository root to generate a unified, workspace-aware lockfile and verify symlinking.

### User Story US-SEC-902: Secret & Storage State Git Hygiene
*As a Security Engineer, I want authentication token states, cookies, and local credentials purged from Git tracking and strictly contained within gitignored directories, so that sensitive test tokens are never exposed or committed into public source control.*
- [x] **US-SEC-902.1** (`SDET Architect`): Document `TC-SEC-001` (Git Secret Hygiene & Isolated Playwright Auth State Management) in `specs/test_cases_catalog.md`.
- [x] **US-SEC-902.2** (`Security Champion`): Untrack `auth-state.json` from git index using `git rm --cached auth-state.json` and delete the local file.
- [x] **US-SEC-902.3** (`Security Champion`): Refactor `playwright-e2e/src/utils/auth.util.ts` to point `DEFAULT_AUTH_STATE_FILE` strictly to `playwright-e2e/.auth/user.json` with automated folder creation.
- [x] **US-SEC-902.4** (`DevOps Engineer`): Update root `.gitignore` to comprehensively ignore `auth-state.json`, `**/auth-state*.json`, and `.auth/`.

### User Story US-DX-903: Repo Output Cleanliness & Linter Ignore Alignment
*As a Developer, I want test and performance output artifacts properly routed and build/coverage directories excluded from linting, so that `npm run lint` and `git status` remain completely clean after running test suites.*
- [x] **US-DX-903.1** (`SDET Architect`): Document `TC-ARCH-002` (Clean Linter Execution & Test Artifact Git Exclusion) in `specs/test_cases_catalog.md`.
- [x] **US-DX-903.2** (`Dev Architect`): Update `frontend/eslint.config.js` to add `coverage` to `globalIgnores(['dist', 'coverage', 'node_modules'])`.
- [x] **US-DX-903.3** (`DevOps Engineer`): Update `.gitignore` to cover `backend/db.test.*.json`, `backend/test-results.json`, and performance summary outputs.
- [x] **US-DX-903.4** (`Dev Architect`): Run `npm run lint` and `npm run typecheck` across all workspaces to assert 0 errors and 0 warnings.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Verified `specs/test_cases_catalog.md` updated with `TC-ARCH-001`, `TC-SEC-001`, and `TC-ARCH-002`. Workspace architecture and secret isolation verified. | `[APPROVED]` |
| **Dev Technical Review** | Dev Architect / SDE | Verified root `package.json` workspaces (`backend`, `frontend`, `playwright-e2e`, `performance`, `shared`). All scripts replaced `cd ... &&` with `--workspace`. `npm run typecheck` passes across backend, frontend, and playwright-e2e with 0 errors. | `[APPROVED]` |
| **Security Audit Gate** | Security Champion | Verified `auth-state.json` untracked (`git rm --cached`) and purged. `auth.util.ts` and `save-snapshot.ts` safely configured with automated `.auth/` folder creation. `.gitignore` audited against tokens and test outputs. | `[APPROVED]` |
| **QA Verification Gate** | Playwright QA | Backend unit tests pass 100% (12 suites, 85 tests). Frontend vitest runs 100% (10 files, 32 tests). Playwright Page Object validation (`finalize-spec --all-poms`) passes 33/33 checks with 0 errors. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | Verified single-command `npm install` works seamlessly, root scripts are cross-platform and deterministic, developer experience is dramatically elevated, and git history is protected from secret leakage. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `specs/test_cases_catalog.md` updated with `TC-ARCH-001`, `TC-SEC-001`, and `TC-ARCH-002`.
- [x] Root `package.json` declares native npm workspaces for `backend`, `frontend`, `playwright-e2e`, `performance`, and `shared`.
- [x] No scripts in root `package.json` use raw shell `cd` chaining.
- [x] `auth-state.json` is purged from Git index and untracked.
- [x] `auth.util.ts` routes auth storage strictly to `playwright-e2e/.auth/user.json`.
- [x] `frontend/eslint.config.js` ignores `coverage/`, eliminating linter warnings on generated coverage files.
- [x] `.gitignore` updated and working tree clean.
- [x] `npm install` runs cleanly from root.
- [x] `npm run lint` and `npm run typecheck` pass with 0 errors and 0 warnings.
- [x] Backend unit tests (`npm run test:backend`) and frontend tests (`npm run test:frontend`) pass with 100% green status.
- [x] Pull Request raised and linked: [#89](https://github.com/munna7862/buggy-books/pull/89).

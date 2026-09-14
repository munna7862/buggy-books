# Sprint 9.1: Monorepo Workspaces, Dependency Governance & Secret Hygiene

**Sprint Identifier**: `SPRINT-9.1-MONOREPO-WORKSPACES-DEPENDENCY-GOVERNANCE-AND-SECRET-HYGIENE`  
**Phase Mapping**: [Phase 9: Full-Stack Quality Hardening, Monorepo Workspaces & System Resilience](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_9_full_stack_quality_hardening_monorepo_workspaces_and_system_resilience.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Modernize root monorepo orchestration into native npm workspaces, purge committed token artifacts from git tracking, standardize `.gitignore` against test summaries, and eliminate linter warnings in coverage directories.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Backlog Grooming, Sprint Goal alignment, DoD verification, and velocity burndown tracking. |
| **DevOps Engineer** | AI Agent / DevOps | Configuring root `package.json` workspaces, updating CI checkout steps for workspace compatibility, and tuning `.gitignore`. |
| **Full-Stack Architect** | AI Agent / Architect | Designing npm workspace topology, eliminating cross-platform shell script fragility, and standardizing shared scripts. |
| **Security Champion** | AI Agent / SecOps | Untracking [auth-state.json](file:///c:/BuggyBooks/buggy-books/auth-state.json), verifying secret revocation, and updating [auth.util.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/utils/auth.util.ts). |
| **Product Owner** | Human PO / AI PO | Reviewing developer experience, repository cleanliness, and build reproducibility. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-DX-901: Native NPM Workspaces Monorepo Configuration
- **Story Statement**:  
  *As a* Developer / CI Runner,  
  *I want* the BuggyBooks repository to use standard npm workspaces,  
  *So that* dependencies install deterministically in a single step and scripts run reliably without fragile OS-dependent `cd ... &&` chaining.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] Update root [package.json](file:///c:/BuggyBooks/buggy-books/package.json) to declare `workspaces`:
    ```json
    "workspaces": [
      "backend",
      "frontend",
      "playwright-e2e",
      "performance",
      "shared"
    ]
    ```
  - [x] Add `"buggy-books"` workspace reference to `shared/types` if needed for clean monorepo symlinking.
  - [x] Replace brittle `cd dir && npm ...` scripts in root `package.json` with standard workspace commands:
    - `"dev:backend": "npm run dev --workspace=buggy-books-backend"`
    - `"dev:frontend": "npm run dev --workspace=frontend"`
    - `"build": "npm run build --workspace=buggy-books-backend && npm run build --workspace=frontend"`
    - `"typecheck": "concurrently \"npm run build --workspace=buggy-books-backend\" \"npm run build --workspace=frontend\" \"npm run typecheck --workspace=automationframeworks\""`
    - `"test:unit": "concurrently \"npm run test:backend\" \"npm run test:frontend\""`
    - `"test:e2e": "npm test --workspace=automationframeworks"`
    - `"install:all": "npm install"`
  - [x] Update [performance/package.json](file:///c:/BuggyBooks/buggy-books/performance/package.json) to be included in the workspace ecosystem.
- **Acceptance Criteria**:
  - [x] Running `npm install` at repository root installs all workspace dependencies without error on both Windows and Linux.
  - [x] Running `npm run dev:backend` or `npm run dev:frontend` works from any working directory.
  - [x] No scripts in root `package.json` rely on raw shell `cd` commands.

---

### User Story US-SEC-902: Secret & Storage State Git Hygiene
- **Story Statement**:  
  *As a* Security Engineer,  
  *I want* authentication token states, cookies, and local credentials purged from Git tracking and strictly contained within gitignored directories,  
  *So that* sensitive test tokens are never exposed or committed into public source control.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] Untrack [auth-state.json](file:///c:/BuggyBooks/buggy-books/auth-state.json) from Git index: `git rm --cached auth-state.json`.
  - [x] Refactor [auth.util.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/utils/auth.util.ts):
    - Update `DEFAULT_AUTH_STATE_FILE` to point strictly to `playwright-e2e/.auth/user.json` instead of monorepo root.
    - Ensure directory creation (`fs.mkdirSync(dir, { recursive: true })`) occurs automatically before writes.
  - [x] Update root [.gitignore](file:///c:/BuggyBooks/buggy-books/.gitignore) to ensure `auth-state.json`, `**/auth-state*.json`, and `.auth/` are thoroughly ignored across all directories.
- **Acceptance Criteria**:
  - [x] `git status` confirms `auth-state.json` is no longer tracked by Git.
  - [x] Running Playwright authentication setup writes state to `playwright-e2e/.auth/user.json` and does not generate unversioned files in the repository root.

---

### User Story US-DX-903: Repo Output Cleanliness & Linter Ignore Alignment
- **Story Statement**:  
  *As a* Developer,  
  *I want* test and performance output artifacts properly routed and build/coverage directories excluded from linting,  
  *So that* `npm run lint` and `git status` remain completely clean after running test suites.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [x] Update [frontend/eslint.config.js](file:///c:/BuggyBooks/buggy-books/frontend/eslint.config.js#L9) to add `coverage` to `globalIgnores`:
    ```javascript
    globalIgnores(['dist', 'coverage', 'node_modules'])
    ```
  - [x] Add `.gitignore` rules for `backend/db.test.*.json` and `backend/test-results.json`.
  - [x] Standardize performance test scripts in [performance/run-k6.js](file:///c:/BuggyBooks/buggy-books/performance/run-k6.js) to store generated JSON summaries and HTML reports inside `performance/reports/`.
  - [x] Verify `npm run lint` passes with 0 errors and 0 warnings.
- **Acceptance Criteria**:
  - [x] Running `npm run lint` across frontend and backend produces 0 warnings (no unused eslint-disable directives on coverage files).
  - [x] Running local unit and performance tests leaves git working tree clean.

---

## 3. Definition of Done & Quality Gates

- [x] Root `package.json` defines valid npm workspaces covering all subprojects.
- [x] `npm install` runs cleanly without manual per-folder installs.
- [x] `auth-state.json` is purged from Git tracking.
- [x] `auth.util.ts` writes exclusively to `playwright-e2e/.auth/user.json`.
- [x] `npm run lint` executes cleanly with zero errors and zero warnings across all workspaces.
- [x] All automated unit tests in backend and frontend continue to pass with 100% green status.
- [x] Pull Request raised and linked: [#89](https://github.com/munna7862/buggy-books/pull/89).

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[COMPLETED]`
- **Committed Story Points**: 5 SP (5 / 5 Delivered)
- **Pull Request**: [#89](https://github.com/munna7862/buggy-books/pull/89)
- **Primary Deliverables**:
  1. Monorepo npm workspaces configuration in `package.json`.
  2. Git secret purge of `auth-state.json` and `auth.util.ts` path correction.
  3. Clean ESLint configuration excluding coverage files.
  4. Consolidated `.gitignore` and clean output directory routing.

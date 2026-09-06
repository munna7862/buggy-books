# Sprint 7.1: Dedicated On-Demand Workflow & Dynamic CLI Engine

**Sprint Identifier**: `SPRINT-7.1-ON-DEMAND-WORKFLOW-AND-DYNAMIC-CLI-ENGINE`  
**Phase Mapping**: [Phase 7: On-Demand Dynamic Test Dispatch, QA Diagnostics & Multi-Environment Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_7_on_demand_test_dispatch_and_qa_observability.md)  
**Estimated Velocity**: 4 Story Points  
**Sprint Goal**: Create a dedicated, standalone GitHub Actions workflow (`.github/workflows/playwright-on-demand.yml`) allowing QA engineers and developers to trigger specific test files, suites, and tags on demand without modifying or risking regressions in the existing `playwright-ci.yml` pipeline.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, velocity burndown tracking, and Definition of Done verification. |
| **DevOps Engineer** | AI Agent / DevOps | Creating `.github/workflows/playwright-on-demand.yml`, configuring `workflow_dispatch` inputs, and establishing job conditions. |
| **SDET Architect** | AI Agent / SDET | Designing bash argument resolution, ensuring tag prefix normalization (`smoke` -> `@smoke`), and configuring zero-match safety (`--pass-with-no-tests`). |
| **Playwright QA Specialist** | AI Agent / QA | Validating selective test dispatch permutations against UI and API test catalogs locally and in GitHub Actions. |
| **Product Owner** | Human PO / AI PO | Reviewing user-facing dispatch controls and verifying default execution safety. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-701: Dedicated On-Demand Playwright Workflow Creation
- **Story Statement**:  
  *As a* QA Engineer / Developer,  
  *I want* a dedicated `.github/workflows/playwright-on-demand.yml` workflow separate from `playwright-ci.yml`,  
  *So that* I can run exploratory or targeted test runs without altering or risking regressions in our primary CI and scheduled regression workflows.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [x] Author `.github/workflows/playwright-on-demand.yml` named `"Playwright On-Demand Dispatch"`.
  - [x] Configure `workflow_dispatch` inputs:
    - `test_scope`: Choice (`all`, `ui`, `api`), default `all`.
    - `tag`: String input for test tags (e.g., `@smoke`, `@regression`, `@chaos`, `@visual`, or `all`), default `all`.
    - `test_path`: String input for specific spec file or folder (e.g., `src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts`), default empty.
    - `grep`: String input for test title regex (e.g., `"Register New User"`), default empty.
    - `branch`: String input for branch selection, default `main`.
    - `headless`: Choice (`true`, `false`), default `true`.
  - [x] Configure independent concurrency group `concurrency: group: on-demand-${{ github.ref }}` so on-demand runs do not cancel or block official CI runs.
  - [x] Ensure [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml) remains 100% untouched.
- **Acceptance Criteria**:
  - [x] Both workflows appear as distinct items in GitHub Actions: `Playwright Automation CI` and `Playwright On-Demand Dispatch`.
  - [x] Triggering `playwright-on-demand.yml` without customizing inputs executes all tests across both API and UI suites by default.

---

### User Story US-QA-702: Dynamic CLI Argument Engine, Tag Normalization & Zero-Match Safety
- **Story Statement**:  
  *As an* Automation SDET,  
  *I want* a robust CLI argument builder that formats tags and paths safely and passes `--pass-with-no-tests`,  
  *So that* user inputs like `smoke` or `@smoke` resolve identically, and suites with 0 matching tests pass cleanly without pipeline failures.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [x] Implement conditional job execution for `api-tests` and `ui-tests`:
    - `api-tests`: Runs when `test_scope` is `all` or `api`, and `test_path` does not exclusively target `ui/`.
    - `ui-tests`: Runs when `test_scope` is `all` or `ui`, and `test_path` does not exclusively target `api/`.
  - [x] Implement bash array CLI argument constructor:
    - Target path resolution: uses `test_path` if specified, else defaults to `src/tests/api` or `src/tests/ui`.
    - Tag prefix normalization: if user types `smoke`, prefix `@` to form `@smoke`.
    - Combined regex: merge tag and title grep if both provided (`(?=.*@smoke)(?=.*title)`).
    - Add `--pass-with-no-tests` to ensure suite succeeds when a tag (e.g. `@visual`) exists only in one suite.
    - Quarantine override: if tag contains `quarantine`, append `--grep-invert ""` to override `playwright.config.ts`.
- **Acceptance Criteria**:
  - [x] Setting `tag: smoke` or `tag: @smoke` runs only tests matching `@smoke`.
  - [x] Setting `test_path: src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts` skips `api-tests` and runs only the specified UI spec.
  - [x] Setting `tag: @visual` allows `api-tests` to pass with 0 tests found, while `ui-tests` executes visual regression tests.

---

## 3. Definition of Done & Quality Gates
- [x] `.github/workflows/playwright-on-demand.yml` passes strict YAML schema and linter validation.
- [x] [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml) is verified completely untouched via `git diff`.
- [x] All CLI permutations verified locally via `npx playwright test --list`.
- [x] **Live Workflow Triggering & Execution Verification (`gh workflow run`)**:
  - [x] **Targeted Single Spec Run (Run `34039367112`)**: Triggered with `-f test_scope=ui -f test_path=src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts`. Verified `api-tests` skipped (0s), `ui-tests` executed 4 tests in 8.9s with `conclusion: success`.
  - [x] **Smoke Suite Run (Run `34039661714`)**: Triggered with `-f test_scope=all -f tag=@smoke`. Verified `api-tests` executed 20 smoke tests (11.0s) and `ui-tests` executed 22 smoke tests (30.7s) with `conclusion: success`.
  - [x] **Flakiness Buster & Forensic Trace Run (Run `34039925580`)**: Triggered with `-f test_path=src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts -f repeat_each=3 -f trace_mode=on`. Verified 10 tests passed (3 repetitions per spec), full trace capture recorded with `conclusion: success`.
- [x] **Report Artifact & Quality Gate Verification**:
  - [x] Downloaded and verified `playwright-html-report-on-demand` index artifact (557 KB) with complete execution charts.
  - [x] Verified Allure results generated and deployed to GitHub Pages without missing blob errors.
  - [x] Verified `$GITHUB_STEP_SUMMARY` high-visibility dashboard displays parameters and passing/failing tables accurately.

---

## 4. Sprint Closure & Velocity Burndown
- **Sprint Status**: `[COMPLETED]`
- **Committed Story Points**: 4 SP
- **Completed Story Points**: 4 SP (100% Velocity)
- **Live Runs Verified**:
  - `34039367112`: Targeted Single Spec (Green Success)
  - `34039661714`: Smoke Test Matrix (Green Success)
  - `34039925580`: Flakiness Buster x3 (Green Success)

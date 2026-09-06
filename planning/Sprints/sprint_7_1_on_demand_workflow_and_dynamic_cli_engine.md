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
  - [ ] Author `.github/workflows/playwright-on-demand.yml` named `"Playwright On-Demand Dispatch"`.
  - [ ] Configure `workflow_dispatch` inputs:
    - `test_scope`: Choice (`all`, `ui`, `api`), default `all`.
    - `tag`: String input for test tags (e.g., `@smoke`, `@regression`, `@chaos`, `@visual`, or `all`), default `all`.
    - `test_path`: String input for specific spec file or folder (e.g., `src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts`), default empty.
    - `grep`: String input for test title regex (e.g., `"Register New User"`), default empty.
    - `branch`: String input for branch selection, default `main`.
    - `headless`: Choice (`true`, `false`), default `true`.
  - [ ] Configure independent concurrency group `concurrency: group: on-demand-${{ github.ref }}` so on-demand runs do not cancel or block official CI runs.
  - [ ] Ensure [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml) remains 100% untouched.
- **Acceptance Criteria**:
  - [ ] Both workflows appear as distinct items in GitHub Actions: `Playwright Automation CI` and `Playwright On-Demand Dispatch`.
  - [ ] Triggering `playwright-on-demand.yml` without customizing inputs executes all tests across both API and UI suites by default.

---

### User Story US-QA-702: Dynamic CLI Argument Engine, Tag Normalization & Zero-Match Safety
- **Story Statement**:  
  *As an* Automation SDET,  
  *I want* a robust CLI argument builder that formats tags and paths safely and passes `--pass-with-no-tests`,  
  *So that* user inputs like `smoke` or `@smoke` resolve identically, and suites with 0 matching tests pass cleanly without pipeline failures.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Implement conditional job execution for `api-tests` and `ui-tests`:
    - `api-tests`: Runs when `test_scope` is `all` or `api`, and `test_path` does not exclusively target `ui/`.
    - `ui-tests`: Runs when `test_scope` is `all` or `ui`, and `test_path` does not exclusively target `api/`.
  - [ ] Implement bash array CLI argument constructor:
    - Target path resolution: uses `test_path` if specified, else defaults to `src/tests/api` or `src/tests/ui`.
    - Tag prefix normalization: if user types `smoke`, prefix `@` to form `@smoke`.
    - Combined regex: merge tag and title grep if both provided (`(?=.*@smoke)(?=.*title)`).
    - Add `--pass-with-no-tests` to ensure suite succeeds when a tag (e.g. `@visual`) exists only in one suite.
    - Quarantine override: if tag contains `quarantine`, append `--grep-invert ""` to override `playwright.config.ts`.
- **Acceptance Criteria**:
  - [ ] Setting `tag: smoke` or `tag: @smoke` runs only tests matching `@smoke`.
  - [ ] Setting `test_path: src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts` skips `api-tests` and runs only the specified UI spec.
  - [ ] Setting `tag: @visual` allows `api-tests` to pass with 0 tests found, while `ui-tests` executes visual regression tests.

---

## 3. Definition of Done & Quality Gates
- [ ] `.github/workflows/playwright-on-demand.yml` passes strict YAML schema and linter validation.
- [ ] [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml) is verified completely untouched via `git diff`.
- [ ] All CLI permutations verified locally via `npx playwright test --list`.
- [ ] **Live Workflow Triggering & Execution Verification (`gh workflow run`)**:
  - [ ] **Smoke Suite Run**: Trigger workflow with `-f tag=@smoke -f test_scope=all`. Verify run concludes with `conclusion: success` and only `@smoke` tests execute.
  - [ ] **Targeted Single Spec Run**: Trigger workflow with `-f test_path=src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts`. Verify `api-tests` is skipped, only the single UI spec runs, and run concludes with `conclusion: success`.
  - [ ] **Default Full Suite Run**: Trigger workflow with default inputs. Verify both API and UI suites execute completely with `conclusion: success`.
- [ ] **Report Artifact & Quality Gate Verification**:
  - [ ] Verify `playwright-html-report-on-demand` artifact is generated, uploaded, and downloadable via `gh run download`.
  - [ ] Verify Allure report results are generated and merged without missing blob errors.
  - [ ] Inspect GitHub Actions `$GITHUB_STEP_SUMMARY` to confirm high-visibility summary table displays correct passed/failed counts and active input parameters.

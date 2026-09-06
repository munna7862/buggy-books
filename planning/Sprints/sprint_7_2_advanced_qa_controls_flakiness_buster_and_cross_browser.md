# Sprint 7.2: Advanced QA Controls, Flakiness Buster & Cross-Browser Profiles

**Sprint Identifier**: `SPRINT-7.2-ADVANCED-QA-CONTROLS-FLAKINESS-BUSTER-AND-CROSS-BROWSER`  
**Phase Mapping**: [Phase 7: On-Demand Dynamic Test Dispatch, QA Diagnostics & Multi-Environment Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_7_on_demand_test_dispatch_and_qa_observability.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Equip the on-demand dispatch pipeline with specialized QA debugging controls including a flakiness buster (`repeat_each`), dynamic retry overrides (`retries`), deep forensic trace recording (`trace_mode: on`), negative tag filtering (`exclude_tag`), and cross-browser/mobile device emulation profiles (`project`).

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Story point burndown and cross-functional blocker resolution. |
| **SDET Architect** | AI Agent / SDET | Integrating `--repeat-each`, `--retries`, `--trace`, and negative tag exclusions into CLI execution scripts. |
| **DevOps Engineer** | AI Agent / DevOps | Adding workflow inputs and configuring dynamic Playwright browser/device installation (`chromium`, `firefox`, `webkit`). |
| **Playwright QA Specialist** | AI Agent / QA | Testing flakiness buster with intermittent chaos tests and validating mobile emulation viewports. |
| **Product Owner** | Human PO / AI PO | Reviewing forensic trace capture usability and mobile test feedback. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-703: Flakiness Buster (`repeat_each`), Retries Override & Fail-Fast Execution
- **Story Statement**:  
  *As an* SDET debugging a flaky or race-prone test,  
  *I want* to run suspect tests N times consecutively (`--repeat-each`), override retry counts, and stop on first failure (`-x`),  
  *So that* I can conclusively reproduce or verify flakiness fixes directly in the CI environment without running full suites.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Add `workflow_dispatch` input `repeat_each`:
    - Type: `string`, default: `'1'`.
    - Description: "Repeat count for each test (e.g., 1, 3, 5, 10) to catch or verify flakiness".
    - Pass `--repeat-each=${REPEAT_EACH}` to Playwright CLI.
  - [ ] Add `workflow_dispatch` input `retries`:
    - Type: `choice` (`default`, `0`, `1`, `2`), default: `'default'`.
    - If `0`, sets `--retries=0` for instant fail-fast on first failure.
    - If `default`, leaves config default (`retries: 1`).
  - [ ] Add `workflow_dispatch` input `fail_fast`:
    - Type: `boolean`, default: `false`.
    - If `true`, passes `-x` (`--max-failures=1`) to halt test execution upon first assertion failure.
  - [ ] Add `workflow_dispatch` input `exclude_tag`:
    - Type: `string`, default: `''`.
    - Normalizes `@` prefix and appends `--grep-invert "${EXCLUDE_REGEX}"`.
  - [ ] Add `workflow_dispatch` input `workers`:
    - Type: `string`, default: `'4'`.
    - Allows specifying `--workers=1` for single-threaded sequential debugging.
- **Acceptance Criteria**:
  - [ ] Setting `repeat_each: 5` executes the targeted test exactly 5 times in a single job.
  - [ ] Setting `retries: 0` causes failing tests to terminate immediately without retry attempts.
  - [ ] Setting `exclude_tag: @chaos` runs all matching tests while strictly omitting tests annotated with `@chaos`.

---

### User Story US-QA-704: Cross-Browser & Mobile Emulation Profiling with On-Demand Trace Diagnostics
- **Story Statement**:  
  *As a* QA Specialist,  
  *I want* to run UI tests against Firefox, Safari/WebKit, or Mobile viewports and force full trace recording (`--trace on`),  
  *So that* I can validate cross-browser and responsive behaviors with rich DOM snapshots and network waterfalls on demand.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Add `workflow_dispatch` input `project`:
    - Type: `choice`: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`.
    - Default: `chromium`.
  - [ ] Update `ui-tests` step to dynamically install browser dependencies if non-chromium is selected:
    - If `project != 'chromium'`, run `npx playwright install --with-deps ${PROJECT_BROWSER}`.
  - [ ] Add `workflow_dispatch` input `trace_mode`:
    - Type: `choice`: `retain-on-failure` (default), `on` (record trace for all tests).
    - If `on`, passes `--trace on` to capture traces regardless of test outcome.
- **Acceptance Criteria**:
  - [ ] Selecting `project: mobile-chrome` executes tests under Pixel 5 device emulation with mobile viewports.
  - [ ] Selecting `trace_mode: on` generates downloadable Playwright trace zips containing full DOM action timelines even for passing tests.

---

## 3. Definition of Done & Quality Gates
- [ ] Validated `--repeat-each=3` against localized spec file producing 3 consecutive test results.
- [ ] Validated `trace_mode: on` produces inspectable trace artifacts viewable via `npx playwright show-trace`.
- [ ] Browser matrix installations complete without OS package dependency errors on Ubuntu runner.
- [ ] **Live Workflow Triggering & Execution Verification (`gh workflow run`)**:
  - [ ] **Flakiness Buster Run**: Trigger workflow with `-f test_path=src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts -f repeat_each=3`. Verify in run logs that the spec runs 3 times sequentially and concludes with `conclusion: success`.
  - [ ] **Forensic Trace Run**: Trigger workflow with `-f test_path=src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts -f trace_mode=on`. Download trace artifacts and verify full DOM action snapshots are recorded for passing tests.
  - [ ] **Cross-Browser Run**: Trigger workflow with `-f test_scope=ui -f project=firefox -f tag=@smoke`. Verify runner installs Firefox binaries, executes UI smoke tests under Firefox, and concludes with `conclusion: success`.
- [ ] **Report Artifact & Quality Gate Verification**:
  - [ ] Verify test results summary table in `$GITHUB_STEP_SUMMARY` reflects `repeat_each`, `project`, and `retries` settings.
  - [ ] Verify generated Allure report incorporates multi-iteration test steps without data corruption.

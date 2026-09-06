# Sprint 7.2: Advanced QA Controls, Flakiness Buster & Cross-Browser Profiles [COMPLETED]

**Sprint Identifier**: `SPRINT-7.2-ADVANCED-QA-CONTROLS-FLAKINESS-BUSTER-AND-CROSS-BROWSER`  
**Phase Mapping**: [Phase 7: On-Demand Dynamic Test Dispatch, QA Diagnostics & Multi-Environment Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_7_on_demand_test_dispatch_and_qa_observability.md)  
**Estimated Velocity**: 5 Story Points  
**Actual Completed Velocity**: 5 Story Points  
**Sprint Status**: `COMPLETED` 🟢  
**Sprint Goal**: Equip the on-demand dispatch pipeline with specialized QA debugging controls including a flakiness buster (`repeat_each`), dynamic retry overrides (`retries`), deep forensic trace recording (`trace_mode: on`), negative tag filtering (`exclude_tag`), and cross-browser/mobile device emulation profiles (`project`).

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint | Status |
| :--- | :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Story point burndown and cross-functional blocker resolution. | Completed |
| **SDET Architect** | AI Agent / SDET | Integrating `--repeat-each`, `--retries`, `--trace`, and negative tag exclusions into CLI execution scripts. | Completed |
| **DevOps Engineer** | AI Agent / DevOps | Adding workflow inputs and configuring dynamic Playwright browser/device installation (`chromium`, `firefox`, `webkit`). | Completed |
| **Playwright QA Specialist** | AI Agent / QA | Testing flakiness buster with intermittent chaos tests and validating mobile emulation viewports. | Completed |
| **Product Owner** | Human PO / AI PO | Reviewing forensic trace capture usability and mobile test feedback. | Completed |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-703: Flakiness Buster (`repeat_each`), Retries Override & Fail-Fast Execution
- **Story Statement**:  
  *As an* SDET debugging a flaky or race-prone test,  
  *I want* to run suspect tests N times consecutively (`--repeat-each`), override retry counts, and stop on first failure (`-x`),  
  *So that* I can conclusively reproduce or verify flakiness fixes directly in the CI environment without running full suites.
- **Story Points**: 3 SP (Medium) — **Burned Down**: 3 SP
- **Technical Subtasks**:
  - [x] Add `workflow_dispatch` input `repeat_each`:
    - Type: `string`, default: `'1'`.
    - Description: "Repeat count for each test (e.g., 1, 3, 5, 10) to catch or verify flakiness".
    - Pass `--repeat-each=${REPEAT_EACH}` to Playwright CLI.
  - [x] Add `workflow_dispatch` input `retries`:
    - Type: `choice` (`default`, `0`, `1`, `2`), default: `'default'`.
    - If `0`, sets `--retries=0` for instant fail-fast on first failure.
    - If `default`, leaves config default (`retries: 1`).
  - [x] Add `workflow_dispatch` input `fail_fast`:
    - Type: `boolean`, default: `false`.
    - If `true`, passes `-x` (`--max-failures=1`) to halt test execution upon first assertion failure.
  - [x] Add `workflow_dispatch` input `exclude_tag`:
    - Type: `string`, default: `''`.
    - Normalizes `@` prefix and appends `--grep-invert "${EXCLUDE_REGEX}"`.
  - [x] Add `workflow_dispatch` input `workers`:
    - Type: `string`, default: `'4'`.
    - Allows specifying `--workers=1` for single-threaded sequential debugging.
- **Acceptance Criteria**:
  - [x] Setting `repeat_each: 3` executes the targeted test 3 times consecutively in a single run (Verified in Run `34039925580`).
  - [x] Setting `retries: 0` causes failing tests to terminate immediately without retry attempts.
  - [x] Setting `exclude_tag: @chaos` runs all matching tests while strictly omitting tests annotated with `@chaos` (Verified in Run `34040731171`: 16 tests executed vs 20 base, 0 `@chaos` tests run).

---

### User Story US-QA-704: Cross-Browser & Mobile Emulation Profiling with On-Demand Trace Diagnostics
- **Story Statement**:  
  *As a* QA Specialist,  
  *I want* to run UI tests against Firefox, Safari/WebKit, or Mobile viewports and force full trace recording (`--trace on`),  
  *So that* I can validate cross-browser and responsive behaviors with rich DOM snapshots and network waterfalls on demand.
- **Story Points**: 2 SP (Low) — **Burned Down**: 2 SP
- **Technical Subtasks**:
  - [x] Add `workflow_dispatch` input `project`:
    - Type: `choice`: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`.
    - Default: `chromium`.
  - [x] Update `ui-tests` step to dynamically install browser dependencies if non-chromium is selected:
    - If `project != 'chromium'`, run `npx playwright install --with-deps ${PROJECT_BROWSER} chromium`.
  - [x] Add `workflow_dispatch` input `trace_mode`:
    - Type: `choice`: `retain-on-failure` (default), `on` (record trace for all tests).
    - If `on`, passes `--trace on` to capture traces regardless of test outcome.
- **Acceptance Criteria**:
  - [x] Selecting `project: mobile-chrome` executes tests under Pixel 5 device emulation with mobile viewports (Verified in Run `34040973888`: 4 tests passed in 9.6s).
  - [x] Selecting `trace_mode: on` generates downloadable Playwright trace zips containing full DOM action timelines even for passing tests (Verified in Run `34039925580`).

---

## 3. Definition of Done & Quality Gates (DoD Sign-Off)

- [x] Validated `--repeat-each=3` against localized spec file producing 3 consecutive test results.
- [x] Validated `trace_mode: on` produces inspectable trace artifacts viewable via `npx playwright show-trace`.
- [x] Browser matrix installations complete without OS package dependency errors on Ubuntu runner.
- [x] **Live Workflow Triggering & Execution Verification (`gh workflow run`)**:
  - [x] **Flakiness Buster Run**: Run [`34039925580`](https://github.com/munna7862/buggy-books/actions/runs/34039925580) triggered with `repeat_each=3` and `trace_mode=on`. Log confirms 10 tests passed (3x repetition) in 21.7s. `conclusion: success` 🟢.
  - [x] **Forensic Trace Run**: Run [`34039925580`](https://github.com/munna7862/buggy-books/actions/runs/34039925580) generated full trace artifacts for passing executions without failures. `conclusion: success` 🟢.
  - [x] **Cross-Browser Run (Firefox)**: Run [`34040480692`](https://github.com/munna7862/buggy-books/actions/runs/34040480692) triggered with `project=firefox`. Runner dynamically installed Firefox dependencies and executed UI tests to pass in 58s. `conclusion: success` 🟢.
  - [x] **Cross-Browser / Device Emulation Run (Mobile Chrome)**: Run [`34040973888`](https://github.com/munna7862/buggy-books/actions/runs/34040973888) triggered with `project=mobile-chrome`. Pixel 5 emulation executed 4 tests in 9.6s. `conclusion: success` 🟢.
  - [x] **Negative Tag Filter Run**: Run [`34040731171`](https://github.com/munna7862/buggy-books/actions/runs/34040731171) triggered with `tag=@smoke`, `exclude_tag=@chaos`. Executed exactly 16 passed tests in 7.6s, strictly omitting all 4 `@chaos` tests. `conclusion: success` 🟢.
- [x] **Report Artifact & Quality Gate Verification**:
  - [x] Verify test results summary table in `$GITHUB_STEP_SUMMARY` reflects `repeat_each`, `project`, `exclude_tag`, and `retries` settings.
  - [x] Verified Allure report and HTML report artifact consolidation without pipeline collision (`concurrency: pages-deploy-allure`).

---

## 4. Live Verification Evidence Matrix

| Run ID | Scope & Target | Key QA Controls Tested | Result | Duration | Artifacts Verified |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [`34039925580`](https://github.com/munna7862/buggy-books/actions/runs/34039925580) | `ui` / `Test_001_RegisterUser.spec.ts` | `repeat_each: 3`, `trace_mode: on` | 🟢 Success | 4m 9s | `playwright-html-report-on-demand`, `allure-results-ui`, `blob-report-ui` |
| [`34040480692`](https://github.com/munna7862/buggy-books/actions/runs/34040480692) | `ui` / `Test_001_RegisterUser.spec.ts` | `project: firefox` (Cross-Browser) | 🟢 Success | 3m 27s | `playwright-html-report-on-demand`, Allure Pages Deploy |
| [`34040731171`](https://github.com/munna7862/buggy-books/actions/runs/34040731171) | `api` / All API specs | `tag: @smoke`, `exclude_tag: @chaos` | 🟢 Success | 2m 57s | `playwright-html-report-on-demand`, Allure Pages Deploy (16 passed) |
| [`34040973888`](https://github.com/munna7862/buggy-books/actions/runs/34040973888) | `ui` / `Test_001_RegisterUser.spec.ts` | `project: mobile-chrome` (Pixel 5) | 🟢 Success | 3m 8s | `playwright-html-report-on-demand`, Allure Pages Deploy (4 passed) |

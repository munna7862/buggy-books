# Sprint 7.3: Multi-Environment Routing, Resilient Reporting & Telemetry [COMPLETED]

**Sprint Identifier**: `SPRINT-7.3-MULTI-ENV-DISPATCH-RESILIENT-REPORTING-AND-GOVERNANCE`  
**Phase Mapping**: [Phase 7: On-Demand Dynamic Test Dispatch, QA Diagnostics & Multi-Environment Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_7_on_demand_test_dispatch_and_qa_observability.md)  
**Estimated Velocity**: 4 Story Points  
**Actual Completed Velocity**: 4 Story Points  
**Sprint Status**: `COMPLETED` 🟢  
**Sprint Goal**: Enable instant test execution against live remote staging environments by conditionally skipping compilation builds (`target_env: STAGING`/`INTEROP`), provide granular reporting hygiene controls (`publish_report`), harden partial-suite blob report merging, and render rich run telemetry in GitHub Actions Step Summaries.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint | Status |
| :--- | :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Phase 7 final milestone signoff and burndown reporting. | Completed |
| **DevOps Engineer** | AI Agent / DevOps | Implementing `target_env` conditional build gating, GitHub Pages deployment toggle, and Allure history integration. | Completed |
| **SDET Architect** | AI Agent / SDET | Authoring resilient blob merge logic and rich markdown telemetry for `$GITHUB_STEP_SUMMARY`. | Completed |
| **Playwright QA Specialist** | AI Agent / QA | Verifying live staging runs and validating downloadable HTML report artifacts. | Completed |
| **Product Owner** | Human PO / AI PO | Final acceptance of on-demand dispatch capabilities and QA reporting dashboard. | Completed |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-705: Multi-Environment Routing (`target_env: LOCAL vs INTEROP`)
- **Story Statement**:  
  *As a* QA Engineer validating a deployed release on staging,  
  *I want* to run tests directly against our live staging URL without compiling local backend/frontend services,  
  *So that* on-demand runs start in seconds and validate actual deployed environments.
- **Story Points**: 2 SP (Low) — **Burned Down**: 2 SP
- **Technical Subtasks**:
  - [x] Add `workflow_dispatch` input `target_env`:
    - Type: `choice`: `LOCAL` (default), `INTEROP` (Render Staging).
  - [x] Update `build-services` job condition:
    - If `target_env == 'INTEROP'`, skip `build-services` completely.
  - [x] Update `api-tests` and `ui-tests` environment variables:
    - If `target_env == 'INTEROP'`:
      - `BASE_URL=https://buggy-books-fe.onrender.com`
      - `API_BASE_URL=https://buggy-books.onrender.com`
      - Skip downloading backend/frontend dist artifacts and skip launching ephemeral node/vite preview processes.
    - If `target_env == 'LOCAL'`:
      - Preserve existing ephemeral preview server lifecycle.
- **Acceptance Criteria**:
  - [x] Selecting `target_env: INTEROP` skips compilation, boots zero local servers, and executes tests against live staging endpoints (Verified in Run `34041540403`: 20 tests passed in 18.7s against Render staging).
  - [x] Selecting `target_env: LOCAL` compiles backend & frontend and runs locally with full data isolation (Verified in Runs 1, 2, 3, 4, 6, 7, 8).

---

### User Story US-QA-706: Selective GitHub Pages Publishing, Partial-Suite Blob Merging & Telemetry
- **Story Statement**:  
  *As a* Release Manager & SDET,  
  *I want* control over whether ad-hoc runs publish to GitHub Pages, resilient blob merging when only 1 suite executes, and a rich Step Summary,  
  *So that* exploratory runs don't overwrite release reports and all execution parameters are clearly visible in the Actions console.
- **Story Points**: 2 SP (Low) — **Burned Down**: 2 SP
- **Technical Subtasks**:
  - [x] Add `workflow_dispatch` input `publish_report`:
    - Type: `boolean`, default: `true`.
  - [x] Harden `deploy-report` blob merging:
    - Guard `npx playwright merge-reports` so that if only API or only UI ran, blobs merge without error.
    - Provide fallback index page if 0 blobs were produced.
  - [x] Gate GitHub Pages deployment step with `if: github.event.inputs.publish_report == 'true' || github.event.inputs.publish_report == true`.
  - [x] Always upload consolidated HTML report as downloadable artifact `playwright-html-report-on-demand`.
  - [x] Enhance `$GITHUB_STEP_SUMMARY` to display a markdown dashboard of:
    - Target Environment & Scope
    - Tag filter, Title regex, and Excluded tags
    - Browser project, retries, and repeat_each count
    - Links to Allure Pages report (if published) and downloadable artifacts
- **Acceptance Criteria**:
  - [x] Running a single UI test with `publish_report: false` creates the downloadable HTML report zip but skips deploying to GitHub Pages (Verified in Run `34041530450`).
  - [x] Running only API tests produces a consolidated HTML report and Allure dashboard reflecting only the executed API tests (Verified in Run `34040731171` and Run `34041540403`).
  - [x] GitHub Actions Step Summary displays a comprehensive table of all selected parameters and test outcomes.

---

## 3. Definition of Done & Quality Gates (DoD Sign-Off)

- [x] End-to-end dry runs of `playwright-on-demand.yml` pass with zero syntax or expression errors.
- [x] Staging and Local environment routing verified.
- [x] GitHub Pages deployment toggle properly respects `publish_report: false`.
- [x] [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml) confirmed untouched and functional.
- [x] **Live Workflow Triggering & Execution Verification (`gh workflow run`)**:
  - [x] **Remote Staging Run**: Run [`34041540403`](https://github.com/munna7862/buggy-books/actions/runs/34041540403) triggered with `target_env=INTEROP -f test_scope=api -f tag=@smoke`. Verified `build-services` job was skipped (0s), tests executed directly against `https://buggy-books.onrender.com` (20 passed in 18.7s), and run concluded with `conclusion: success` 🟢.
  - [x] **Artifact-Only (No Deploy) Run**: Run [`34041530450`](https://github.com/munna7862/buggy-books/actions/runs/34041530450) triggered with `publish_report=false`. Verified HTML report artifact was uploaded (550KB) and downloadable, while GitHub Pages checkout and deployment steps were skipped. Concluded with `conclusion: success` 🟢.
- [x] **Report Artifact & Quality Gate Verification**:
  - [x] Downloaded consolidated HTML report artifact via `gh run download` (`playwright-html-report-on-demand`), verified standalone `index.html` (550KB) with complete execution metadata.
  - [x] Verified GitHub Pages site reflects updated reports when `publish_report: true`.
  - [x] Inspected `$GITHUB_STEP_SUMMARY` to verify rich Markdown dashboard renders all environment, tag, scope, and metric summaries.

---

## 4. Live Verification Evidence Matrix

| Run ID | Scope & Target | Key QA Controls Tested | Result | Duration | Artifacts Verified |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [`34041530450`](https://github.com/munna7862/buggy-books/actions/runs/34041530450) | `ui` / `Test_001_RegisterUser.spec.ts` | `publish_report: false` (Artifact-only mode) | 🟢 Success | 2m 58s | `playwright-html-report-on-demand` (Pages deploy bypassed) |
| [`34041540403`](https://github.com/munna7862/buggy-books/actions/runs/34041540403) | `api` / All API specs | `target_env: INTEROP` (Render Staging) | 🟢 Success | 3m 4s | `build-services` skipped (0s), 20 tests passed live |

# Sprint 7.3: Multi-Environment Routing, Resilient Reporting & Telemetry

**Sprint Identifier**: `SPRINT-7.3-MULTI-ENV-DISPATCH-RESILIENT-REPORTING-AND-GOVERNANCE`  
**Phase Mapping**: [Phase 7: On-Demand Dynamic Test Dispatch, QA Diagnostics & Multi-Environment Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_7_on_demand_test_dispatch_and_qa_observability.md)  
**Estimated Velocity**: 4 Story Points  
**Sprint Goal**: Enable instant test execution against live remote staging environments by conditionally skipping compilation builds (`target_env: STAGING`), provide granular reporting hygiene controls (`publish_report`), harden partial-suite blob report merging, and render rich run telemetry in GitHub Actions Step Summaries.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Phase 7 final milestone signoff and burndown reporting. |
| **DevOps Engineer** | AI Agent / DevOps | Implementing `target_env` conditional build gating, GitHub Pages deployment toggle, and Allure history integration. |
| **SDET Architect** | AI Agent / SDET | Authoring resilient blob merge logic and rich markdown telemetry for `$GITHUB_STEP_SUMMARY`. |
| **Playwright QA Specialist** | AI Agent / QA | Verifying live staging runs and validating downloadable HTML report artifacts. |
| **Product Owner** | Human PO / AI PO | Final acceptance of on-demand dispatch capabilities and QA reporting dashboard. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-705: Multi-Environment Routing (`target_env: LOCAL vs STAGING`)
- **Story Statement**:  
  *As a* QA Engineer validating a deployed release on staging,  
  *I want* to run tests directly against our live staging URL without compiling local backend/frontend services,  
  *So that* on-demand runs start in seconds and validate actual deployed environments.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Add `workflow_dispatch` input `target_env`:
    - Type: `choice`: `LOCAL` (default), `INTEROP` (Render Staging).
  - [ ] Update `build-services` job condition:
    - If `target_env == 'INTEROP'`, skip `build-services` completely.
  - [ ] Update `api-tests` and `ui-tests` environment variables:
    - If `target_env == 'INTEROP'`:
      - `BASE_URL=https://buggy-books-fe.onrender.com`
      - `API_BASE_URL=https://buggy-books.onrender.com`
      - Skip downloading backend/frontend dist artifacts and skip launching ephemeral node/vite preview processes.
    - If `target_env == 'LOCAL'`:
      - Preserve existing ephemeral preview server lifecycle.
- **Acceptance Criteria**:
  - [ ] Selecting `target_env: INTEROP` skips compilation, boots zero local servers, and executes tests against live staging endpoints.
  - [ ] Selecting `target_env: LOCAL` compiles backend & frontend and runs locally with full data isolation.

---

### User Story US-QA-706: Selective GitHub Pages Publishing, Partial-Suite Blob Merging & Telemetry
- **Story Statement**:  
  *As a* Release Manager & SDET,  
  *I want* control over whether ad-hoc runs publish to GitHub Pages, resilient blob merging when only 1 suite executes, and a rich Step Summary,  
  *So that* exploratory runs don't overwrite release reports and all execution parameters are clearly visible in the Actions console.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Add `workflow_dispatch` input `publish_report`:
    - Type: `boolean`, default: `true`.
  - [ ] Harden `deploy-report` blob merging:
    - Guard `npx playwright merge-reports` so that if only API or only UI ran, blobs merge without error.
    - Provide fallback index page if 0 blobs were produced.
  - [ ] Gate GitHub Pages deployment step with `if: inputs.publish_report == true || inputs.publish_report == 'true'`.
  - [ ] Always upload consolidated HTML report as downloadable artifact `playwright-html-report-on-demand`.
  - [ ] Enhance `$GITHUB_STEP_SUMMARY` to display a markdown dashboard of:
    - Target Environment & Scope
    - Tag filter, Title regex, and Excluded tags
    - Browser project, retries, and repeat_each count
    - Links to Allure Pages report (if published) and downloadable artifacts
- **Acceptance Criteria**:
  - [ ] Running a single UI test with `publish_report: false` creates the downloadable HTML report zip but skips deploying to GitHub Pages.
  - [ ] Running only API tests produces a consolidated HTML report and Allure dashboard reflecting only the executed API tests.
  - [ ] GitHub Actions Step Summary displays a comprehensive table of all selected parameters and test outcomes.

---

## 3. Definition of Done & Quality Gates
- [ ] End-to-end dry runs of `playwright-on-demand.yml` pass with zero syntax or expression errors.
- [ ] Staging and Local environment routing verified.
- [ ] GitHub Pages deployment toggle properly respects `publish_report: false`.
- [ ] [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml) confirmed untouched and functional.
- [ ] **Live Workflow Triggering & Execution Verification (`gh workflow run`)**:
  - [ ] **Remote Staging Run**: Trigger workflow with `-f target_env=INTEROP -f test_scope=api -f tag=@smoke`. Verify `build-services` job is skipped, tests execute directly against Render staging, and run concludes with `conclusion: success`.
  - [ ] **Artifact-Only (No Deploy) Run**: Trigger workflow with `-f test_scope=ui -f tag=@smoke -f publish_report=false`. Verify HTML report artifact is uploaded and downloadable, while GitHub Pages deployment step is skipped.
- [ ] **Report Artifact & Quality Gate Verification**:
  - [ ] Download consolidated HTML report artifact via `gh run download` and verify report opens locally with 100% accurate test charts and execution metadata.
  - [ ] Verify GitHub Pages site (`AutomationReports/CI/...`) reflects updated report when `publish_report: true`.
  - [ ] Inspect `$GITHUB_STEP_SUMMARY` to verify rich Markdown dashboard renders all environment, tag, scope, and metric summaries.

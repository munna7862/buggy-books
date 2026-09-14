# Sprint 10.3: CI/CD Pipeline Hermetic Isolation, Process Management & Report Deployment

**Sprint Identifier**: `SPRINT-10.3-CICD-PIPELINE-HERMETIC-ISOLATION-AND-REPORT-GOVERNANCE`  
**Phase Mapping**: [Phase 10: E2E Automation Modernization, Hermetic CI/CD & Test Governance](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_10_e2e_automation_modernization_hermetic_cicd_and_test_governance.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Replace fragile background shell process management with Playwright's native managed `webServer` block in CI, isolate database state during k6 benchmark runs, fix GitHub context variable bugs in report deployment, and add pre-flight checks to Docker sharding.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Backlog Grooming, Sprint Goal alignment, DoD verification, and velocity burndown tracking. |
| **DevOps Automation Architect** | AI Agent / DevOps | Modernizing [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml), [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml), [playwright-docker.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-docker.yml), and fixing report deployment. |
| **Principal SDET** | AI Agent / SDET | Configuring `webServer` orchestration in [playwright.config.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/config/playwright.config.ts) for CI execution. |
| **Performance QA Specialist** | AI Agent / Perf QA | Designing pre-run database snapshot and reset steps for k6 performance benchmarks in CI. |
| **Product Owner** | Human PO / AI PO | Verifying Allure and Monocart report links in GitHub Actions summaries. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-CI-1031: Native Playwright Managed WebServer in CI
- **Story Statement**:  
  *As a* DevOps Engineer,  
  *I want* CI pipelines to rely on Playwright's native `webServer` lifecycle management,  
  *So that* we eliminate brittle `nohup ... &` background starts, `wait-on` polls, and `pkill -f` cleanups that risk zombie processes or port conflicts.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] In [playwright.config.ts lines 64-88](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/config/playwright.config.ts#L64-L88):
    - Update the `webServer` configuration to support both local dev and CI execution:
      ```typescript
      webServer: [
        {
          command: 'node dist/server.js',
          cwd: backendDir,
          url: 'http://127.0.0.1:4000/api/books',
          timeout: 60 * 1000,
          reuseExistingServer: !process.env.CI,
          env: {
            PORT: '4000',
            NODE_ENV: 'production',
            JWT_SECRET: process.env.JWT_SECRET || 'ci-test-secret',
          },
        },
        {
          command: 'npx vite preview --port 5173 --host 127.0.0.1',
          cwd: frontendDir,
          url: 'http://127.0.0.1:5173',
          timeout: 60 * 1000,
          reuseExistingServer: !process.env.CI,
        },
      ],
      ```
  - [ ] In [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml#L512-L527) and [playwright-ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml#L162-L177):
    - Remove manual `nohup node dist/server.js ... &`, `npx wait-on ...`, and `pkill -f "node dist/server.js"`.
    - Let `npx playwright test` automatically boot the pre-built backend and frontend servers, wait for the readiness URLs, run tests, and cleanly terminate the child processes upon completion.
- **Acceptance Criteria**:
  - [ ] Playwright E2E smoke tests in `ci.yml` and full suites in `playwright-ci.yml` boot and tear down servers without manual background shell commands.
  - [ ] Zero lingering node processes remain on the runner after test completion.

---

### User Story US-CI-1032: Database State Isolation in Performance Benchmark Gates
- **Story Statement**:  
  *As an* SDET running performance regression benchmarks in CI,  
  *I want* database state reset or sandboxed before each benchmark tier,  
  *So that* high-load mutations (such as 100 VU checkout stress depleting inventory) do not corrupt subsequent benchmark suites.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] In [ci.yml Stage 3B](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml#L341-L412):
    - Add a pre-benchmark step that snapshots `backend/db.json` to `backend/db.json.bak`.
    - Between k6 benchmark runs (`smoke`, `catalog`, `inventory`, `journey`, `auth`, `checkout`), automatically restore `backend/db.json` from `backend/db.json.bak` (or invoke `POST /api/test/reset` with dedicated session headers).
    - Ensure `perf-endurance.yml` follows the same database state snapshotting practice.
- **Acceptance Criteria**:
  - [ ] Running all 5 k6 benchmarks sequentially in CI preserves initial book inventory levels for every test.
  - [ ] `inventory_duration` and `checkout_duration` metrics are evaluated against identical initial database state.

---

### User Story US-CI-1033: Resilient Report Deployment & Staging Pre-Flight Checks
- **Story Statement**:  
  *As a* QA Lead / Engineering Manager,  
  *I want* Allure and Monocart reports to deploy with correct URLs on all trigger events, and Docker staging sharding to verify target health before execution,  
  *So that* GitHub Pages report links are never broken and cold-start timeouts on Render do not cause false-positive test failures.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] In [playwright-ci.yml line 518 and lines 565-568](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-ci.yml#L518):
    - Replace `${{ github.event.repository.name }}` with safe extraction from `${{ github.repository }}`:
      ```bash
      REPO_NAME="${GITHUB_REPOSITORY#*/}"
      OWNER="${GITHUB_REPOSITORY%/*}"
      ```
    - Verify that on `workflow_dispatch` and `schedule`, the generated Allure link in `$GITHUB_STEP_SUMMARY` resolves accurately.
  - [ ] In [playwright-docker.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/playwright-docker.yml):
    - Add a pre-flight warm-up step in Job 1:
      ```bash
      echo "Pinging Render backend and frontend to wake from sleep..."
      curl -s -o /dev/null -w "%{http_code}" https://buggy-books.onrender.com/api/books || true
      npx wait-on -t 90000 https://buggy-books.onrender.com/api/books
      ```
    - Prevents 8 simultaneous Docker shards from timing out during Render's initial spin-up phase.
  - [ ] In [quarantine-audit.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/quarantine-audit.yml) and [playwright.config.ts](file:///c:/BuggyBooks/buggy-books/playwright-e2e/src/config/playwright.config.ts):
    - Set `grepInvert: process.env.RUN_QUARANTINE ? undefined : /@quarantine/`.
- **Acceptance Criteria**:
  - [ ] Allure report URLs in Step Summary are well-formed across scheduled, push, and dispatch runs.
  - [ ] Docker matrix shards execute against a verified, awake staging environment.
  - [ ] Quarantine audit runs without config collision.

---

## 3. Definition of Done & Quality Gates

- [ ] Playwright `webServer` cleanly manages backend and frontend servers during CI smoke and regression jobs.
- [ ] Database state is restored cleanly between each k6 performance tier in `ci.yml`.
- [ ] Allure report deployment accurately prints GitHub Pages URL regardless of trigger event.
- [ ] Render pre-flight warm-up prevents cold start timeout failures in `playwright-docker.yml`.
- [ ] All GitHub Actions workflow syntax checks pass validation.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[PLANNED]`
- **Committed Story Points**: 5 SP
- **Primary Deliverables**:
  1. Playwright managed `webServer` integration in CI workflows.
  2. Database snapshotting and state isolation for performance benchmarks.
  3. Corrected repository URL interpolation for GitHub Pages Allure publishing.
  4. Pre-flight health check in Docker sharding workflow.
  5. Conditional `RUN_QUARANTINE` filter in `playwright.config.ts`.

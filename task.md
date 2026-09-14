# Sprint 10.3: CI/CD Pipeline Hermetic Isolation, Process Management & Report Deployment

**Sprint Identifier**: `SPRINT-10.3-CICD-PIPELINE-HERMETIC-ISOLATION-AND-REPORT-GOVERNANCE`  
**Phase**: [Phase 10: E2E Automation Modernization, Hermetic CI/CD & Test Governance](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_10_e2e_automation_modernization_hermetic_cicd_and_test_governance.md)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Replace fragile background shell process management with Playwright's native managed `webServer` block in CI, isolate database state during k6 benchmark runs, fix GitHub context variable bugs in report deployment, add pre-flight health checks to Docker sharding, and establish test cataloging standards.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog grooming, live burndown tracking in `task.md`, cross-persona handoffs, review facilitation, and DoD compliance audit. |
| **DevOps Automation Architect** | AI Agent / DevOps | Modernizing `ci.yml`, `playwright-ci.yml`, `playwright-docker.yml`, `playwright-on-demand.yml`, and fixing report deployment URL interpolation. |
| **Principal SDET** | AI Agent / SDET | Calibrating `webServer` orchestration and conditional `grepInvert` in `playwright.config.ts` for CI and local workflows. |
| **Performance QA Specialist** | AI Agent / Perf QA | Designing pre-run database snapshotting and between-tier reset steps for k6 performance benchmarks in CI and endurance workflows. |
| **Security Officer** | AI Agent / SEC | Verifying secret isolation in CI workflow files, absence of exposed credentials, and safe URL interpolation. |
| **Product Owner** | Human PO / AI PO | Validating Allure/Monocart report links in GitHub Actions summaries, approving Definition of Done, and authorizing release PR. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-CI-1031: Native Playwright Managed WebServer in CI
*As a DevOps Engineer, I want CI pipelines to rely on Playwright's native `webServer` lifecycle management, so that we eliminate brittle `nohup ... &` background starts, `wait-on` polls, and `pkill -f` cleanups that risk zombie processes or port conflicts.*
- [x] **US-CI-1031.1** (`Principal SDET`): In `playwright-e2e/src/config/playwright.config.ts`, configure `webServer` array with readiness URLs (`http://127.0.0.1:4000/api/books` and `http://127.0.0.1:5173`), `reuseExistingServer: !process.env.CI`, `timeout: 60 * 1000`, and `stdout: 'pipe'`.
- [x] **US-CI-1031.2** (`Principal SDET`): In `playwright-e2e/src/config/playwright.config.ts`, configure `grepInvert: process.env.RUN_QUARANTINE ? undefined : /@quarantine/`.
- [x] **US-CI-1031.3** (`DevOps Automation Architect`): In `.github/workflows/ci.yml`, remove manual `Start Ephemeral Backend Server`, `Start Ephemeral Frontend Preview Server`, and `Stop Ephemeral Servers` steps from `e2e-smoke-test` job.
- [x] **US-CI-1031.4** (`DevOps Automation Architect`): In `.github/workflows/playwright-ci.yml`, remove manual background server startup and log upload steps from Job 2 (`api-test`) and Job 3 (`ui-test-matrix`), letting Playwright manage the server lifecycle.
- [x] **US-CI-1031.5** (`DevOps Automation Architect`): In `.github/workflows/quarantine-audit.yml`, remove manual `nohup` server startup steps and rely on Playwright's native `webServer`.

### User Story US-CI-1032: Database State Isolation in Performance Benchmark Gates
*As an SDET running performance regression benchmarks in CI, I want database state reset or sandboxed before each benchmark tier, so that high-load mutations do not corrupt subsequent benchmark suites.*
- [x] **US-CI-1032.1** (`Performance QA Specialist`): In `.github/workflows/ci.yml` Stage 3B, add a pre-benchmark snapshot step saving `backend/db.json` to `backend/db.json.bak`.
- [x] **US-CI-1032.2** (`Performance QA Specialist`): In `.github/workflows/ci.yml` Stage 3B, add state restoration between sequential k6 benchmark runs (`catalog`, `inventory`, `journey`, `auth`, `checkout`), copying `backend/db.json.bak` back to `backend/db.json` and calling `POST /api/test/reset`.
- [x] **US-CI-1032.3** (`Performance QA Specialist`): In `.github/workflows/perf-endurance.yml`, snapshot `backend/db.json` and restore state between the endurance soak test and the breakpoint saturation test.

### User Story US-CI-1033: Resilient Report Deployment & Staging Pre-Flight Checks
*As a QA Lead / Engineering Manager, I want Allure and Monocart reports to deploy with correct URLs on all trigger events, and Docker staging sharding to verify target health before execution, so that GitHub Pages report links are never broken and cold-start timeouts on Render do not cause false-positive test failures.*
- [x] **US-CI-1033.1** (`DevOps Automation Architect`): In `.github/workflows/playwright-ci.yml` (lines 491, 538), replace `${{ github.event.repository.name }}` with safe extraction `REPO_NAME="${GITHUB_REPOSITORY#*/}"` and `OWNER="${GITHUB_REPOSITORY%/*}"`.
- [x] **US-CI-1033.2** (`DevOps Automation Architect`): In `.github/workflows/playwright-docker.yml` (lines 207, 254), replace `${{ github.event.repository.name }}` with safe extraction from `GITHUB_REPOSITORY`.
- [x] **US-CI-1033.3** (`DevOps Automation Architect`): In `.github/workflows/playwright-on-demand.yml` (line 825), replace `${{ github.event.repository.name }}` with safe extraction from `GITHUB_REPOSITORY`.
- [x] **US-CI-1033.4** (`DevOps Automation Architect`): In `.github/workflows/playwright-docker.yml` Job 1, add a pre-flight warm-up step pinging Render backend (`/api/books`) and frontend (`/`) with `curl` and `npx wait-on -t 90000` before running tests.

### User Story US-CI-1034: Test Cataloging, Phase 10 Governance & Monorepo Validation
*As a Quality Architect, I want the test cases catalog updated with Section 18 documenting Sprint 10.3 CI/CD & hermetic standards, and all monorepo checks passing cleanly.*
- [x] **US-CI-1034.1** (`Principal SDET`): Author Section 18 in `specs/test_cases_catalog.md` (`TC-CICD-001`, `TC-PERF-ISOLATE-001`, `TC-REPORT-DEPLOY-001`, `TC-DOCKER-PREFLIGHT-001`).
- [x] **US-CI-1034.2** (`DevOps Automation Architect`): Update `planning/Sprints/sprint_10_3_cicd_pipeline_hermetic_isolation_and_report_governance.md` and `planning/Phases/phase_10_e2e_automation_modernization_hermetic_cicd_and_test_governance.md`.
- [x] **US-CI-1034.3** (`Security Officer`): Verify secret isolation, safe environment variables, and absence of credential leaks across updated workflows.
- [x] **US-CI-1034.4** (`Product Owner`): Validate monorepo typecheck, linting, test suite execution, approve Definition of Done, and authorize release PR.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | Principal SDET | Playwright native managed `webServer` configured with readiness endpoints (`4000/api/books`, `5173`), 60s calibrated readiness timeouts, `reuseExistingServer: !process.env.CI`, and conditional `grepInvert` verified. | `[APPROVED]` |
| **DevOps Pipeline Review** | DevOps Automation Architect | Removed brittle `nohup`/`wait-on`/`pkill` background shell scripts from `ci.yml`, `playwright-ci.yml`, and `quarantine-audit.yml`. Replaced fragile repository context interpolation across all workflow files. | `[APPROVED]` |
| **Performance QA Gate** | Performance QA Specialist | Verified database state snapshotting and per-benchmark restoration logic across `ci.yml` Stage 3B and `perf-endurance.yml`. | `[APPROVED]` |
| **Security Audit Gate** | Security Officer | Verified absence of credential exposure, safe variable substitution using `GITHUB_REPOSITORY`, and isolated secret parameters. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All 55 API tests pass under managed `webServer`. Monorepo typecheck and linting pass with 0 errors. Definition of Done fully satisfied; release PR authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Playwright `webServer` cleanly manages backend and frontend preview servers in CI and local workflows with readiness polling.
- [x] Brittle `nohup ... &`, `wait-on`, and `pkill -f` steps removed from `ci.yml` and `playwright-ci.yml`.
- [x] `quarantine-audit.yml` and `playwright.config.ts` align with `process.env.RUN_QUARANTINE ? undefined : /@quarantine/`.
- [x] Database state is snapshotted and restored between sequential k6 performance benchmark runs in `ci.yml` Stage 3B.
- [x] Database state isolation is established in `perf-endurance.yml`.
- [x] Report deployment steps in `playwright-ci.yml`, `playwright-docker.yml`, and `playwright-on-demand.yml` extract repository info safely without relying on `github.event.repository.name`.
- [x] Staging pre-flight warm-up step is established in `playwright-docker.yml` to prevent cold-start failures.
- [x] Section 18 documented in `specs/test_cases_catalog.md`.
- [x] Phase 10 planning and Sprint 10.3 documents updated with completed status.
- [x] Monorepo `npm run typecheck` and `npm run lint` pass with 0 errors across all workspaces.
- [x] All API test suites pass cleanly under `--project=api`.
- [x] Feature branch committed with conventional commits, pushed to remote, and Pull Request raised via GitHub CLI: [#95](https://github.com/munna7862/buggy-books/pull/95).

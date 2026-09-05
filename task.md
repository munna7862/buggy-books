# Sprint 6.3: Multi-Tiered Performance Baselines, Endurance Telemetry & Quarantine Governance

**Sprint Identifier**: `SPRINT-6.3-PERFORMANCE-TELEMETRY-BASELINES-AND-QUARANTINE-GOVERNANCE`  
**Phase**: Phase 6 (Hermetic Regression Orchestration, Native Sharding & Performance Governance)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Eliminate performance CI failures by fixing the missing k6 summary export in the endurance workflow, establish tier-specific golden baselines (`smoke`, `catalog`, `soak`), enforce `NODE_ENV=production` benchmarking, integrate Node.js memory drift and event loop lag telemetry in soak tests, and establish a closed-loop quarantine audit workflow backed by universal failure trace artifact retention.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, documenting `TC-PERF-003` and `TC-QA-015` in `specs/test_cases_catalog.md`, authoring Node.js memory telemetry in `soak-load.js`, creating tier baselines, and designing the quarantine audit test runner. |
| **Dev Architect / Senior SDE** | AI Agent / SDE | Adding `GET /api/health` Node.js memory telemetry endpoint to `backend/src/routes/api.ts` and unit tests in `backend/src/__tests__/api.test.ts`. |
| **DevOps Engineer** | AI Agent / DevOps | Correcting command syntax in `.github/workflows/perf-endurance.yml`, configuring `NODE_ENV=production` in benchmark jobs, universal trace uploads in `playwright-ci.yml`, and creating `.github/workflows/quarantine-audit.yml`. |
| **Performance Engineer** | AI Agent / Perf | Calibrating golden baselines for 5-VU smoke, 50-VU catalog, and 25-VU soak scenarios, tuning memory drift thresholds, and validating k6 summaries. |
| **Product Owner** | AI Agent / PO | Reviewing soak memory stability reports, approving baseline SLA thresholds (+20% delta), and granting sprint sign-off. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-PERF-601: Multi-Tiered Performance Baselines & Endurance Memory Telemetry
*As a Performance Engineer & DevOps Release Gatekeeper, I want k6 endurance jobs to export summaries properly, benchmarks to run in production mode against scenario-specific baselines, and soak tests to assert memory stability, so that endurance workflows never crash on missing files, 5-VU PR smoke tests are not misjudged against 50-VU baselines, and memory leaks are caught before causing OOM crashes in production.*
- [x] **US-PERF-601.1** (`SDET Architect`): Document test cases `TC-PERF-003` and `TC-QA-015` in `specs/test_cases_catalog.md` (Pre-Flight Lock).
- [x] **US-PERF-601.2** (`Dev Architect / Senior SDE`): Implement `GET /api/health` telemetry endpoint in `backend/src/routes/api.ts` exposing `process.uptime()` and `process.memoryUsage()` (`heapUsed`, `heapTotal`, `rss`, `external`). Add test coverage in `backend/src/__tests__/api.test.ts`.
- [x] **US-PERF-601.3** (`Performance Engineer`): Generate scenario-specific golden baselines in `performance/baselines/`:
  - `baseline-smoke.json` — 5 VUs smoke benchmark (target: avg < 5ms, p95 < 10ms).
  - `baseline-catalog.json` — 50 VUs catalog load benchmark (target: avg < 8ms, p95 < 250ms).
  - `baseline-soak.json` — 25 VUs 15-minute endurance soak benchmark (target: p95 < 300ms, error rate < 0.1%).
- [x] **US-PERF-601.4** (`DevOps Engineer`): Fix syntax bug in `.github/workflows/perf-endurance.yml` line 94:
  - Update `k6 run performance/scenarios/breakpoint-test.js` to `k6 run --summary-export=perf-summary-breakpoint.json performance/scenarios/breakpoint-test.js`.
  - Set `NODE_ENV: production` for server execution.
  - Pass `--baseline=performance/baselines/baseline-soak.json` and `--baseline=performance/baselines/baseline-catalog.json`.
- [x] **US-PERF-601.5** (`DevOps Engineer`): Update `.github/workflows/ci.yml`:
  - Set `NODE_ENV: production` during benchmark execution.
  - Pass `--baseline=performance/baselines/baseline-smoke.json` for PR smoke jobs.
  - Pass `--baseline=performance/baselines/baseline-catalog.json` for main catalog jobs.
- [x] **US-PERF-601.6** (`SDET Architect` & `Performance Engineer`): Enhance `performance/scenarios/soak-load.js` with Node.js memory telemetry:
  - Query backend telemetry endpoint (`GET /api/health`) in `setup()`, during iterations, and in `teardown()`.
  - Measure `heapUsed` and `rss` drift between test start and finish.
  - Assert that final `heapUsed` drift remains under 30% over the baseline (memory leak tripwire).

### User Story US-QA-605: Automated Quality Gate PR Feedback & Closed-Loop Quarantine Lifecycle
*As an SDET & Release Gatekeeper, I want failed tests to display actionable root-cause summaries directly on PRs, Playwright traces to be automatically uploaded on failure, and quarantined tests to be periodically audited, so that developers can debug failures instantly without guessing, and flaky tests are systematically stabilized and de-quarantined.*
- [x] **US-QA-605.1** (`DevOps Engineer`): Implement automated Markdown step summary reporting in `.github/workflows/playwright-ci.yml`:
  - Parse Playwright test results to output total tests, passed, failed, and flaky counts.
  - Print error messages, failing spec titles, and direct links to artifacts directly in `$GITHUB_STEP_SUMMARY`.
- [x] **US-QA-605.2** (`DevOps Engineer`): Configure universal failure trace artifact uploads (`playwright-traces-api` and `playwright-traces-${{ matrix.project }}`) in `playwright-ci.yml` with 7-day retention.
- [x] **US-QA-605.3** (`SDET Architect`): Create `playwright-e2e/scripts/quarantine-audit.js` and add `"test:quarantine:audit"` npm script in `playwright-e2e/package.json` to execute `@quarantine` tests with repetition (`--repeat-each=5`), compute the Quarantine Stability Index, and format a markdown audit report.
- [x] **US-QA-605.4** (`DevOps Engineer`): Create `.github/workflows/quarantine-audit.yml`:
  - Schedule weekly audit run (`cron: '0 3 * * 1'`) and `workflow_dispatch`.
  - Execute quarantine audit suite and publish Quarantine Stability Index to step summary.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Performance Quality Gate** | Performance Engineer | Validated scenario-specific baselines reflect real VU workloads. Verified that memory drift check in `soak-load.js` asserts < 30% drift against `GET /api/health`. Breakpoint summary export syntax validated. | `[APPROVED]` |
| **DevOps Pipeline Review** | DevOps Engineer | Verified syntax fix in `perf-endurance.yml`. Confirmed `NODE_ENV=production` benchmark execution and universal trace upload configuration. Validated non-blocking scheduled quarantine audit workflow. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Confirmed Playwright failure traces and step summaries capture actionable debugging context. Validated quarantine audit script and stability scoring (`test:quarantine:audit`). | `[APPROVED]` |
| **PO Sprint Review** | Product Owner | Review performance SLA compliance (+20% gate), inspect quarantine stability audit, and issue final sprint and phase acceptance sign-off. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Syntax error in `.github/workflows/perf-endurance.yml` resolved with `--summary-export`.
- [x] Tiered baselines created: `baseline-smoke.json`, `baseline-catalog.json`, and `baseline-soak.json`.
- [x] Backend benchmarks execute in `NODE_ENV=production` across all workflows.
- [x] Memory drift assertion active in `performance/scenarios/soak-load.js`.
- [x] In-PR Markdown failure summary and raw trace artifact uploads active in `playwright-ci.yml`.
- [x] `.github/workflows/quarantine-audit.yml` and `scripts/quarantine-audit.js` created with `--repeat-each=5` stability scoring.
- [x] `specs/test_cases_catalog.md` updated with `TC-PERF-003` and `TC-QA-015`.
- [x] All backend unit and integration tests pass cleanly (`npm test`).
- [x] Pull Request opened via `gh pr create` and all CI workflows verified green before squash merging into `main`.

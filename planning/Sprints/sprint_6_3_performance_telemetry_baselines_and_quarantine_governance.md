# Sprint 6.3: Multi-Tiered Performance Baselines, Endurance Telemetry & Quarantine Governance

**Sprint Identifier**: `SPRINT-6.3-PERFORMANCE-TELEMETRY-BASELINES-AND-QUARANTINE-GOVERNANCE`  
**Phase Mapping**: Phase 6 (Hermetic Regression Orchestration, Native Sharding & Performance Governance)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Eliminate performance CI failures by fixing the missing k6 summary export in the endurance workflow, establish tier-specific golden baselines (`smoke`, `catalog`, `soak`), enforce `NODE_ENV=production` benchmarking, integrate Node.js memory drift and event loop lag telemetry in soak tests, and establish a closed-loop quarantine audit workflow backed by universal failure trace artifact retention.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, velocity burndown tracking, and Definition of Done verification. |
| **SDET Architect** | AI Agent / SDET | Authoring Node.js memory drift telemetry checks in `soak-load.js`, creating tier-specific baseline references, and designing the quarantine audit test runner. |
| **DevOps Engineer** | AI Agent / DevOps | Correcting the command syntax in `.github/workflows/perf-endurance.yml`, configuring `NODE_ENV=production` in benchmark jobs, and creating `.github/workflows/quarantine-audit.yml`. |
| **Performance Engineer** | AI Agent / Perf | Calibrating golden baselines for 5-VU smoke, 50-VU catalog, and 25-VU soak scenarios, and tuning memory leak thresholds. |
| **Product Owner** | Human PO / AI PO | Reviewing soak memory stability reports, approving baseline SLA thresholds (+20% delta), and granting sprint sign-off. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-PERF-601: Multi-Tiered Performance Baselines & Endurance Memory Telemetry
- **Story Statement**:  
  *As a* Performance Engineer & DevOps Release Gatekeeper,  
  *I want* k6 endurance jobs to export summaries properly, benchmarks to run in production mode against scenario-specific baselines, and soak tests to assert memory stability,  
  *So that* endurance workflows never crash on missing files, 5-VU PR smoke tests are not misjudged against 50-VU baselines, and memory leaks are caught before causing OOM crashes in production.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [x] Fix syntax bug in `.github/workflows/perf-endurance.yml` line 94:
    - Update `k6 run performance/scenarios/breakpoint-test.js` to:
      `k6 run --summary-export=perf-summary-breakpoint.json performance/scenarios/breakpoint-test.js`
  - [x] Generate and commit scenario-specific golden baselines in `performance/baselines/`:
    - `baseline-smoke.json` — 5 VUs smoke benchmark (target: avg < 5ms, p95 < 10ms).
    - `baseline-catalog.json` — 50 VUs catalog load benchmark (target: avg < 8ms, p95 < 250ms).
    - `baseline-soak.json` — 25 VUs 15-minute endurance soak benchmark (target: p95 < 300ms, error rate < 0.1%).
  - [x] Update `.github/workflows/ci.yml` and `perf-endurance.yml`:
    - Ensure backend server runs with `NODE_ENV: production` during benchmark execution.
    - Pass `--baseline=performance/baselines/baseline-smoke.json` for PR smoke jobs.
    - Pass `--baseline=performance/baselines/baseline-catalog.json` for main catalog jobs.
    - Pass `--baseline=performance/baselines/baseline-soak.json` for endurance soak jobs.
  - [x] Enhance `performance/scenarios/soak-load.js` with Node.js memory telemetry:
    - Query backend telemetry endpoint (`GET /api/inventory/report` or `/health`) at intervals.
    - Measure process `heapUsed` and RSS drift between test start and test finish.
    - Assert that final `heapUsed` does not increase by more than 30% over the baseline (memory leak tripwire).
- **Acceptance Criteria**:
  - [x] `.github/workflows/perf-endurance.yml` runs breakpoint tests with `--summary-export` and generates step summaries without JSON not found errors.
  - [x] PR performance smoke tests compare against `baseline-smoke.json` with zero false-positive +20% regressions.
  - [x] Benchmark execution in CI runs under `NODE_ENV=production` with optimized latency profiles.
  - [x] Soak endurance benchmark asserts that memory drift remains under 30% across the sustained 15-minute load.

---

### User Story US-QA-605: Automated Quality Gate PR Feedback & Closed-Loop Quarantine Lifecycle
- **Story Statement**:  
  *As an* SDET & Release Gatekeeper,  
  *I want* failed tests to display actionable root-cause summaries directly on PRs, Playwright traces to be automatically uploaded on failure, and quarantined tests to be periodically audited,  
  *So that* developers can debug failures instantly without guessing, and flaky tests are systematically stabilized and de-quarantined.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [x] Implement automated Markdown step summary reporting in `.github/workflows/playwright-ci.yml`:
    - Parse Playwright JSON/blob test results to output total tests, passed, failed, and flaky counts.
    - Print error messages, failing spec titles, and direct links to artifacts directly in `$GITHUB_STEP_SUMMARY`.
  - [x] Configure universal failure trace artifact uploads in `playwright-ci.yml`:
    ```yaml
    - name: Upload Playwright Failure Traces & Screenshots
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-traces-${{ matrix.project }}
        path: |
          playwright-e2e/test-results/
          playwright-e2e/reports/test-artifacts/
        retention-days: 7
    ```
  - [x] Create `.github/workflows/quarantine-audit.yml`:
    - Schedule weekly audit run (`cron: '0 3 * * 1'`) and `workflow_dispatch`.
    - Run quarantined tests with repetition:
      `npx playwright test --grep "@quarantine" --repeat-each=5`
    - Output a Quarantine Stability Index: if a test achieves 100% pass rate across 5 repetitions, generate a notification recommending de-quarantine.
- **Acceptance Criteria**:
  - [x] Any failed regression or CI run outputs a formatted failure summary directly in `$GITHUB_STEP_SUMMARY`.
  - [x] Any test failure on Chromium, Firefox, or WebKit uploads a downloadable `.zip` trace viewable via `npx playwright show-trace`.
  - [x] `.github/workflows/quarantine-audit.yml` runs quarantined tests 5 times and outputs a clear stabilization score.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Performance Quality Gate** | Performance Engineer | Validated that scenario-specific baselines reflect real VU workloads. Verified that memory drift check in `soak-load.js` asserts heap growth under +30% threshold against `GET /api/health`. Verified breakpoint test exports summary cleanly. | `[PASSED]` |
| **DevOps Pipeline Review** | DevOps Engineer | Verified syntax fix in `perf-endurance.yml`. Confirmed that `quarantine-audit.yml` runs non-blockingly without affecting main build statuses, and `NODE_ENV=production` is enforced across benchmark jobs. | `[PASSED]` |
| **SDET Quality Gate** | SDET Architect | Confirmed that Playwright failure traces capture DOM snapshots, action logs, and console outputs for instant triage. Validated `quarantine-audit.js` runner and `--repeat-each=5` stability scoring. | `[PASSED]` |
| **PO Sprint Review** | Product Owner | Review performance SLA compliance (+20% gate), inspect quarantine stability audit, and issue final sprint and phase acceptance sign-off. | `[PASSED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Syntax error in `.github/workflows/perf-endurance.yml` resolved with `--summary-export`.
- [x] Tiered baselines created: `baseline-smoke.json`, `baseline-catalog.json`, and `baseline-soak.json`.
- [x] Backend benchmarks execute in `NODE_ENV=production` across all workflows.
- [x] Memory drift assertion active in `performance/scenarios/soak-load.js`.
- [x] In-PR Markdown failure summary and raw trace artifact uploads active in `playwright-ci.yml`.
- [x] `.github/workflows/quarantine-audit.yml` created with `--repeat-each=5` stability scoring.
- [x] Pull Request opened and merged with conventional commits.

---

## 5. Sprint Verification Plan

```bash
# 1. Verify k6 breakpoint scenario exports summary cleanly
cd performance
npx k6 run --duration 10s --summary-export=perf-summary-breakpoint.json scenarios/breakpoint-test.js
node report-perf-summary.js perf-summary-breakpoint.json "Breakpoint Test Verification" --baseline=baselines/baseline-catalog.json

# 2. Verify smoke benchmark comparison against baseline-smoke.json
npx k6 run --summary-export=perf-summary-smoke.json k6/smoke-load.js
node report-perf-summary.js perf-summary-smoke.json "Smoke Test Verification" --baseline=baselines/baseline-smoke.json

# 3. Verify quarantine audit runner executes with repeat-each
cd ../playwright-e2e
npx playwright test --grep "@quarantine" --repeat-each=2 --project=chromium

# 4. Verify Playwright failure trace generation
# Run a deliberate failing test and verify trace.zip is in test-results/
```

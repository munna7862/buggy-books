# Sprint 8.3: Runtime Telemetry, Event Loop Observability & Continuous Historical Trending

**Sprint Identifier**: `SPRINT-8.3-RUNTIME-TELEMETRY-EVENT-LOOP-AND-HISTORICAL-TRENDING`  
**Phase Mapping**: [Phase 8: Advanced Performance Engineering, Interactive Visual Reporting & Runtime Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_8_performance_engineering_visual_reporting_and_runtime_observability.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement deep server-side Node.js runtime diagnostics (Event Loop Lag, active handles, CPU usage), embed runtime health into performance HTML dashboards, establish continuous historical performance time-series tracking via GitHub Actions Cache, and build an automated baseline recalibration workflow.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint planning, tracking velocity, facilitating inter-team dependencies, and DoD verification. |
| **Backend Architect** | AI Agent / Dev Architect | Instrumenting `perf_hooks.monitorEventLoopDelay()`, active libuv handle diagnostics, and CPU calculation in backend routes. |
| **DevOps Engineer** | AI Agent / DevOps | Implementing GitHub Actions Cache for `perf-history.json`, building baseline recalibration workflow, and step summary sparklines. |
| **SDET Architect** | AI Agent / SDET | Authoring server diagnostic polling in k6 scripts and integrating server-side charts into the performance HTML report. |
| **Product Owner** | Human PO / AI PO | Reviewing historical trend retention policies and approving baseline update governance rules. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-PERF-807: Node.js Runtime Diagnostics & Event Loop Observability
- **Story Statement**:  
  *As a* Backend Architect / Performance Engineer,  
  *I want* Node.js event loop delay, active handles, and CPU metrics exposed and captured during load tests,  
  *So that* I can pinpoint whether latency spikes are caused by synchronous CPU blocking, GC pause delays, or connection queue starvation.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] Instrument backend `src/routes/api.ts` `GET /api/health` (and alias `GET /api/metrics`):
    - Initialize `perf_hooks.monitorEventLoopDelay({ resolution: 20 })`.
    - Record event loop percentiles: $p50, p90, p95, p99$, and max delay in milliseconds.
    - Export active libuv handle count via `process._getActiveHandles().length`.
    - Export process CPU percentage via differential `process.cpuUsage()` sampling.
  - [x] Update [soak-load.js](file:///c:/BuggyBooks/buggy-books/performance/scenarios/soak-load.js) and [breakpoint-test.js](file:///c:/BuggyBooks/buggy-books/performance/scenarios/breakpoint-test.js) to poll server diagnostics during execution:
    - Add custom k6 Trends: `node_event_loop_lag_ms`, `node_cpu_percent`, `node_active_handles`.
    - Add threshold assertion: `node_event_loop_lag_ms: ['p(95)<50']` (fail if event loop freezes for > 50ms).
  - [x] Integrate server vitals charts into `performance/report.html` (Memory vs Event Loop Lag vs Client Response Time).
- **Acceptance Criteria**:
  - [x] Querying `GET /api/health` returns memory, event loop delay metrics, and active handle counts in JSON format.
  - [x] During breakpoint and soak runs, event loop latency is tracked and plotted side-by-side with HTTP request response times.

---

### User Story US-PERF-808: Continuous Historical Regression Tracking & Sparkline Visualization
- **Story Statement**:  
  *As a* DevOps Engineer / QA Lead,  
  *I want* performance test metrics persisted across CI runs into a historical time-series file,  
  *So that* we can detect creeping regressions (e.g. $+2\%$ degradation over 5 consecutive PRs) and visualize multi-build latency trends.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] Implement historical time-series storage in GitHub Actions workflows:
    - Utilize `@actions/cache` to restore and persist `performance/perf-history.json` across workflow runs on `main` and PR branches.
    - Store the last 30 execution records containing: `timestamp`, `commit_sha`, `workflow_run_id`, `test_type`, `rps`, `p95_latency`, `error_rate`.
  - [x] Update [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js):
    - Append current test metrics into `perf-history.json`.
    - Detect multi-run creeping regression: Calculate 5-run rolling average delta; issue a warning if rolling average degrades by more than $+10\%$ even if single-run threshold ($+20\%$) has not tripped.
    - Generate ASCII sparkline or SVG line graph for GitHub Step Summary and embed historical chart in `performance/report.html`.
- **Acceptance Criteria**:
  - [x] Successive CI runs append benchmark results to `perf-history.json` without data loss.
  - [x] HTML report renders a historical trend chart displaying the last 15–30 builds with latency and error rate trajectories.

---

### User Story US-PERF-809: Automated Baseline Recalibration Workflow
- **Story Statement**:  
  *As an* SDET Architect,  
  *I want* an automated workflow to recalibrate golden baselines after intentional architectural optimizations,  
  *So that* team members do not need to manually calculate and edit raw baseline JSON files when code improvements are merged.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [x] Author `.github/workflows/perf-baseline-recalibrate.yml`:
    - Triggered via `workflow_dispatch` with input choices for target tier (`all`, `smoke`, `catalog`, `inventory`, `soak`, `journey`, `auth`, `checkout`).
    - Executes specified benchmarks in a clean, dedicated CI container under `NODE_ENV=production`.
    - Generates updated golden baseline JSON files in `performance/baselines/` with current date and commit SHA metadata.
    - Automatically opens a Pull Request or commits to `main` with a clean diff of old vs new baseline metrics.
- **Acceptance Criteria**:
  - [x] Triggering the recalibration workflow successfully executes the benchmark and commits verified, formatted baseline JSON files.

---

## 3. Definition of Done & Quality Gates

- [x] Node.js event loop lag and active handle diagnostics are exposed via `/api/health` and verified under unit tests.
- [x] k6 soak and breakpoint tests record `node_event_loop_lag_ms` and fail if event loop freezes exceed 50ms.
- [x] Performance HTML dashboard displays server runtime metrics alongside client latency graphs.
- [x] `perf-history.json` persists up to 30 runs in GitHub Actions Cache and generates multi-build sparkline charts.
- [x] Automated baseline recalibration workflow (`perf-baseline-recalibrate.yml`) triggers and generates updated golden baselines cleanly.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[COMPLETED]`
- **Committed Story Points**: 5 SP
- **Delivered Story Points**: 5 SP
- **Primary Deliverables**:
  1. Node.js Event Loop Lag and runtime diagnostics instrumentation.
  2. Server vitals integration into k6 tests and the HTML dashboard.
  3. Continuous historical performance tracker (`perf-history.json`) and sparkline generator.
  4. Creeping regression detection algorithm ($+10\%$ over 5-run rolling window).
  5. Automated baseline recalibration workflow (`perf-baseline-recalibrate.yml`).

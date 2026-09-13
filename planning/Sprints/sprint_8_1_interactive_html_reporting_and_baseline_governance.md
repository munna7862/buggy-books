# Sprint 8.1: Interactive HTML Reporting, Unified Exporters & CI Baseline Alignment

**Sprint Identifier**: `SPRINT-8.1-INTERACTIVE-HTML-REPORTING-AND-BASELINE-GOVERNANCE`  
**Phase Mapping**: [Phase 8: Advanced Performance Engineering, Interactive Visual Reporting & Runtime Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_8_performance_engineering_visual_reporting_and_runtime_observability.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement a standalone interactive HTML performance dashboard generator, unify k6 summary exporters across all scripts, eliminate CI baseline mismatches, and dynamically compare all endpoint duration metrics against golden baselines.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Backlog Grooming, Sprint Goal alignment, DoD verification, and velocity burndown tracking. |
| **DevOps Engineer** | AI Agent / DevOps | Updating [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml) and [perf-endurance.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/perf-endurance.yml) to upload HTML report artifacts and align baseline targets. |
| **SDET Architect** | AI Agent / SDET | Architecting the HTML report engine, building the unified `summary-handler.js`, and implementing dynamic metric discovery in [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js). |
| **QA Performance Specialist** | AI Agent / Perf QA | Generating `baseline-inventory.json`, validating local and CI HTML outputs, and asserting regression threshold accuracy. |
| **Product Owner** | Human PO / AI PO | Reviewing visual dashboard layout, executive metric cards, and UX responsiveness. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-PERF-801: Standalone Interactive HTML Performance Dashboard Generator
- **Story Statement**:  
  *As an* Engineering Lead / QA Engineer,  
  *I want* an interactive, standalone HTML report generated after every k6 performance run,  
  *So that* I can inspect response time percentiles ($p50, p90, p95, p99$), request throughput timelines, error distributions, and baseline comparisons in a modern visual dashboard.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Implement an embedded HTML/SVG dashboard generator in [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js) (or reusable module `performance/utils/html-reporter.js`).
  - [ ] Design high-impact visual components:
    - **Header & Executive KPI Cards**: Peak VUs, Total Requests, Average/p95 Latency, Error Rate %, Overall Gate Status (Green/Red badge).
    - **Response Time Percentile Bar Chart**: Visual comparison of $p50$, $p90$, $p95$, $p99$, and max durations across endpoints.
    - **Baseline Delta Comparison Cards**: Side-by-side golden baseline vs current measured values with color-coded drift tags (`+3.2% PASS`, `+22.5% REGRESSION`).
    - **Endpoint Health Checks Breakdown**: Pass/fail distribution with percentage success rates.
    - **Node.js Memory Gauges**: Heap used and RSS drift indicators (when memory telemetry is present).
  - [ ] Ensure the HTML report is completely self-contained (zero external network CDN dependencies, inline styles and SVG charts) so it renders securely when downloaded from CI artifacts or opened offline.
  - [ ] Support output path configuration via CLI argument `--html=<filepath>` (defaulting to `performance/report.html`).
- **Acceptance Criteria**:
  - [ ] Running `node performance/report-perf-summary.js perf-summary-smoke.json "Smoke Test" --html=perf-report.html` outputs a valid, self-contained HTML file.
  - [ ] Opening `perf-report.html` in any browser displays responsive styling, interactive metric cards, and SVG charts without JavaScript errors or missing styles.

---

### User Story US-PERF-802: Unified Summary Exporters & DevX Automation
- **Story Statement**:  
  *As a* Developer running performance benchmarks locally,  
  *I want* consistent summary and report generation regardless of whether I execute tests via `npm run test:perf:*` or directly via k6 CLI,  
  *So that* JSON summaries and HTML reports are always generated without manual CLI flag configurations.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] Author `performance/utils/summary-handler.js` exporting a standard `generateK6Summary(data, options)` helper.
  - [ ] Update [smoke-load.js](file:///c:/BuggyBooks/buggy-books/performance/k6/smoke-load.js), [catalog-load.js](file:///c:/BuggyBooks/buggy-books/performance/k6/catalog-load.js), and [inventory-stress.js](file:///c:/BuggyBooks/buggy-books/performance/k6/inventory-stress.js) to define `export function handleSummary(data)` using the shared helper.
  - [ ] Align [soak-load.js](file:///c:/BuggyBooks/buggy-books/performance/scenarios/soak-load.js) and [breakpoint-test.js](file:///c:/BuggyBooks/buggy-books/performance/scenarios/breakpoint-test.js) to consume the unified summary helper.
  - [ ] Fix unbounded file append in [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js) by implementing clean file rotation/truncation for [k6-summary.md](file:///c:/BuggyBooks/buggy-books/performance/k6-summary.md) on new runs.
- **Acceptance Criteria**:
  - [ ] Executing `npm run test:perf:smoke` locally automatically outputs `perf-summary-smoke.json` and invokes HTML summary generation.
  - [ ] Running multiple test cycles does not bloat `k6-summary.md` with duplicate, stale outputs.

---

### User Story US-PERF-803: CI Workflow Baseline Alignment & Dynamic Metric Regression Gate
- **Story Statement**:  
  *As an* SDET Architect,  
  *I want* CI workflows to compare tests against correct scenario-specific baselines and dynamically evaluate all custom trend metrics,  
  *So that* performance regressions on non-catalog endpoints (such as inventory reporting) fail the build automatically.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Create golden baseline `performance/baselines/baseline-inventory.json` with target thresholds for `inventory_duration`, RPS, and error rate under 30 VUs.
  - [ ] Fix [ci.yml line 362](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml#L362) to pass `--baseline=performance/baselines/baseline-inventory.json` instead of `baseline-catalog.json`.
  - [ ] Refactor [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js):
    - Replace hardcoded list of metrics (`catalog_duration`, `search_duration`, `detail_duration`) with dynamic discovery of all Trend metrics ending in `_duration` or present in both current metrics and baseline metrics.
    - Ensure `inventory_duration` or any future custom Trend metric is automatically compared and subject to the $+20\%$ regression gate.
  - [ ] Update [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml) and [perf-endurance.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/perf-endurance.yml) upload steps to include `*.html` reports in the artifact bundles (`perf-summaries` and `perf-endurance-artifacts`).
- **Acceptance Criteria**:
  - [ ] `inventory-stress.js` execution in CI evaluates `inventory_duration` against `baseline-inventory.json`.
  - [ ] Simulating a $+25\%$ latency increase on `inventory_duration` triggers a regression failure exit code (`exit 1`) in [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js).
  - [ ] CI pipeline artifacts contain `perf-report-*.html` files ready for one-click browser inspection.

---

## 3. Definition of Done & Quality Gates

- [ ] `performance/utils/html-reporter.js` or [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js) generates a self-contained, valid HTML5 report with zero external CDN dependencies.
- [ ] Golden baseline [baseline-inventory.json](file:///c:/BuggyBooks/buggy-books/performance/baselines/baseline-inventory.json) is committed and verified.
- [ ] [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml) uses correct baseline mappings for smoke, catalog, and inventory tests.
- [ ] Regression gate in [report-perf-summary.js](file:///c:/BuggyBooks/buggy-books/performance/report-perf-summary.js) dynamically detects degradations across any endpoint trend metric.
- [ ] All npm scripts in `performance/package.json` execute successfully across Windows and Linux.
- [ ] GitHub Actions workflow artifact upload includes HTML reports in both `ci.yml` and `perf-endurance.yml`.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[PLANNED]`
- **Committed Story Points**: 5 SP
- **Primary Deliverables**:
  1. Standalone interactive HTML report generator.
  2. `baseline-inventory.json` golden baseline.
  3. Dynamic metric comparison engine in `report-perf-summary.js`.
  4. Unified k6 summary handler utility.
  5. Workflow artifact bundle updates in `ci.yml` and `perf-endurance.yml`.

# Sprint 8.1: Interactive HTML Reporting, Unified Exporters & CI Baseline Alignment

**Sprint Identifier**: `SPRINT-8.1-INTERACTIVE-HTML-REPORTING-AND-BASELINE-GOVERNANCE`  
**Phase**: Phase 8 (Advanced Performance Engineering, Interactive Visual Reporting & Runtime Observability)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Implement a standalone interactive HTML performance dashboard generator, unify k6 summary exporters across all scripts, eliminate CI baseline mismatches, and dynamically compare all endpoint duration metrics against golden baselines.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, documenting `TC-PERF-006` and `TC-PERF-007` in `specs/test_cases_catalog.md`, architecting the HTML report engine, building the unified `summary-handler.js`, and implementing dynamic metric discovery in `report-perf-summary.js`. |
| **Dev Architect / Senior SDE** | AI Agent / SDE | Validating k6 script execution, verifying zero external runtime dependencies, and ensuring fast post-processing execution. |
| **DevOps Engineer** | AI Agent / DevOps | Updating `.github/workflows/ci.yml` and `.github/workflows/perf-endurance.yml` to upload HTML report artifacts and align baseline targets. |
| **Performance QA Specialist** | AI Agent / Perf QA | Generating `baseline-inventory.json`, validating local and CI HTML outputs, and asserting regression threshold accuracy. |
| **Product Owner** | Human PO / AI PO | Reviewing visual dashboard layout, executive metric cards, and UX responsiveness. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-PERF-801: Standalone Interactive HTML Performance Dashboard Generator
*As an Engineering Lead & QA Engineer, I want an interactive, standalone HTML report generated after every k6 performance run, so that I can inspect response time percentiles (p50, p90, p95, p99), request throughput timelines, error distributions, and baseline comparisons in a modern visual dashboard.*
- [x] **US-PERF-801.1** (`SDET Architect`): Document test cases `TC-PERF-006` (Interactive HTML Performance Report) and `TC-PERF-007` (Dynamic Metric Baseline Gate) in `specs/test_cases_catalog.md`.
- [x] **US-PERF-801.2** (`SDET Architect`): Build `performance/utils/html-reporter.js` generating a standalone, responsive, self-contained HTML5 dashboard (`performance/report.html`):
  - Executive KPI summary cards (Peak VUs, Total Requests, RPS, Avg Latency, p95 Latency, Error Rate %, Overall Gate Status).
  - SVG percentile distribution bar charts ($p50, p90, p95, p99$, max).
  - Golden baseline comparison delta cards with color-coded drift indicators.
  - Endpoint health checks pass/fail breakdown table.
  - Node.js runtime memory stability cards (when memory telemetry is present).
  - Zero external CDN dependencies (all CSS, SVG charts, and scripts inline).
- [x] **US-PERF-801.3** (`SDET Architect`): Integrate HTML generator into `performance/report-perf-summary.js` via `--html=<filepath>` flag (default: `performance/report.html`).

### User Story US-PERF-802: Unified Summary Exporters & DevX Automation
*As a Developer running performance benchmarks locally, I want consistent summary and report generation regardless of whether I execute tests via npm scripts or directly via k6 CLI, so that JSON summaries and HTML reports are always generated without manual CLI flag configurations.*
- [x] **US-PERF-802.1** (`SDET Architect`): Author `performance/utils/summary-handler.js` providing standard `createSummaryHandler(options)` exporting both JSON and HTML outputs.
- [x] **US-PERF-802.2** (`Performance QA Specialist`): Update `performance/k6/smoke-load.js`, `performance/k6/catalog-load.js`, and `performance/k6/inventory-stress.js` to define `handleSummary(data)` using the shared helper.
- [x] **US-PERF-802.3** (`Performance QA Specialist`): Update `performance/scenarios/soak-load.js` and `performance/scenarios/breakpoint-test.js` to consume the unified summary helper.
- [x] **US-PERF-802.4** (`SDET Architect`): Implement log rotation / truncation for `performance/k6-summary.md` in `report-perf-summary.js` to avoid duplicate stacking of historical logs.

### User Story US-PERF-803: CI Workflow Baseline Alignment & Dynamic Metric Regression Gate
*As an SDET Architect & DevOps Engineer, I want CI workflows to compare tests against correct scenario-specific baselines and dynamically evaluate all custom trend metrics, so that performance regressions on non-catalog endpoints (such as inventory reporting) fail the build automatically.*
- [x] **US-PERF-803.1** (`Performance QA Specialist`): Generate golden baseline `performance/baselines/baseline-inventory.json` with target thresholds under 30 concurrent VUs.
- [x] **US-PERF-803.2** (`DevOps Engineer`): Fix `.github/workflows/ci.yml` line 362 to pass `--baseline=performance/baselines/baseline-inventory.json` instead of `baseline-catalog.json`.
- [x] **US-PERF-803.3** (`SDET Architect`): Refactor `performance/report-perf-summary.js` to dynamically discover and compare all custom Trend metrics ending in `_duration` against baseline metrics, replacing hardcoded endpoint keys.
- [x] **US-PERF-803.4** (`DevOps Engineer`): Update artifact upload steps in `.github/workflows/ci.yml` and `.github/workflows/perf-endurance.yml` to include `*.html` reports (`performance/report*.html`).

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Test catalog updated with `TC-PERF-006` and `TC-PERF-007`. HTML reporter design reviewed for zero-CDN offline reliability. | `[APPROVED]` |
| **Dev Technical Review** | Dev Architect / SDE | Verified post-processing performance; zero k6 runtime overhead; all backend unit and integration tests pass (12 suites, 84 tests). | `[APPROVED]` |
| **Performance QA Review** | Performance QA | Validated `baseline-inventory.json` numbers, simulated +25% regression on `inventory_duration` tripping exit code 1, verified local k6 runs across smoke, catalog, and inventory. | `[APPROVED]` |
| **DevOps Pipeline Review** | DevOps Engineer | Verified YAML syntax in `ci.yml` and `perf-endurance.yml`, verified artifact bundle paths for `performance/report*.html` and `report*.html`. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | Verified HTML report aesthetics, responsive layout, executive KPI clarity, and clean terminal logging. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `specs/test_cases_catalog.md` updated with `TC-PERF-006` and `TC-PERF-007`.
- [x] `performance/utils/html-reporter.js` authored with self-contained CSS and SVG charts.
- [x] `performance/utils/summary-handler.js` implemented and consumed across all 5 k6 scripts.
- [x] `performance/baselines/baseline-inventory.json` generated and verified.
- [x] `performance/report-perf-summary.js` dynamically compares all `*_duration` metrics and outputs `report.html`.
- [x] `.github/workflows/ci.yml` uses `baseline-inventory.json` for inventory benchmark.
- [x] `.github/workflows/ci.yml` and `.github/workflows/perf-endurance.yml` upload HTML report artifacts.
- [x] Local benchmarks (`npm run test:perf:smoke`, `test:perf`, `test:perf:stress`) generate JSON and HTML reports cleanly.
- [x] Git feature branch `feature/sprint-8-1-interactive-html-reporting-and-baseline-governance` tested and verified.

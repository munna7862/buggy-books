# Sprint 5.3: Performance Endurance, Soak Testing & Automated Baseline Regression Detection

**Sprint Identifier**: `SPRINT-5.3-PERFORMANCE-ENDURANCE-AND-BASELINE-REGRESSION`  
**Phase**: Phase 5 (Enterprise Quality Assurance, Ephemeral E2E Gates & Performance Baseline Regression)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Establish proactive detection of long-term system degradation and silent latency regressions by introducing k6 soak/endurance and capacity saturation breakpoint scenarios, augmenting `performance/report-perf-summary.js` with relative delta regression checks against git baselines (blocking PRs with > +20% degradation), and configuring a dedicated endurance workflow.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, documenting `TC-PERF-004` and `TC-PERF-005` in `specs/test_cases_catalog.md`, designing soak load profiles, memory drift assertions, and breakpoint saturation metrics. |
| **Dev Architect / Senior SDE** | AI Agent / SDE | Authoring k6 soak load (`soak-load.js`) and breakpoint capacity scenarios (`breakpoint-test.js`), implementing memory drift and latency thresholds, and baseline comparison in `report-perf-summary.js`. |
| **Security Officer** | AI Agent / SEC | Auditing load test traffic boundaries, rate limit bypass headers (`x-bypass-rate-limit`), session sandboxing headers (`x-test-session-id`), and telemetry security. |
| **Performance & QA Specialist** | AI Agent / QA | Local verification of soak scenarios, breakpoint detection, simulated regression gate enforcement (+20% delta check), and project test suite validation. |
| **Product Owner** | AI Agent / PO | Acceptance review of endurance benchmark metrics, capacity saturation boundaries, baseline SLA gate (+20%), and release authorization. |
| **DevOps Engineer** | AI Agent / DevOps | Integrating baseline checks into `.github/workflows/ci.yml`, creating `.github/workflows/perf-endurance.yml`, Git sync, PR creation, CI monitoring, and merge closeout. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-PERF-501: k6 Endurance Soak & Capacity Breakpoint Testing
*As a Performance Engineer & SRE, I want long-duration soak tests (15–30 minutes) and ramping capacity breakpoint tests against the BuggyBooks backend, so that memory leaks, event loop delays, and connection pool exhaustion are identified before releasing changes to production.*
- [x] **US-PERF-501.1** (`SDET Architect`): Document test case `TC-PERF-004` (Endurance Soak Benchmark) and define thresholds in `specs/test_cases_catalog.md`.
- [x] **US-PERF-501.2** (`Dev Architect / Senior SDE`): Create `performance/scenarios/soak-load.js` simulating sustained 20–30 VUs with memory/latency stability thresholds and configurable duration via ENV.
- [x] **US-PERF-501.3** (`Dev Architect / Senior SDE`): Create `performance/scenarios/breakpoint-test.js` continuously ramping VUs from 1 to 200+ with automatic breaking point threshold detection and bottleneck diagnostics.
- [x] **US-PERF-501.4** (`Dev Architect / Senior SDE`): Create `performance/package.json` and update root `package.json` with convenience scripts (`test:perf:soak`, `test:perf:breakpoint`).
- [x] **US-PERF-501.5** (`DevOps Engineer`): Create `.github/workflows/perf-endurance.yml` scheduled weekly/nightly with manual `workflow_dispatch` trigger, running soak and breakpoint tests and uploading performance artifacts.
- [x] **US-PERF-501.6** (`Performance & QA Specialist`): Run local verification of short soak test and breakpoint test, validating stable VU pacing and saturation diagnostics.

### User Story US-PERF-502: Automated Relative Baseline Regression Gate in CI
*As a DevOps Engineer & Release Gatekeeper, I want the CI performance benchmark job to compare pull request metrics against a baseline (`main` branch or committed benchmark reference) and fail if p95 latency degrades by more than 20%, so that gradual performance erosion and inefficient database queries are blocked before merging.*
- [x] **US-PERF-502.1** (`SDET Architect`): Document test case `TC-PERF-005` (Automated Baseline Regression Gate) in `specs/test_cases_catalog.md`.
- [x] **US-PERF-502.2** (`Dev Architect / Senior SDE`): Commit golden performance baseline reference in `performance/baselines/baseline-perf.json`.
- [x] **US-PERF-502.3** (`Dev Architect / Senior SDE`): Enhance `performance/report-perf-summary.js` to accept `--baseline=<path>`, calculate percentage delta: `((current - baseline) / baseline) * 100`, format rich Step Summary table, and exit with code 1 when regression > 20%.
- [x] **US-PERF-502.4** (`Dev Architect / Senior SDE`): Add `--regression-test` flag to `report-perf-summary.js` to simulate a +25% latency regression for automated verification.
- [x] **US-PERF-502.5** (`DevOps Engineer`): Update `perf-benchmarks` job in `.github/workflows/ci.yml` to pass `--baseline=performance/baselines/baseline-perf.json`.
- [x] **US-PERF-502.6** (`Performance & QA Specialist`): Validate baseline comparison with synthetic passing run and intentional regression failing run (exit code 1).

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Verified test catalog entries `TC-PERF-004` and `TC-PERF-005` in `specs/test_cases_catalog.md`. Confirmed `soak-load.js` maintains realistic VU pacing (0.15s–0.2s sleep) without client-side port/socket exhaustion, and validated memory drift and latency thresholds. Confirmed `breakpoint-test.js` identifies saturation points and produces actionable bottleneck diagnostics. | `[APPROVED]` |
| **Dev Code Acceptance** | Dev Architect | Audited k6 scenarios and `report-perf-summary.js` implementation. Verified strict percentage delta calculations against golden baseline, verified that `--regression-test` flags regressions and exits with code 1, verified clean TypeScript builds (`npm run typecheck`), 80/80 backend tests, and 32/32 frontend tests. | `[APPROVED]` |
| **Security Audit** | Security Officer | Verified load test traffic respects session sandboxing (`x-test-session-id`), rate-limit bypass headers are restricted to test environments, and no sensitive telemetry, tokens, or credentials are exposed in baseline JSON or summary markdown. Verified GitHub Actions workflow permissions are scoped to `contents: read`. | `[APPROVED]` |
| **DevOps Code Review** | DevOps Engineer | Validated YAML syntax of `.github/workflows/perf-endurance.yml` and `.github/workflows/ci.yml` via `js-yaml`. Confirmed `perf-benchmarks` passes `--baseline=performance/baselines/baseline-perf.json` and artifact uploads maintain appropriate retention periods. | `[APPROVED]` |
| **PO Sprint Review** | Product Owner | Reviewed soak test stability, capacity breakpoint saturation reports, and verified that any PR with > +20% latency regression is strictly blocked by CI gates. Formally accepted all Sprint 5.3 deliverables. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `specs/test_cases_catalog.md` updated with `TC-PERF-004` and `TC-PERF-005` (Pre-Flight Lock).
- [x] `soak-load.js` and `breakpoint-test.js` created in `performance/scenarios/`.
- [x] Golden baseline reference committed in `performance/baselines/baseline-perf.json`.
- [x] `report-perf-summary.js` enhanced with baseline delta comparison, > 20% regression threshold failure (exit 1), and `--regression-test` simulation.
- [x] Step summary markdown table formatted with Baseline, Current, Delta %, and visual status indicators (`🟢 PASS`, `🟡 WARNING`, `🔴 REGRESSION`).
- [x] Dedicated endurance workflow `.github/workflows/perf-endurance.yml` configured.
- [x] CI workflow `.github/workflows/ci.yml` updated with `--baseline` flag for performance benchmarking.
- [x] Local verification of soak scenario, breakpoint test, and baseline regression failure completed.
- [x] TypeScript build clean (`npm run typecheck`), backend unit tests (80/80) and frontend component tests (32/32) passing.
- [x] Pull Request automatically opened via `gh pr create` with structured summary and test evidence.
- [x] CI workflows verified 100% green before squash merging into `main`.

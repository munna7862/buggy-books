# Sprint 5.3: Performance Endurance, Soak Testing & Automated Baseline Regression Detection

**Sprint Identifier**: `SPRINT-5.3-PERFORMANCE-ENDURANCE-AND-BASELINE-REGRESSION`  
**Phase Mapping**: Phase 5 (Enterprise Quality Assurance, Ephemeral E2E Gates & Performance Baseline Regression)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Establish proactive detection of long-term system degradation and silent latency regressions by introducing k6 soak/endurance and capacity saturation breakpoint scenarios, augmenting `performance/report-perf-summary.js` with relative delta regression checks against git baselines (blocking PRs with > +20% degradation), and configuring a dedicated endurance workflow.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, velocity burndown tracking, and Definition of Done verification. |
| **SDET Architect** | AI Agent / SDET | Authoring k6 soak load (`soak-load.js`) and breakpoint capacity scenarios (`breakpoint-test.js`), implementing memory drift and latency thresholds. |
| **DevOps Engineer** | AI Agent / DevOps | Enhancing `report-perf-summary.js` with baseline comparison logic, enforcing > 20% latency regression failure exit codes, and creating `.github/workflows/perf-endurance.yml`. |
| **Product Owner** | Human PO / AI PO | Reviewing endurance benchmark metrics, capacity boundaries, and approving performance SLAs and sprint completion. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-PERF-501: k6 Endurance Soak & Capacity Breakpoint Testing
- **Story Statement**:  
  *As a* Performance Engineer & SRE,  
  *I want* long-duration soak tests (15–30 minutes) and ramping capacity breakpoint tests against the BuggyBooks backend,  
  *So that* memory leaks, event loop delays, and connection pool exhaustion are identified before releasing changes to production.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Create `performance/scenarios/soak-load.js`:
    - Simulate sustained 20–30 Virtual Users (VUs) for 15–30 minutes.
    - Measure memory consumption drift, garbage collection latency impacts, and HTTP response time stability over time.
    - Assert error rates remain `< 0.1%` and p95 latency does not drift upward over the test duration.
  - [ ] Create `performance/scenarios/breakpoint-test.js`:
    - Ramp VUs continuously from 1 to 200+ until error rates exceed 5% or p95 response time exceeds 1000ms.
    - Automatically output the breaking point concurrency threshold and primary bottleneck (CPU, memory, or DB lock).
  - [ ] Add npm scripts in `performance/package.json`:
    - `"test:perf:soak": "k6 run scenarios/soak-load.js"`
    - `"test:perf:breakpoint": "k6 run scenarios/breakpoint-test.js"`
  - [ ] Create `.github/workflows/perf-endurance.yml`:
    - Schedule weekly/nightly automated runs of `soak-load.js`.
    - Upload performance summaries and memory telemetry artifacts.
- **Acceptance Criteria**:
  - [ ] Soak scenario runs steadily for the designated duration without request drops, memory runaway, or latency degradation.
  - [ ] Breakpoint test clearly identifies the concurrency breaking point and logs actionable saturation diagnostics.

---

### User Story US-PERF-502: Automated Relative Baseline Regression Gate in CI
- **Story Statement**:  
  *As a* DevOps Engineer & Release Gatekeeper,  
  *I want* the CI performance benchmark job to compare pull request metrics against a baseline (`main` branch or committed benchmark reference) and fail if p95 latency degrades by more than 20%,  
  *So that* gradual performance erosion and inefficient database queries are blocked before merging.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Commit a golden performance baseline reference: `performance/baselines/baseline-perf.json` (captured from stable `main`).
  - [ ] Enhance `performance/report-perf-summary.js`:
    - Accept `--baseline=<path>` argument.
    - Compare current benchmark results against baseline metrics (`http_req_duration` avg, p90, p95).
    - Calculate percentage delta: `((current - baseline) / baseline) * 100`.
    - If delta exceeds `+20%` regression threshold on any critical endpoint, set exit code to `1`.
  - [ ] Format rich GitHub Actions Step Summary table:
    - Display Endpoint, Baseline (ms), Current (ms), Delta (%), and Status indicator (`🟢 PASS`, `🟡 WARNING`, `🔴 REGRESSION`).
  - [ ] Update `perf-benchmarks` job in `.github/workflows/ci.yml` to pass `--baseline=performance/baselines/baseline-perf.json`.
  - [ ] Document test cases `TC-PERF-004` (Endurance Soak Benchmark) and `TC-PERF-005` (Automated Baseline Regression Gate) in `specs/test_cases_catalog.md`.
- **Acceptance Criteria**:
  - [ ] A simulated +25% latency regression fails the `report-perf-summary.js` script with exit code 1 and flags the endpoint in the CI summary table.
  - [ ] Baseline comparisons under +20% delta pass cleanly and display green status indicators.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Validated that `soak-load.js` maintains stable VU pacing without inducing synthetic client-side throttling. Verified threshold assertions on memory and latency drift. | `[PENDING]` |
| **DevOps Code Review** | DevOps Engineer | Verified that `perf-benchmarks` in `ci.yml` compares against `baseline-perf.json` cleanly and that relative regression calculation handles new or missing endpoints gracefully. | `[PENDING]` |
| **PO Sprint Review** | Product Owner | Review endurance benchmark telemetry, verify baseline SLA enforcement (+20% gate), and issue sprint acceptance sign-off. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] `soak-load.js` and `breakpoint-test.js` created in `performance/scenarios/`.
- [ ] Golden baseline reference file created in `performance/baselines/baseline-perf.json`.
- [ ] `report-perf-summary.js` updated with baseline comparison, delta calculation, and failure threshold.
- [ ] Step summary markdown table updated with delta percentages and visual status indicators.
- [ ] Dedicated endurance workflow `.github/workflows/perf-endurance.yml` configured.
- [ ] Test cases catalog updated with `TC-PERF-004` and `TC-PERF-005`.
- [ ] Local baseline comparison verified with synthetic passing and failing runs.
- [ ] Pull Request opened and merged with conventional commits.

---

## 5. Sprint Verification Plan

```bash
# 1. Run local short soak verification
cd performance
npx k6 run --duration 1m --vus 5 scenarios/soak-load.js

# 2. Run local breakpoint test verification
npx k6 run --duration 30s scenarios/breakpoint-test.js

# 3. Verify baseline delta comparison in report-perf-summary.js
node report-perf-summary.js --baseline=baselines/baseline-perf.json

# 4. Verify intentional failure when baseline is violated (> 20% delta)
# Simulate degraded results and ensure exit code 1
node report-perf-summary.js --baseline=baselines/baseline-perf.json --regression-test
```

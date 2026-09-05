# Sprint 4.3: Performance Runner Resilience & Consolidated Test Reporting

**Sprint Identifier**: `SPRINT-4.3-PERF-RESILIENCE-AND-REPORTING`  
**Phase Mapping**: Phase 4 (CI/CD Pipeline Optimization, Artifact Caching & Fast-Feedback Gates)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Enhance performance testing stability by decoupling heavy 50-VU k6 load benchmarks from PR gates, introducing a lightweight PR performance smoke check, and consolidating automated test result summaries and coverage annotations into GitHub Actions.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint burndown, Phase 4 milestone review, and master plan closure. |
| **DevOps Engineer** | AI Agent / DevOps | Implementing workflow triggers, GitHub Actions Step Summaries (`$GITHUB_STEP_SUMMARY`), and test report upload artifacts. |
| **SDET Architect** | AI Agent / SDET | Authoring lightweight k6 smoke scenario (`smoke-load.js`) for PR gates, retaining 50-VU stress benchmarks for `main` and scheduled runs. |
| **Product Owner** | Human PO / AI PO | Final acceptance review of Phase 4 and formal milestone sign-off. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-PERF-401: Tiered Performance Gates (PR Smoke vs. Main Stress)
- **Story Statement**:  
  *As a* Performance Engineer / SDET,  
  *I want* pull requests to run a fast, low-footprint API smoke benchmark (5-10 VUs) while reserving full 50-VU stress benchmarks for `main` and scheduled runs,  
  *So that* pull requests are protected against latency regressions without suffering flakiness from shared CI runner CPU throttling.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Add condition to `perf-benchmarks` in `ci.yml`:
    - On pull request: Run short 5-VU smoke benchmark (`performance/k6/catalog-load.js` with `--vus 5 --duration 10s`).
    - On `main` push: Run full 50-VU load and stress benchmarks (`catalog-load.js` and `inventory-stress.js`).
  - [ ] Tune k6 threshold tolerance slightly for virtualized CI runners to eliminate false-positive flakiness (`http_req_failed < 0.02`).
  - [ ] Output k6 summary metrics directly to `$GITHUB_STEP_SUMMARY`.
- **Acceptance Criteria**:
  - [ ] PR performance job completes in under 30 seconds.
  - [ ] Flaky false-positive threshold failures on shared GitHub Actions runners drop to zero.

---

### User Story US-OPS-405: Consolidated Test Reporting & Coverage Artifacts
- **Story Statement**:  
  *As a* Developer / QA Specialist,  
  *I want* test results from Jest, Vitest, and Lighthouse to generate structured GitHub Actions job summaries and downloadable report artifacts,  
  *So that* failing test assertions can be inspected directly in the GitHub PR view without sifting through raw terminal logs.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Add coverage reporting configuration to backend Jest (`jest --coverage --coverageReporters=text,lcov`).
  - [ ] Add coverage reporting configuration to frontend Vitest (`vitest run --coverage`).
  - [ ] Upload coverage and test summary artifacts via `actions/upload-artifact@v4`.
  - [ ] Write consolidated markdown test summary table to `$GITHUB_STEP_SUMMARY`.
- **Acceptance Criteria**:
  - [ ] Test summaries display pass/fail counts directly on the GitHub Actions workflow run summary page.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Verified that Step Summaries format cleanly in GitHub GFM markdown. Validated that artifact retention policies prevent runner quota bloat. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Confirmed that PR smoke benchmark still validates endpoint health and status codes without subjecting the runner to 50 concurrent VUs. | `[PENDING]` |
| **PO Phase 4 Review** | Product Owner | Verify full completion of Phase 4 deliverables: pipeline deduplication, fast parallel quality gates, and resilient performance testing. Close milestone. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] Tiered k6 benchmark execution configured in `ci.yml` (smoke for PRs, full stress for `main`).
- [ ] k6 performance metrics written to `$GITHUB_STEP_SUMMARY`.
- [ ] Test summary and coverage artifacts configured for Jest and Vitest.
- [ ] End-to-end local simulation passes cleanly.
- [ ] Phase 4 criteria fully satisfied in `planning/Phases/phase_4_cicd_optimization_and_fast_feedback.md`.
- [ ] Changes committed with conventional commits on feature branch.
- [ ] Phase 4 sign-off issued by Product Owner.

---

## 5. Sprint Verification Plan

```bash
# 1. Run local k6 smoke test
node performance/run-k6.js performance/k6/catalog-load.js --vus 5 --duration 10s

# 2. Run local unit test suites with coverage
cd backend && npm test -- --coverage
cd ../frontend && npm test -- --coverage

# 3. Verify Lighthouse reports remain intact
npx @lhci/cli autorun
```

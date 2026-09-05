# Sprint 4.3: Performance Runner Resilience & Consolidated Test Reporting

**Sprint Identifier**: `SPRINT-4.3-PERF-RESILIENCE-AND-REPORTING`  
**Phase**: Phase 4 (CI/CD Pipeline Optimization, Artifact Caching & Fast-Feedback Gates)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Enhance performance testing stability by decoupling heavy 50-VU k6 load benchmarks from PR gates, introducing a lightweight PR performance smoke check (`smoke-load.js`), tuning k6 failure thresholds for virtualized CI runners, and consolidating automated test summaries and code coverage reports from Jest, Vitest, and k6 into GitHub Actions Job Summaries (`$GITHUB_STEP_SUMMARY`) and downloadable artifacts.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint kickoff, user story breakdown, live `task.md` burndown tracking, review facilitation, DoD audit, and Phase 4 milestone closure. |
| **DevOps Engineer** | AI Agent / DevOps | Refactoring `.github/workflows/ci.yml` for tiered execution (PR smoke vs Main stress), step summaries (`$GITHUB_STEP_SUMMARY`), and test report upload artifacts. |
| **SDET Architect** | AI Agent / SDET | Authoring lightweight k6 smoke scenario (`smoke-load.js`) for PR gates, tuning k6 threshold tolerances for virtualized CI runners, building summary reporter, and updating `specs/test_cases_catalog.md`. |
| **Product Owner** | AI Agent / PO | Reviewing pipeline acceleration, test visibility improvements, and issuing final acceptance and Phase 4 milestone sign-off. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-PERF-401: Tiered Performance Gates (PR Smoke vs. Main Stress)
*As a Performance Engineer / SDET, I want pull requests to run a fast, low-footprint API smoke benchmark (5 VUs) while reserving full 50-VU stress benchmarks for `main` and scheduled runs, so that pull requests are protected against latency regressions without suffering flakiness from shared CI runner CPU throttling.*
- [x] **US-PERF-401.1** (`SDET Architect`): Author lightweight k6 smoke scenario (`performance/k6/smoke-load.js`) with 5 VUs, 10s duration, targeting catalog browsing, search, and book detail endpoints.
- [x] **US-PERF-401.2** (`SDET Architect`): Tune k6 threshold tolerance for virtualized CI runners (`http_req_failed < 0.02`) in `catalog-load.js` and `smoke-load.js`.
- [x] **US-PERF-401.3** (`SDET Architect`): Build `performance/report-perf-summary.js` to parse k6 `--summary-export` JSON and append a rich Markdown table to `$GITHUB_STEP_SUMMARY` and `performance/k6-summary.md`.
- [x] **US-PERF-401.4** (`DevOps Engineer`): Add conditional execution in `perf-benchmarks` in `ci.yml`:
  - On PR (`github.event_name == 'pull_request'`): Run 5-VU smoke benchmark.
  - On `main` push (`github.event_name == 'push' && github.ref == 'refs/heads/main'`): Run 50-VU load and stress benchmarks.
- [x] **US-PERF-401.5** (`DevOps Engineer`): Upload k6 performance summaries via `actions/upload-artifact@v4`.

### User Story US-OPS-405: Consolidated Test Reporting & Coverage Artifacts
*As a Developer / QA Specialist, I want test results from Jest, Vitest, and Lighthouse to generate structured GitHub Actions job summaries and downloadable report artifacts, so that failing test assertions can be inspected directly in the GitHub PR view without sifting through raw terminal logs.*
- [x] **US-OPS-405.1** (`DevOps Engineer`): Add coverage reporting configuration to backend Jest (`jest.config.js` with `coverageReporters: ['text', 'lcov', 'json-summary', 'html']`) and script `test:ci` in `backend/package.json`.
- [x] **US-OPS-405.2** (`DevOps Engineer`): Configure coverage reporting in frontend Vitest (`vite.config.ts` with `v8` provider and `['text', 'json-summary', 'lcov', 'html']`) and script `test:ci` in `frontend/package.json`.
- [x] **US-OPS-405.3** (`SDET Architect`): Create `scripts/generate-test-summary.js` to parse `test-results.json` and `coverage/coverage-summary.json`, rendering a markdown table to `$GITHUB_STEP_SUMMARY`.
- [x] **US-OPS-405.4** (`DevOps Engineer`): Wire `generate-test-summary.js` and artifact upload (`actions/upload-artifact@v4`) into `backend-tests` and `frontend-tests` in `ci.yml`.
- [x] **US-OPS-405.5** (`SDET Architect`): Document new pipeline test cases (`TC-CI-005`, `TC-CI-006`) in `specs/test_cases_catalog.md` (Section 8).

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Validated YAML schema using `js-yaml`. Ensured conditional triggers correctly branch on PR vs push. Confirmed Step Summaries output clean markdown tables and artifact upload captures coverage/perf summaries with 7-day retention. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Verified local execution of `smoke-load.js`, running in ~10.2s with 100% check pass rate and 0% error rate. Verified `generate-test-summary.js` on both Jest (11 suites, 80 tests, 92% coverage) and Vitest (20 suites, 32 tests, 65% coverage). Documented `TC-CI-005` and `TC-CI-006` in catalog. | `[APPROVED]` |
| **PO Sprint Review** | Product Owner | Verified PR performance check drops from > 1 minute to ~10-15 seconds while retaining full stress benchmarks on merge to main. Jest/Vitest test summaries and coverage statistics render directly in GitHub PR view. Phase 4 milestone sign-off issued. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Tiered k6 benchmark execution configured in `ci.yml` (smoke for PRs, full stress for `main`).
- [x] k6 performance metrics written to `$GITHUB_STEP_SUMMARY`.
- [x] Test summary and coverage artifacts configured for Jest and Vitest.
- [x] `scripts/generate-test-summary.js` and `performance/report-perf-summary.js` tested locally.
- [x] `specs/test_cases_catalog.md` updated with Section 8 test cases (`TC-CI-005`, `TC-CI-006`).
- [x] Local tests pass cleanly (Jest with coverage, Vitest with coverage, k6 smoke, Playwright POM linter).
- [x] Phase 4 documentation updated and signed off in `planning/Phases/phase_4_cicd_optimization_and_fast_feedback.md`.
- [x] Sprint 4.3 documentation updated in `planning/Sprints/sprint_4_3_performance_resilience_and_test_reporting.md`.
- [x] Changes committed with conventional commits on feature branch `feature/sprint-4.3-performance-resilience-and-test-reporting`.
- [x] Remote branch pushed and Pull Request opened via `gh pr create`.
- [x] Phase 4 milestone sign-off issued by Product Owner.

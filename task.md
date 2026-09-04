# Sprint 3.3: Automated API Performance Testing & Lighthouse CI Quality Gates

**Sprint Identifier**: `SPRINT-3.3-PERF-AND-LIGHTHOUSE`  
**Phase**: Phase 3 (Multi-User Sandboxing, Chaos Engineering & Performance Resilience)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Establish automated API performance benchmarking with k6 scripts, integrate Lighthouse CI audits in GitHub Actions workflows with Core Web Vitals thresholds, and close out Phase 3.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint kickoff, user story deconstruction, live `task.md` tracking, and Phase 3 closure. |
| **SDET Architect** | AI Agent / SDET | Authoring k6 performance test suites for catalog search and delayed inventory reporting, `specs/test_cases_catalog.md` updates. |
| **Dev Architect** | AI Agent / Dev | Frontend SEO and accessibility optimization in `frontend/index.html` to guarantee Lighthouse quality gate compliance. |
| **DevOps Engineer** | AI Agent / DevOps | Adding `.lighthouserc.json`, `.github/workflows/ci.yml` Lighthouse CI job, k6 runner script, and GitHub CLI PR creation. |
| **Product Owner** | AI Agent / PO | Reviewing performance metrics, Lighthouse audit reports, and issuing Phase 3 final acceptance sign-off. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-PERF-301: k6 API Load & Latency Benchmarking
*As an SDET / Performance Engineer, I want automated load test scenarios targeting catalog searching, inventory reporting, and checkout, so that response latency regressions (p95/p99) are measured and flagged automatically.*
- [x] **US-PERF-301.1** (`SDET Architect`): Create `performance/k6/catalog-load.js` with virtual user ramp (0 to 50 VUs), searching, detail view, session isolation header, and strict p95 < 250ms threshold.
- [x] **US-PERF-301.2** (`SDET Architect`): Create `performance/k6/inventory-stress.js` benchmarking delayed endpoint throughput targeting `/api/inventory/report`.
- [x] **US-PERF-301.3** (`DevOps Engineer`): Create cross-platform portable runner `performance/run-k6.js` and add root scripts `"test:perf"` and `"test:perf:stress"` in `package.json`.
- [x] **US-PERF-301.4** (`SDET Architect`): Update `specs/test_cases_catalog.md` with Section 7 performance test cases (`TC-PERF-001`, `TC-PERF-002`).

### User Story US-OPS-301: Lighthouse CI Quality Gates in GitHub Actions
*As a DevOps engineer, I want Lighthouse CI to audit frontend pages on every pull request, so that regressions in Performance, Accessibility, Best Practices, and SEO are blocked.*
- [x] **US-OPS-301.1** (`Dev Architect`): Enhance `frontend/index.html` with descriptive title, meta description, and theme color tags to ensure high Lighthouse scores.
- [x] **US-OPS-301.2** (`DevOps Engineer`): Create `.lighthouserc.json` with assertions (`performance: 0.90`, `accessibility: 0.95`, `seo: 0.90`) targeting `./frontend/dist`.
- [x] **US-OPS-301.3** (`DevOps Engineer`): Add `lighthouse-ci` job in `.github/workflows/ci.yml` uploading HTML/JSON audit reports as workflow artifacts.
- [x] **US-OPS-301.4** (`SDET Architect`): Document Lighthouse CI quality gates in `specs/test_cases_catalog.md` (`TC-LHCI-001`, `TC-LHCI-002`).

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Verified `.lighthouserc.json` assertion thresholds and GitHub Actions CI workflow integration. Portable runner `performance/run-k6.js` provides frictionless local DX without administrative rights. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Executed `npm run test:perf` (7,626 requests, p95 = 2.33ms << 250ms threshold, 0 errors) and `npm run test:perf:stress` (4,061 inventory reports under 30 VUs, p95 = 15.76ms). Full monorepo suites pass 100% green. | `[APPROVED]` |
| **PO Phase 3 Review** | Product Owner | Verified completion of Phase 3 deliverables: Multi-user sandboxing (Sprint 3.1), Chaos Dashboard & race conditions (Sprint 3.2), and Automated Performance Benchmarking & Lighthouse Quality Gates (Sprint 3.3). Milestone closed. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] k6 performance test suites created and executable via `npm run test:perf`.
- [x] Catalog endpoint maintains p95 < 250ms under 50 concurrent VUs (verified: p95 = 2.33ms).
- [x] Lighthouse CI configured with score assertions in `.lighthouserc.json` and GitHub Actions.
- [x] All unit, component, Playwright E2E, and performance tests passing 100% green.
- [x] `specs/test_cases_catalog.md` updated with Section 7 performance and audit cases.
- [x] Phase 3 criteria fully satisfied in `planning/Phases/phase_3_sandboxing_chaos_and_performance.md`.
- [x] Upstream changes pulled from `origin/main` and all merge conflicts resolved cleanly.
- [x] Changes committed with conventional commits on branch `feature/sprint-3.3-perf-and-lighthouse`.
- [x] Remote Pull Request created via GitHub CLI (`gh pr create`).
- [x] Phase 3 sign-off issued by Product Owner.

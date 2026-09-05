# Sprint 5.1: Ephemeral Playwright E2E Smoke Gate & Strict Failure Enforcement

**Sprint Identifier**: `SPRINT-5.1-EPHEMERAL-E2E-SMOKE-AND-STRICT-GATES`  
**Phase Mapping**: Phase 5 (Enterprise Quality Assurance, Ephemeral E2E Gates & Performance Baseline Regression)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Eliminate browser testing blind spots on pull requests by integrating a containerized/ephemeral Playwright `@smoke` gate in `ci.yml` Stage 3, removing `continue-on-error: true` failure suppression from all Playwright workflows, and establishing a formal `@quarantine` pattern for non-deterministic tests.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, and DoD audit. |
| **DevOps Engineer** | AI Agent / DevOps | Adding the `e2e-smoke` job to `.github/workflows/ci.yml` utilizing pre-built `dist` artifacts, removing `continue-on-error: true` in `playwright-ci.yml` and `playwright-docker.yml`. |
| **SDET Architect** | AI Agent / SDET | Tagging core critical user journeys with `@smoke`, defining the `@quarantine` tag filtering mechanism, and configuring failure trace/screenshot artifact uploads. |
| **Product Owner** | Human PO / AI PO | Acceptance review of PR gate reliability and zero-tolerance failure enforcement. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-501: Ephemeral Playwright E2E Smoke Gate on Pull Requests
- **Story Statement**:  
  *As a* QA Lead & Software Engineer,  
  *I want* pull requests to run an ephemeral Playwright `@smoke` test suite against locally spun-up backend and frontend preview instances,  
  *So that* regressions in UI routing, DOM interactions, and core shopping flows are caught and blocked before merging into `main`.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Add `e2e-smoke` job under Stage 3 in `.github/workflows/ci.yml`:
    - Depend on `backend-build` and `frontend-build` (`needs: [backend-build, frontend-build]`).
    - Download `backend-dist` and `frontend-dist` artifacts.
    - Start backend on `http://127.0.0.1:4000` and frontend preview on `http://127.0.0.1:5173`.
    - Wait for health check with `npx wait-on`.
  - [ ] Execute `npx playwright test --grep "@smoke" --workers=2` in `e2e-smoke`.
  - [ ] Upload Playwright failure traces, videos, and screenshots on failure (`if: failure()`).
- **Acceptance Criteria**:
  - [ ] Pull requests execute real browser smoke automation in under 60 seconds.
  - [ ] PR is blocked if any `@smoke` test assertion fails.

---

### User Story US-QA-502: Strict Quality Gate Enforcement & Flaky Test Quarantine
- **Story Statement**:  
  *As a* Release Engineer,  
  *I want* all Playwright workflows to fail when assertions fail instead of silently continuing, and to quarantine flaky tests into a non-blocking lane,  
  *So that* green GitHub checks genuinely guarantee test success.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Remove `continue-on-error: true` from `test` job in `.github/workflows/playwright-ci.yml`.
  - [ ] Remove `continue-on-error: true` from `test` job in `.github/workflows/playwright-docker.yml`.
  - [ ] Configure `if: always()` on Allure report generation and artifact upload steps so reports are always generated regardless of pass/fail outcome.
  - [ ] Establish `@quarantine` tag filtering (`--grep-invert "@quarantine"`) for mainline blocking gates.
  - [ ] Document test case `TC-CI-007` (Ephemeral E2E Smoke Gate) and `TC-CI-008` (Strict Failure Gate & Quarantine) in `specs/test_cases_catalog.md`.
- **Acceptance Criteria**:
  - [ ] Zero instances of `continue-on-error: true` remain on test execution steps.
  - [ ] A failed Playwright test marks the GitHub workflow run as failed (`conclusion: failure`).

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Verified that `e2e-smoke` operates concurrently with `lighthouse-ci` and `perf-benchmarks` in Stage 3 without adding sequential pipeline lag. Confirmed that removing `continue-on-error: true` preserves Allure deployment via `if: always()`. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Audited `@smoke` test execution duration across the catalog, checkout, and auth flows. Confirmed that failure artifacts (Playwright traces and screenshots) are uploaded as downloadable artifacts on failure. | `[PENDING]` |
| **PO Sprint Review** | Product Owner | Review PR gate reliability and verify that breaking UI changes cannot merge into `main` unnoticed. Issue sprint acceptance. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] `e2e-smoke` job configured in `.github/workflows/ci.yml` running against pre-built artifacts.
- [ ] `continue-on-error: true` removed from `playwright-ci.yml` and `playwright-docker.yml`.
- [ ] Allure reporting and artifact uploads configured with `if: always()`.
- [ ] `@quarantine` test exclusion flag configured.
- [ ] Test failure trace and screenshot capture validated on intentional test failure.
- [ ] Test cases catalog updated (`TC-CI-007`, `TC-CI-008`).
- [ ] End-to-end local simulation passes cleanly.
- [ ] Pull Request opened and merged with conventional commits.

---

## 5. Sprint Verification Plan

```bash
# 1. Simulate local ephemeral E2E smoke run against pre-built artifacts
npm run build --prefix backend
npm run build --prefix frontend
# Start background servers
node backend/dist/server.js &
npx vite preview --prefix frontend --port 5173 &
# Run smoke tests
cd playwright-e2e && npx playwright test --grep "@smoke" --workers=2

# 2. Validate YAML workflow syntax
node -e "require('./backend/node_modules/js-yaml').load(require('fs').readFileSync('.github/workflows/ci.yml', 'utf8'))"
```

# Sprint 2.3: CI/CD Pipeline Staging & Quality Gate Enforcement

**Sprint Identifier**: `SPRINT-2.3-CICD-STAGING`  
**Phase Mapping**: Phase 2 (Test Automation Modernization & CI/CD Resilience)  
**Estimated Velocity**: 3 Story Points  
**Sprint Goal**: Optimize GitHub Actions CI workflows to enforce frontend/backend linting, stage fast failure gates (Lint/Build → Unit Tests → Playwright E2E), and prepare Phase 2 for release sign-off.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint burndown, Phase 2 milestone closure. |
| **DevOps Engineer** | AI Agent / DevOps | Updating `.github/workflows/ci.yml`, configuring workflow job dependencies, Playwright browser caching, and PR creation. |
| **SDET Architect** | AI Agent / SDET | Verifying CI pipeline simulation, test execution, POM static rules, and Allure reporting. |
| **Product Owner** | Human PO / AI PO | Conducting Phase 2 Acceptance Review & Final Authorization. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-OPS-201: Integrate Linting in CI Pipelines
- **Story Statement**:  
  *As a* DevOps engineer,  
  *I want* `.github/workflows/ci.yml` to run `npm run lint` for both frontend and backend on all PRs,  
  *So that* unformatted or rule-violating code is automatically blocked before merging.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [x] Add `npm run lint` step under `frontend-tests` job in `.github/workflows/ci.yml`.
  - [x] Add `npm run lint` step under `backend-tests` job in `.github/workflows/ci.yml`.
  - [x] Add `frontend-build` step (`npm run build`) in CI workflow.
- **Acceptance Criteria**:
  - [x] Any PR with an ESLint error is rejected by GitHub Actions CI.

---

### User Story US-OPS-202: Fast-Feedback CI Pipeline Staging
- **Story Statement**:  
  *As a* software team,  
  *I want* CI jobs to stage sequentially (Fast Gates: Lint/Build → Unit Tests → E2E Suites),  
  *So that* we save GitHub Actions runner minutes by failing fast on static and unit errors.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] Configure `needs: [backend-tests, frontend-tests, backend-build, frontend-build]` on downstream E2E workflow triggers.
  - [x] Configure Playwright browser caching in `.github/workflows/playwright-ci.yml`.
- **Acceptance Criteria**:
  - [x] Playwright E2E test jobs only trigger if unit tests and linting pass.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Inspected YAML syntax and action runner versions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`). Staged fast-failure execution graph configured. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Verified local and CI test execution parity. All unit suites (Jest + Vitest) and POM encapsulation rules (29/29) passing 100% green. | `[APPROVED]` |
| **PO Phase 2 Review** | Product Owner | Completed Phase 2 Acceptance Review. CI quality gates and browser caching verified. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `.github/workflows/ci.yml` updated with frontend/backend linting and build checks.
- [x] Pipeline staged for fast failure feedback.
- [x] Playwright browser caching configured with dynamic version extraction.
- [x] Local simulation of full CI suite passes cleanly.
- [x] Phase 2 criteria fully satisfied.
- [x] Changes committed and PR submitted via `gh pr create`.
- [x] Phase 2 sign-off issued by Product Owner.

---

## 5. Sprint Verification Plan

```bash
# 1. Local CI Simulation
npm run typecheck
npm run lint
npm run test:unit
cd playwright-e2e && npm run finalize-spec -- src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts
```

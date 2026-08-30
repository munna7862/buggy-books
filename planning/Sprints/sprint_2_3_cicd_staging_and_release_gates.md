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
| **DevOps Engineer** | AI Agent / DevOps | Updating `.github/workflows/ci.yml`, configuring workflow job dependencies. |
| **SDET Architect** | AI Agent / SDET | Verifying CI pipeline test execution and Allure report generation. |
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
  - [ ] Add `npm run lint` step under `frontend-tests` job in `.github/workflows/ci.yml`.
  - [ ] Add `npm run lint` step under `backend-tests` job in `.github/workflows/ci.yml`.
  - [ ] Add `frontend-build` step (`npm run build`) in CI workflow.
- **Acceptance Criteria**:
  - [ ] Any PR with an ESLint error is rejected by GitHub Actions CI.

---

### User Story US-OPS-202: Fast-Feedback CI Pipeline Staging
- **Story Statement**:  
  *As a* software team,  
  *I want* CI jobs to stage sequentially (Fast Gates: Lint/Build → Unit Tests → E2E Suites),  
  *So that* we save GitHub Actions runner minutes by failing fast on static and unit errors.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Configure `needs: [backend-tests, frontend-tests, backend-build]` on downstream E2E workflow triggers.
  - [ ] Configure Playwright browser caching in `.github/workflows/playwright-ci.yml`.
- **Acceptance Criteria**:
  - [ ] Playwright E2E test jobs only trigger if unit tests and linting pass.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Inspect YAML syntax and action runner versions (`actions/checkout@v4`). | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Verify local and CI test execution parity. | `[PENDING]` |
| **PO Phase 2 Review** | Product Owner | Complete Phase 2 Acceptance Review. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] `.github/workflows/ci.yml` updated with frontend/backend linting and build checks.
- [ ] Pipeline staged for fast failure feedback.
- [ ] Local simulation of full CI suite passes cleanly.
- [ ] Phase 2 criteria fully satisfied.
- [ ] Changes committed and PR submitted via `gh pr create`.
- [ ] Phase 2 sign-off issued by Product Owner.

---

## 5. Sprint Verification Plan

```bash
# 1. Local CI Simulation
npm run typecheck
npm run lint
npm run test:unit
cd playwright-e2e && npm run finalize-spec -- src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts run
```

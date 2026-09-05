# Sprint 4.1: Pipeline Deduplication & Build Artifact Sharing

**Sprint Identifier**: `SPRINT-4.1-DEDUPLICATION-AND-ARTIFACTS`  
**Phase Mapping**: Phase 4 (CI/CD Pipeline Optimization, Artifact Caching & Fast-Feedback Gates)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Eliminate redundant build and installation cycles in `.github/workflows/ci.yml` by introducing artifact caching between build and test jobs, standardizing on deterministic `npm ci`, and removing duplicate TypeScript compilation from the E2E quality gate.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog orchestration, burndown tracking, task status updates in `task.md`. |
| **DevOps Engineer** | AI Agent / DevOps | Refactoring `.github/workflows/ci.yml` to upload and download `dist` artifacts, updating package installation commands to `npm ci`. |
| **SDET Architect** | AI Agent / SDET | Verifying downstream consumption of pre-built artifacts by Lighthouse CI and k6 benchmarks, validating `finalize-spec.ts` single-invocation typechecking. |
| **Dev Architect** | AI Agent / Dev | Validating frontend and backend production build outputs (`dist/`) compatibility across jobs. |
| **Product Owner** | Human PO / AI PO | Acceptance review and sprint milestone sign-off. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-OPS-401: Build Artifact Sharing Across Pipeline Jobs
- **Story Statement**:  
  *As a* DevOps Engineer,  
  *I want* `frontend-build` and `backend-build` to upload their compiled `dist` directories as GitHub Actions artifacts,  
  *So that* downstream jobs (`lighthouse-ci` and `perf-benchmarks`) do not need to re-install dependencies or re-compile the source code.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Add `actions/upload-artifact@v4` step to `backend-build` uploading `backend/dist` (retention: 1 day).
  - [ ] Add `actions/upload-artifact@v4` step to `frontend-build` uploading `frontend/dist` (retention: 1 day).
  - [ ] Update `lighthouse-ci` job:
    - Download `frontend-dist` artifact into `frontend/dist`.
    - Eliminate `cd frontend && npm install && npm run build`.
    - Run `npx @lhci/cli autorun` directly against the pre-built `frontend/dist`.
  - [ ] Update `perf-benchmarks` job:
    - Download `backend-dist` artifact into `backend/dist`.
    - Replace `npm ci && npm run build` with `npm ci --omit=dev` (production dependencies only) or direct runtime execution.
- **Acceptance Criteria**:
  - [ ] Neither `lighthouse-ci` nor `perf-benchmarks` executes `npm run build`.
  - [ ] Total runtime of `lighthouse-ci` and `perf-benchmarks` reduced by at least 45 seconds each.

---

### User Story US-OPS-402: Deterministic Dependency Installation & Linter Deduplication
- **Story Statement**:  
  *As an* SDET & DevOps Engineer,  
  *I want* all jobs to install dependencies via `npm ci` and remove duplicate compiler checks in `e2e-quality-gate`,  
  *So that* dependency resolution is deterministic and compiler executions are not duplicated.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Change `npm install` to `npm ci` in `frontend-tests` and `frontend-build`.
  - [ ] Remove `run: npx tsc --noEmit` from `e2e-quality-gate` in `ci.yml`.
  - [ ] Verify that `npm run finalize-spec -- --all-poms` continues to run `runTypeScriptCheck()` internally without losing typecheck coverage.
- **Acceptance Criteria**:
  - [ ] No occurrences of `npm install` remain in `.github/workflows/ci.yml`.
  - [ ] `e2e-quality-gate` runs `tsc --noEmit` exactly once via `finalize-spec.ts`.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Validate artifact upload/download actions compatibility with GitHub Actions v4 specifications. Verify retention periods prevent disk quota bloat. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Verify that pre-built `dist` retains all sourcemaps, static assets, and manifest files required for Lighthouse assertions and k6 HTTP server serving. | `[PENDING]` |
| **PO Sprint Review** | Product Owner | Review speedup metrics and ensure no regression in quality gate pass criteria. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] `.github/workflows/ci.yml` updated with `actions/upload-artifact@v4` and `actions/download-artifact@v4`.
- [ ] All instances of `npm install` replaced with `npm ci`.
- [ ] Redundant `npx tsc --noEmit` removed from `e2e-quality-gate`.
- [ ] `lighthouse-ci` runs cleanly against downloaded `frontend/dist`.
- [ ] `perf-benchmarks` boots `dist/server.js` cleanly from downloaded `backend/dist`.
- [ ] Local build and CI validation pass 100% green.
- [ ] Conventional commit created on feature branch.

---

## 5. Sprint Verification Plan

```bash
# 1. Verify clean builds and deterministic package installation
cd backend && npm ci && npm run build
cd ../frontend && npm ci && npm run build
cd ../playwright-e2e && npm ci

# 2. Verify POM architecture linter and internal tsc check
npm run finalize-spec -- --all-poms

# 3. Verify Lighthouse CI runs against pre-built dist
cd .. && npx @lhci/cli autorun
```

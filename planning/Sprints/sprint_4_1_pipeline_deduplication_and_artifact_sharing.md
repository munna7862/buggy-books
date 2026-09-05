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
  - [x] Add `actions/upload-artifact@v4` step to `backend-build` uploading `backend/dist` (retention: 1 day).
  - [x] Add `actions/upload-artifact@v4` step to `frontend-build` uploading `frontend/dist` (retention: 1 day).
  - [x] Update `lighthouse-ci` job:
    - Download `frontend-dist` artifact into `frontend/dist`.
    - Eliminate `cd frontend && npm install && npm run build`.
    - Run `npx @lhci/cli autorun` directly against the pre-built `frontend/dist`.
  - [x] Update `perf-benchmarks` job:
    - Download `backend-dist` artifact into `backend/dist`.
    - Replace `npm ci && npm run build` with `npm ci --omit=dev` (production dependencies only) or direct runtime execution.
- **Acceptance Criteria**:
  - [x] Neither `lighthouse-ci` nor `perf-benchmarks` executes `npm run build`.
  - [x] Total runtime of `lighthouse-ci` and `perf-benchmarks` reduced by at least 45 seconds each.

---

### User Story US-OPS-402: Deterministic Dependency Installation & Linter Deduplication
- **Story Statement**:  
  *As an* SDET & DevOps Engineer,  
  *I want* all jobs to install dependencies via `npm ci` and remove duplicate compiler checks in `e2e-quality-gate`,  
  *So that* dependency resolution is deterministic and compiler executions are not duplicated.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [x] Change `npm install` to `npm ci` in `frontend-tests` and `frontend-build`.
  - [x] Remove `run: npx tsc --noEmit` from `e2e-quality-gate` in `ci.yml`.
  - [x] Verify that `npm run finalize-spec -- --all-poms` continues to run `runTypeScriptCheck()` internally without losing typecheck coverage.
- **Acceptance Criteria**:
  - [x] No occurrences of `npm install` remain in `.github/workflows/ci.yml`.
  - [x] `e2e-quality-gate` runs `tsc --noEmit` exactly once via `finalize-spec.ts`.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Validated `actions/upload-artifact@v4` and `actions/download-artifact@v4` implementation in `.github/workflows/ci.yml`. 1-day retention set to prevent disk quota bloat, explicit artifact path mapping configured, and zero `npm install` occurrences verified. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Validated that pre-built `dist` maintains full integrity. Ran `finalize-spec -- --all-poms` verifying 33/33 checks with single-invocation TypeScript compilation. Ran k6 API load benchmarks (7,662 requests, p95 = 1.53ms, 0 errors) executing directly against pre-built `dist/server.js`. | `[APPROVED]` |
| **PO Sprint Review** | Product Owner | Verified elimination of duplicate compilation cycles across `ci.yml`, deterministic `npm ci` adoption, and zero regression across backend/frontend test suites. Sprint 4.1 accepted. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `.github/workflows/ci.yml` updated with `actions/upload-artifact@v4` and `actions/download-artifact@v4`.
- [x] All instances of `npm install` replaced with `npm ci`.
- [x] Redundant `npx tsc --noEmit` removed from `e2e-quality-gate`.
- [x] `lighthouse-ci` runs cleanly against downloaded `frontend/dist`.
- [x] `perf-benchmarks` boots `dist/server.js` cleanly from downloaded `backend/dist`.
- [x] Local build and CI validation pass 100% green.
- [x] Conventional commit created on feature branch.

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

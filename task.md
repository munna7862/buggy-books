# Sprint 4.1: Pipeline Deduplication & Build Artifact Sharing

**Sprint Identifier**: `SPRINT-4.1-DEDUPLICATION-AND-ARTIFACTS`  
**Phase**: Phase 4 (CI/CD Pipeline Optimization, Artifact Caching & Fast-Feedback Gates)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Eliminate redundant build and installation cycles in `.github/workflows/ci.yml` by introducing artifact caching between build and test jobs, standardizing on deterministic `npm ci`, and removing duplicate TypeScript compilation from the E2E quality gate.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint kickoff, user story deconstruction, live `task.md` burndown tracking, handoff orchestration. |
| **DevOps Engineer** | AI Agent / DevOps | Refactoring `.github/workflows/ci.yml` to upload and download `dist` artifacts, updating package installation commands to `npm ci`, eliminating redundant build steps. |
| **SDET Architect** | AI Agent / SDET | Verifying downstream consumption of pre-built artifacts by Lighthouse CI and k6 benchmarks, validating `finalize-spec.ts` single-invocation typechecking, updating `specs/test_cases_catalog.md`. |
| **Dev Architect** | AI Agent / Dev | Validating frontend and backend production build outputs (`dist/`) compatibility across jobs. |
| **Security Officer** | AI Agent / Security | Reviewing artifact retention, permissions, and ensuring zero secret leaks or elevated privileges in workflow steps. |
| **Product Owner** | AI Agent / PO | Acceptance review and sprint milestone sign-off. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-OPS-401: Build Artifact Sharing Across Pipeline Jobs
*As a DevOps Engineer, I want `frontend-build` and `backend-build` to upload their compiled `dist` directories as GitHub Actions artifacts, so that downstream jobs (`lighthouse-ci` and `perf-benchmarks`) do not need to re-install dependencies or re-compile the source code.*
- [x] **US-OPS-401.1** (`DevOps Engineer`): Add `actions/upload-artifact@v4` step to `backend-build` uploading `backend/dist` with `name: backend-dist` and `retention-days: 1`.
- [x] **US-OPS-401.2** (`DevOps Engineer`): Add `actions/upload-artifact@v4` step to `frontend-build` uploading `frontend/dist` with `name: frontend-dist` and `retention-days: 1`.
- [x] **US-OPS-401.3** (`DevOps Engineer`): Refactor `lighthouse-ci` job:
  - Add `actions/download-artifact@v4` step downloading `frontend-dist` into `frontend/dist`.
  - Remove redundant `npm install` and `npm run build` steps.
  - Execute `npx @lhci/cli autorun` directly against the downloaded `frontend/dist`.
- [x] **US-OPS-401.4** (`DevOps Engineer`): Refactor `perf-benchmarks` job:
  - Add `actions/download-artifact@v4` step downloading `backend-dist` into `backend/dist`.
  - Replace `npm ci && npm run build` with `npm ci --omit=dev` (production runtime dependencies only).
  - Boot `dist/server.js` directly from the downloaded artifact.

### User Story US-OPS-402: Deterministic Dependency Installation & Linter Deduplication
*As an SDET & DevOps Engineer, I want all jobs to install dependencies via `npm ci` and remove duplicate compiler checks in `e2e-quality-gate`, so that dependency resolution is deterministic and compiler executions are not duplicated.*
- [x] **US-OPS-402.1** (`DevOps Engineer`): Replace all occurrences of `npm install` with `npm ci` across `frontend-tests` and `frontend-build` in `.github/workflows/ci.yml`.
- [x] **US-OPS-402.2** (`DevOps Engineer`): Remove redundant `run: npx tsc --noEmit` step from `e2e-quality-gate` in `.github/workflows/ci.yml`.
- [x] **US-OPS-402.3** (`SDET Architect`): Verify that `npm run finalize-spec -- --all-poms` executes `runTypeScriptCheck()` internally without losing typecheck coverage and document in `specs/test_cases_catalog.md` (Section 8).

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Validated `actions/upload-artifact@v4` and `actions/download-artifact@v4` implementation in `.github/workflows/ci.yml`. 1-day retention set to prevent disk quota bloat, explicit artifact path mapping configured, and zero `npm install` occurrences verified. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Validated that pre-built `dist` maintains full integrity. Ran `finalize-spec -- --all-poms` verifying 33/33 checks with single-invocation TypeScript compilation. Ran k6 API load benchmarks (7,662 requests, p95 = 1.53ms, 0 errors) executing directly against pre-built `dist/server.js`. | `[APPROVED]` |
| **Security Officer** | DevOps Engineer | Validated permissions and token scopes; verified artifacts contain only built outputs without exposing `.env` files or tokens. | `[APPROVED]` |
| **PO Sprint Review** | Product Owner | Verified elimination of duplicate compilation cycles across `ci.yml`, deterministic `npm ci` adoption, and zero regression across backend/frontend test suites. Sprint 4.1 accepted. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `.github/workflows/ci.yml` updated with `actions/upload-artifact@v4` and `actions/download-artifact@v4`.
- [x] All instances of `npm install` replaced with `npm ci`.
- [x] Redundant `npx tsc --noEmit` removed from `e2e-quality-gate`.
- [x] `lighthouse-ci` configured to run directly against downloaded `frontend/dist`.
- [x] `perf-benchmarks` configured to boot `dist/server.js` using downloaded `backend/dist` with `npm ci --omit=dev`.
- [x] Local build, typecheck, unit, component, and POM quality gates pass 100% green.
- [x] `specs/test_cases_catalog.md` updated with Section 8 CI/CD pipeline verification test cases.
- [x] Sprint 4.1 documentation synchronized in `planning/Sprints/sprint_4_1_pipeline_deduplication_and_artifact_sharing.md`.
- [x] Upstream changes pulled/merged from `origin/main` with zero conflicts.
- [x] Conventional commit created on branch `feature/sprint-4.1-deduplication-and-artifacts`.
- [x] Remote branch pushed and Pull Request opened via `gh pr create`.
- [x] Sprint 4.1 milestone sign-off issued by Product Owner.



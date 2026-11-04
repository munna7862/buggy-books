# Task Backlog: Mobile Rollback & Re-plan

## Current Focus: Review and remove the first mobile app attempt (Phases 11-12)

**Goal**: Review all mobile code added in PRs #97 to #102. Remove the Expo app (`mobile/`) and the Appium/Maestro suite (`mobile-automation/`), keep the backend Bearer-token dual-auth, and publish a revised mobile plan.

---

## 1. Tasks

- [x] Review `mobile/`, `mobile-automation/` and the backend dual-auth changes (typecheck, lint, Jest, cross-check against a running backend).
- [x] Remove the `mobile/` and `mobile-automation/` workspaces, plus their root scripts and lockfile entries.
- [x] Remove the mobile sections from `intentional_bugs.md`, `specs/test_cases_catalog.md` (sections 20-22, `TC-EXPO-SCAFFOLD-001`) and `README.md`.
- [x] Remove the superseded Phase 11/12 and Sprint 11.x/12.x planning docs, and update `planning/Master/master_plan.md`.
- [x] Write the revised plan: `planning/Master/mobile_app_master_plan.md` (v2).
- [ ] Product Owner approval of the v2 plan (open decisions in section 6 of the plan).

---

## 2. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Architect Review** | Senior SDE | The app calls `/api/auth/login`, `/api/auth/register` and `/api/auth/logout`, but the backend serves `/api/login`, `/api/register` and `/api/logout`, so login and register never worked. Unit tests mock `apiClient`, which hid this. | `[REJECTED → REMOVED]` |
| **SDET Architect Review** | Mobile Automation Eng | 11 automation locators do not exist in the app. Specs use the wrong seeded password (`password123`, should be `buggybooks`) and the wrong book IDs (`book-1`). There is no reset in the suites, they use hardcoded `driver.pause`, and no APK is ever built, so the suite cannot run. | `[REJECTED → REMOVED]` |
| **Security Officer Review** | Senior SDE | Kept the backend dual-auth. Follow-ups: skip CSRF only after the Bearer token verifies, and add refresh-token reuse detection. Tracked in Phase M1 of the v2 plan. | `[APPROVED WITH FOLLOW-UPS]` |

---

## 3. Definition of Done (DoD) Checklist

- [x] `npm run typecheck` passes.
- [x] Backend tests pass (`backend: npm test`), including the dual-auth tests.
- [x] No remaining references to `mobile/` or `mobile-automation/` in the workspaces, scripts or docs.
- [ ] Pull Request opened and CI green.

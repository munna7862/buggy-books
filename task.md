# Task Backlog: Sprint M0.1 - Mobile Walking Skeleton

## Current Focus: Contracts, Android APK build and Maestro smoke login

**Goal**: Prove the mobile stack end to end before any feature work: a shared contract package, a minimal Android development-build app (login + placeholder catalog), an APK built in CI, and Maestro flows passing on an emulator against the real backend.

---

## 1. Tasks

- [x] `shared/contracts` (`@buggybooks/contracts`): `API_ROUTES`, `MOBILE_TEST_IDS`, `SEEDED_USERS`, `SEEDED_BOOK_IDS`.
- [x] Backend contract test (`backend/src/__tests__/contracts.test.ts`), verified to fail on a wrong login path and on a wrong seeded password.
- [x] `mobile/`: Expo SDK 58 (React 19.3, React Native 0.88), `expo-dev-client`, Android only, login + placeholder catalog, secure-store session.
- [x] Mobile unit tests against a fake backend at the `fetch` boundary (12 tests, cold cache).
- [x] ESLint bans literal API paths and `testID`s in the app.
- [x] `mobile-automation/`: Maestro flows using contract variables only, plus a flow checker; backend reset before each flow.
- [x] `.github/workflows/mobile-ci.yml`: quality + APK build on PRs; emulator + Maestro on `main`, nightly, dispatch, or the `run-mobile-e2e` label.
- [ ] Emulator job green on the sprint PR (`run-mobile-e2e` label).

---

## 2. Previous: Mobile Rollback & Re-plan (done)

The first mobile attempt (PRs #97-#102) was reviewed and removed in #106. The re-plan (#107) was approved: Android only, Expo dev build, emulator CI on `main` + nightly.

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

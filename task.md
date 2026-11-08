# Task Backlog: Sprint M1.1 - Mobile Auth & Catalog

## Current Focus: Register, session handling, catalog search and paging, book detail

**Goal**: Replace the M0.1 placeholder with real auth and catalog flows on Android, each proven by a Maestro flow against the real backend, and close the two backend security follow-ups from the re-plan.

---

## 1. Tasks

- [x] Backend: skip CSRF only after the Bearer access token verifies.
- [x] Backend: refresh-token families and a `jti` denylist, with reuse detection and revocation on logout.
- [x] Contracts: register and book detail `testID`s, `bookRowTestId`, `SEEDED_BOOKS` with titles.
- [x] App: register screen, silent refresh with one shared refresh, logout revokes the session.
- [x] App: catalog list with server-side search and Load more; book detail with hardware back.
- [x] Unit tests against the fake backend at the `fetch` boundary.
- [x] Maestro flows: register, duplicate username, session restore, silent refresh, search and paging, book detail.
- [ ] Emulator job green on the sprint PR (`run-mobile-e2e` label, awaiting PO approval).

---

## 2. Sprint M1.1 Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Architect Review** | Senior SDE | ESLint rejected a synchronous `setState` in the book detail effect and flagged ref writes in effect cleanups. Book detail now loads in the effect with a cancel flag, and the catalog cleanup no longer touches the ref. | `[FIXED]` |
| **Security Officer Review** | Senior SDE | The denylist is in memory, so a restart forgets consumed tokens until they expire, and web logout cannot revoke because the refresh cookie is scoped to `/api/auth/refresh`. Accepted for this test target; recorded here as known limits. | `[APPROVED WITH FOLLOW-UPS]` |

---

## 3. Previous: Sprint M0.1 - Mobile Walking Skeleton (done, #108)

### Tasks

- [x] `shared/contracts` (`@buggybooks/contracts`): `API_ROUTES`, `MOBILE_TEST_IDS`, `SEEDED_USERS`, `SEEDED_BOOK_IDS`.
- [x] Backend contract test (`backend/src/__tests__/contracts.test.ts`), verified to fail on a wrong login path and on a wrong seeded password.
- [x] `mobile/`: Expo SDK 58 (React 19.3, React Native 0.88), `expo-dev-client`, Android only, login + placeholder catalog, secure-store session.
- [x] Mobile unit tests against a fake backend at the `fetch` boundary (12 tests, cold cache).
- [x] ESLint bans literal API paths and `testID`s in the app.
- [x] `mobile-automation/`: Maestro flows using contract variables only, plus a flow checker; backend reset before each flow.
- [x] `.github/workflows/mobile-ci.yml`: quality + APK build on PRs; emulator + Maestro on `main`, nightly, dispatch, or the `run-mobile-e2e` label.
- [x] Emulator job green on the sprint PR (`run-mobile-e2e` label).

---

### Sprint M0.1 Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Independent PR Review** | DevOps Engineer | Adding any label other than `run-mobile-e2e` cancelled the in-flight run (concurrency is applied before job `if`), and on `main` a merge could cancel the nightly run. Fixed: per-label noop group, separate nightly group, cancel-in-progress only on PRs. Path filter now covers root `package.json` and all of `backend/`. | `[FIXED]` |
| **Independent PR Review** | Senior SDE | Session restore deleted tokens on any error (offline or cold start logged the user out). Now only 401/403 clears tokens; test added. The catalog showed "0 books" for a non-list response; now shows an error and the flow asserts at least 1 book. Contract test now checks the login and books response shapes. | `[FIXED]` |
| **Independent PR Review** | Senior SDE | The literal-path lint only matched strings starting with `/api/`, so `'http://10.0.2.2:4000/api/auth/login'` passed. Now matches `/api/` anywhere, plus template-literal testIDs. Android error texts get `accessibilityLiveRegion`. App ID moved to the contracts, with a test that `app.config.ts` matches. | `[FIXED]` |
| **Independent PR Review** | Product Owner | Plan said Maestro targets a debug dev-build APK; CI tests a release APK. Plan wording corrected. The `run-mobile-e2e` PR label changes PO decision 3 and is marked as awaiting PO approval. | `[AWAITING PO]` |

---

## 4. Previous: Mobile Rollback & Re-plan (done)

The first mobile attempt (PRs #97-#102) was reviewed and removed in #106. The re-plan (#107) was approved: Android only, Expo dev build, emulator CI on `main` + nightly.

---

## 5. Rollback Review Comments

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Architect Review** | Senior SDE | The app calls `/api/auth/login`, `/api/auth/register` and `/api/auth/logout`, but the backend serves `/api/login`, `/api/register` and `/api/logout`, so login and register never worked. Unit tests mock `apiClient`, which hid this. | `[REJECTED → REMOVED]` |
| **SDET Architect Review** | Mobile Automation Eng | 11 automation locators do not exist in the app. Specs use the wrong seeded password (`password123`, should be `buggybooks`) and the wrong book IDs (`book-1`). There is no reset in the suites, they use hardcoded `driver.pause`, and no APK is ever built, so the suite cannot run. | `[REJECTED → REMOVED]` |
| **Security Officer Review** | Senior SDE | Kept the backend dual-auth. Follow-ups: skip CSRF only after the Bearer token verifies, and add refresh-token reuse detection. Tracked in Phase M1 of the v2 plan. | `[APPROVED WITH FOLLOW-UPS]` |

---

## 6. Definition of Done (DoD) Checklist

- [x] `npm run typecheck` passes.
- [x] Backend tests pass (`backend: npm test`), including the dual-auth tests.
- [x] No remaining references to `mobile/` or `mobile-automation/` in the workspaces, scripts or docs.
- [ ] Pull Request opened and CI green.

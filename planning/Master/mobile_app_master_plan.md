# BuggyBooks Mobile App Master Plan (v2, re-plan)

**Document Identifier**: `PLAN-MASTER-MOBILE-APP-002` (replaces `PLAN-MASTER-MOBILE-APP-001`)
**Status**: Approved by Product Owner (scope decisions in section 6)
**Date**: 2026-11-04

---

## 1. Why the first attempt was removed

The first mobile attempt (Sprints 11.1 to 12.2, PRs #97 to #102) added `mobile/` (Expo 52 / React Native 0.76) and `mobile-automation/` (Appium + WebdriverIO, Maestro). A review found that the app and its automation had never been run end to end against the real backend. The code was removed. The backend dual-auth work from Sprint 11.1 is kept.

### Blocking defects found in review

| # | Area | Defect | Evidence |
|---|---|---|---|
| 1 | App ↔ API contract | The app calls `POST /api/auth/login`, `/api/auth/register` and `/api/auth/logout`. The backend serves `/api/login`, `/api/register` and `/api/logout`. **Nobody could log in or register.** | Against a running backend, `POST /api/auth/login` returns `403` (CSRF guard, since the path is not on the exempt list) |
| 2 | Unit tests | Every unit test mocks `apiClient`, so the tests asserted the wrong paths and still passed. No test ever reached a real backend. | `mobile/src/__tests__/*.test.tsx` |
| 3 | Automation ↔ app | 11 locators used by the Appium screen objects and Maestro flows do not exist in the app (for example `btn_login_submit`, `btn_place_order`, `catalog_search_input`, `order_confirmation_container`, `btn_item_book-1_add`). The app uses `btn-login`, `btn-place-order`, `input-search` and so on. | Cross-check of `mobile-automation/src/screens` and `.maestro` against the `testID`s in `mobile/src` |
| 4 | Automation test data | Every spec logs in as `testuser` / `password123`. The seeded password is `buggybooks`, so login returns `401`. Book IDs are `"1"`, `"2"` and so on, not `book-1`. | `backend/src/repositories/user.repository.ts`, `backend/src/data/db.json` |
| 5 | Build pipeline | There was no `android/` or `ios/` project, no EAS config, no APK/IPA build and no mobile CI workflow. The Appium config targets `com.buggybooks.app/.MainActivity`, but nothing ever produced that binary. The suites could not run anywhere. | No `mobile-ci.yml`, no `eas.json`, no prebuild output |
| 6 | Avatar upload | `apiClient` sets a default `Content-Type: application/json`. Axios does not clear it for `FormData` on React Native, so multipart uploads are likely to be rejected by Multer. The code comment says the header is omitted, but it is not. | `mobile/src/api/client.ts`, `ProfileScreen.tsx` |
| 7 | Test flakiness | `AuthContext.test.tsx` fails on a cold Jest cache (first test exceeds the 5s timeout during transform). It failed 4 of 4 runs with `--no-cache`. | `npx jest --no-cache` |
| 8 | Test isolation and waits | Appium specs never call `POST /api/test/reset`, which breaks the AGENTS.md isolation rule. Screen objects use hardcoded `driver.pause(1000-4000)`, which AGENTS.md forbids. | `mobile-automation/src/screens/*.ts` |

### Lower-severity findings

- Search only ever shows the first 8 results. Passing `q` switches the backend into paginated mode (`limit` defaults to 8) and the app never pages.
- `fetchBooks` reads `books.length` inside a `useCallback` with `[]` deps, so it reads stale state.
- `useCart()` outside a provider silently returns a working fake instead of throwing, which hides wiring bugs.
- The Chaos tab (DB reset, failure rates) is shown to every user in every build.
- The app pinned Expo SDK 52 and React 18, while the web app is on React 19. The shared types needed `paths` hacks to resolve two React versions.
- `babel.config.js` lists `@babel/preset-flow`, which is not a declared dependency.

### Backend hardening to do (the kept dual-auth code)

- `skipCsrfProtection` skips CSRF for any `Authorization: Bearer` value longer than 10 characters, before the token is verified. `authenticateToken` then rejects bad tokens, so this cannot be exploited today. Even so, CSRF should be skipped only after the Bearer token verifies.
- Refresh tokens are rotated but old ones stay valid for 30 days: there is no reuse detection or revocation list. Add a token-family / `jti` denylist.

---

## 2. Principles for the re-plan

1. **Contract first, single source of truth.** Route paths, seeded test users and `testID`s live in `shared/` and are imported by the backend, the app *and* the automation. A typo becomes a compile error, not a runtime 404.
2. **Walking skeleton before features.** Sprint M0 ends with a real debug APK built in CI, installed on an emulator, logging in against a real backend and passing one Maestro flow. No screen work starts before that is green.
3. **Every feature slice ships with a real-device flow.** A sprint is not done until its Maestro flow passes in CI against the real backend. Unit tests with mocked HTTP are a supplement, not the proof.
4. **The clean app first, chaos second.** The anti-patterns (obfuscated IDs, keyboard occlusion, delays, offline mode, orientation shift) go behind the server-side chaos config (`ChaosConfig.mobile*` flags) so they can be turned on and off like the web chaos. A clean baseline makes real regressions visible.
5. **One automation framework at a time.** Maestro first, because it is the cheapest to keep green. Appium/WebdriverIO comes later, as a separate proving-ground phase, reusing the shared `testID` constants.
6. **Follow AGENTS.md for mobile too.** Reset via `/api/test/reset` in every suite, no hardcoded sleeps, and screen objects with private locators and wrapped actions.

---

## 3. Target architecture

```text
shared/
  types/                 domain types (existing)
  contracts/
    routes.ts            API_ROUTES = { login: '/api/login', ... }   <- backend router + mobile client
    testIds.ts           MOBILE_TEST_IDS = { login: { username: 'txt_usr_77', ... } }
    fixtures.ts          SEEDED_USERS, SEEDED_BOOK_IDS              <- backend seed + automation
mobile/                  Expo (current SDK at sprint start), React 19 to match frontend, Android only
  app.config.ts          env-driven API URL, chaos screen only when APP_VARIANT=qa
  eas.json               development / qa profiles (expo-dev-client, no Expo Go)
mobile-automation/
  maestro/               flows import IDs via generated env file from testIds.ts
  appium/                (Phase M3) WDIO screen objects using MOBILE_TEST_IDS
.github/workflows/
  mobile-ci.yml          every PR (mobile paths): lint + typecheck + jest + APK build
                         main + nightly: emulator + backend -> maestro test
```

---

## 4. Phases and sprints

### Phase M0: Walking skeleton (1 sprint)

**M0.1 Contracts, build pipeline and smoke flow**
- Add `shared/contracts/{routes,testIds,fixtures}.ts` (`@buggybooks/contracts`). The backend keeps its own route strings, because importing runtime values from `shared/` would break its `rootDir` build and Docker image. Instead, `backend/src/__tests__/contracts.test.ts` fails if any contract route, seeded user or seeded book differs from the backend.
- Scaffold `mobile/` on the current Expo SDK with React 19 and `expo-dev-client`, plus a Login screen and an empty Catalog screen only. Android only: no `ios` config.
- Add `eas.json` and `expo prebuild --platform android`, and a `mobile-ci.yml` job that builds a debug development-build APK (Gradle, no EAS cloud) and uploads it as an artifact. This job and lint/typecheck/Jest run on every PR that touches `mobile/`, `mobile-automation/` or `shared/`.
- Add an Android emulator job that runs on push to `main`, nightly (`schedule`), `workflow_dispatch`, and on a PR only when it has the `run-mobile-e2e` label: start the backend, `adb reverse tcp:4000`, install the APK, run the Maestro flows.
- Add a contract test (Jest, backend) asserting every `API_ROUTES` entry is registered on the router.
- **Exit:** the emulator job is green with a real login, verified on the sprint PR with the `run-mobile-e2e` label before merge.

### Phase M1: Clean core flows (2 sprints)

**M1.1 Auth and catalog**: register, login, logout, secure-store session hydration, silent refresh, catalog list and search with pagination, book detail. Maestro flows for each.
**M1.2 Cart, checkout and profile**: cart with server-side quantities, checkout with handling for the flaky `/api/checkout/process` (retry banner), avatar upload (multipart with the correct headers), orders list. Maestro flows for each, including a chaos-driven checkout retry flow.
- Unit tests use MSW (`msw/native`) against the shared route constants instead of mocking `apiClient`.
- Backend hardening: CSRF skip only after Bearer verification, and refresh-token reuse detection.

### Phase M2: Opt-in mobile chaos (1 sprint)

**M2.1** Add `mobileObfuscatedIds`, `mobileKeyboardOcclusion`, `mobileAddToCartDelayMs`, `mobileSimulatedOffline` and `mobileLandscapeShift` to `ChaosConfig`. The app reads them from `/api/test/config` on launch and on resume. Add a QA-variant-only Chaos screen. Each anti-pattern gets a Maestro flow that turns it on through the API, proves the hurdle exists, works around it, and resets.

### Phase M3: Appium proving ground (1 sprint)

**M3.1** Appium + WebdriverIO screen objects (extending a `BaseMobileScreen` that mirrors `BasePage`) using `MOBILE_TEST_IDS`. Run on the Android CI emulator, with Allure reporting.

iOS is out of scope (see section 6). Revisit it only after M3.1 is stable.

---

## 5. Definition of Done additions for mobile sprints

- [ ] The sprint's Maestro flows pass in the `mobile-ci.yml` emulator job against a real backend (not mocked). Because that job does not run on PRs by default, add the `run-mobile-e2e` label to the sprint PR (GitHub only allows `workflow_dispatch` for workflows already on `main`) and link the run in the PR.
- [ ] No string-literal API paths or `testID`s in `mobile/` or `mobile-automation/`: only the `shared/contracts` imports.
- [ ] `npx jest --no-cache` passes for `mobile/` (a cold-cache run).
- [ ] The APK artifact is attached to the CI run.
- [ ] `specs/test_cases_catalog.md` entries point to a real-device flow, not only to unit tests.

## 6. Product Owner decisions (2026-11-04)

1. **Platform:** Android only. No iOS config, macOS runners or XCUITest work in M0 to M3.
2. **Runtime:** a development build (`expo-dev-client`). Expo Go is not supported. Appium and Maestro target the dev-build APK (`com.buggybooks.app`).
3. **CI budget:** the Android emulator job runs on push to `main`, nightly and on manual dispatch. On PRs, CI runs lint, typecheck, Jest and the APK build only, unless the PR is labelled `run-mobile-e2e`.

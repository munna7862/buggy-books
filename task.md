# Sprint 11.1: Backend Dual-Auth & Expo Monorepo Scaffolding

**Sprint Identifier**: `SPRINT-11.1-BACKEND-DUAL-AUTH-AND-EXPO-MONOREPO-SCAFFOLDING`  
**Phase Mapping**: [Phase 11: Cross-Platform Mobile App Foundations (Android & iOS) & Dual-Auth](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_11_mobile_foundations_and_full_stack_core.md)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Enable dual-mode authentication (Bearer tokens + httpOnly cookies) on the backend without breaking existing web/E2E tests, bypass CSRF checks for Bearer tokens, and scaffold the `mobile/` React Native + Expo TypeScript workspace.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog grooming, live burndown tracking in `task.md`, cross-persona handoffs, review facilitation, and DoD compliance audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, authoring Section 19 in `specs/test_cases_catalog.md`, designing dual-auth and CSRF exemption test scenarios. |
| **Backend Specialist / Dev Architect** | AI Agent / SDE | Implement dual-auth in `auth.service.ts`, `authController.ts`, `api.ts`, `profileController.ts`, and CSRF bypass in `app.ts`. Expand `shared/types`. |
| **Mobile Developer** | AI Agent / Mobile | Configure root npm workspaces, scaffold Expo TypeScript app in `mobile/`, configure Metro bundler, TypeScript isolation, and test runner. |
| **Security Champion** | AI Agent / SEC | Validate JWT verification semantics, header inspection security, CSRF exemption constraints, and secret leakage prevention. |
| **QA Specialist** | AI Agent / QA | Execute backend Jest tests, frontend Vitest tests, and verify existing Playwright E2E flows remain 100% green. |
| **Product Owner** | Human PO / AI PO | Review acceptance criteria, aesthetic & functionality verification, approve Definition of Done, and authorize release PR. |
| **DevOps Engineer** | AI Agent / DevOps | Monorepo build and lint verification, git synchronization with `origin/main`, commit hygiene, and automated GitHub PR creation. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-MOB-1111: Backend Dual-Authentication & Token Delivery
*As a Mobile Developer, I want the backend login, register, and refresh endpoints to accept and return JWT `token` and `refreshToken` in the JSON payload, protected routes to accept `Authorization: Bearer <token>` headers, and avatar uploads to recognize Bearer tokens, so that native mobile clients can securely authenticate, silently rotate tokens, and upload profile assets without browser cookies.*
- [x] **US-MOB-1111.1** (`Backend Specialist`): Update `authService.refresh(refreshToken?: string)` in `backend/src/services/auth.service.ts` to verify the refresh token, generate both a refreshed access token and a refreshed rotation token (`expiresIn: '30d'`), and return `{ token, refreshToken, username }`.
- [x] **US-MOB-1111.2** (`Backend Specialist`): Update `backend/src/controllers/authController.ts` in `login`, `register`, and `refresh` to return `{ token, refreshToken, username, message/success }` in response body while continuing to set `httpOnly` cookies via `setAuthCookies(res, token, refreshToken)` for web backward compatibility. Accept `req.body.refreshToken` falling back to `req.cookies?.refreshToken` in `refresh`.
- [x] **US-MOB-1111.3** (`Backend Specialist`): Update `authenticateToken` in `backend/src/routes/api.ts` to inspect `req.headers.authorization` for `Bearer <token>`, fallback to `req.cookies?.token`, return 401 if missing and 403 if invalid, and preserve `loggerStore` context.
- [x] **US-MOB-1111.4** (`Dev Architect`): Expand `shared/types/auth.types.d.ts` and `shared/types/index.d.ts` to export `AuthUser`, `AuthTokensResponse`, and `UserProfile`.
- [x] **US-MOB-1111.5** (`Backend Specialist`): Update `storageEngine.filename` in `backend/src/controllers/profileController.ts` to leverage `(req as Request).user?.username || 'anonymous'` from the upstream `authenticateToken` middleware.
- [x] **US-MOB-1111.6** (`SDET Architect` & `Backend Specialist`): Add unit/integration tests in `backend/src/__tests__/authRefresh.test.ts` (or `dualAuth.test.ts`) and `profile.test.ts` covering Bearer header auth on protected routes, body-based refresh rotation, and Bearer avatar upload naming.

### User Story US-MOB-1112: CSRF Exemption for Bearer Token Requests
*As an API Client using Bearer tokens, I want mutating requests (`POST`, `PUT`, `DELETE`) with valid Bearer tokens to be exempt from double-submit cookie CSRF checks, so that native mobile apps do not encounter 403 Forbidden errors when submitting mutations.*
- [x] **US-MOB-1112.1** (`Backend Specialist`): Update `skipCsrfProtection` in `backend/src/app.ts` to exempt requests with non-empty `Authorization: Bearer <token>` headers (token length > 10).
- [x] **US-MOB-1112.2** (`SDET Architect` & `Backend Specialist`): Add integration test verifying a mutating request (`POST /api/cart`) with Bearer token succeeds without `x-csrf-token` header, while cookie-only requests without CSRF token are rejected.

### User Story US-MOB-1113: Expo Monorepo Workspace Scaffolding & Metro Bundler
*As a Mobile Developer, I want a clean React Native + Expo TypeScript workspace initialized in `mobile/` with monorepo Metro resolution and unit test runner, so that the mobile app is integrated into the monorepo, can consume `@buggybooks/types`, and has test execution parity.*
- [x] **US-MOB-1113.1** (`Mobile Developer`): Update root `package.json` to include `"mobile"` in `workspaces` and add scripts (`dev:mobile`, `lint:mobile`, `typecheck:mobile`, `test:mobile:unit`).
- [x] **US-MOB-1113.2** (`Mobile Developer`): Create `mobile/package.json` with React 18.3.1, React Native 0.76.6, Expo SDK 52, `@buggybooks/types: "*"`, React Navigation 7, `expo-secure-store`, `expo-image-picker`, `expo-haptics`, `jest-expo`, `@testing-library/react-native`.
- [x] **US-MOB-1113.3** (`Mobile Developer`): Configure `mobile/metro.config.js` with `watchFolders = [workspaceRoot]` and `nodeModulesPaths` prioritizing `mobile/node_modules`.
- [x] **US-MOB-1113.4** (`Mobile Developer`): Configure `mobile/tsconfig.json` with React 18 type isolation paths.
- [x] **US-MOB-1113.5** (`Mobile Developer`): Configure `mobile/app.json` with app name (`BuggyBooks`), scheme (`buggybooks`), and bundle identifier (`com.buggybooks.app`).
- [x] **US-MOB-1113.6** (`Mobile Developer`): Scaffold `mobile/App.tsx` and unit test `mobile/__tests__/App.test.tsx`.

### User Story US-MOB-1114: Test Cataloging, Governance & Quality Gate
*As a Quality Architect, I want the test cases catalog updated with Section 19 documenting Sprint 11.1 dual-auth and mobile scaffolding standards, security audit sign-off, and full regression verification.*
- [x] **US-MOB-1114.1** (`SDET Architect`): Author Section 19 in `specs/test_cases_catalog.md` (`TC-DUAL-AUTH-001`, `TC-REFRESH-BODY-001`, `TC-CSRF-BEARER-001`, `TC-AVATAR-BEARER-001`, `TC-EXPO-SCAFFOLD-001`).
- [x] **US-MOB-1114.2** (`Security Champion`): Audit Bearer token extraction, CSRF bypass boundary, and secret isolation.
- [x] **US-MOB-1114.3** (`QA Specialist`): Run backend Jest tests, frontend Vitest tests, and Playwright E2E smoke tests.
- [x] **US-MOB-1114.4** (`Product Owner`): Validate monorepo typecheck, linting, test suite execution, approve Definition of Done, and authorize release PR.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Section 19 authored in `specs/test_cases_catalog.md` documenting dual-auth, CSRF exemption, and mobile scaffolding test cases. Contracts expanded in `@buggybooks/types`. | `[APPROVED]` |
| **Backend & Security Gate** | Backend Specialist & Security Champion | Dual-auth token delivery and silent rotation verified. Bearer token extraction and CSRF exemption guarded against arbitrary bypass. Avatar filename properly attributed via authenticated user context. | `[APPROVED]` |
| **Mobile Scaffolding Gate** | Mobile Developer | Metro bundler config verified for monorepo resolution. React 18 type isolation verified with 0 compiler errors. Mobile Jest unit test passing 100%. | `[APPROVED]` |
| **Full Regression QA Gate** | QA Specialist | All 97 backend unit tests, 80 frontend component tests, 55 Playwright API tests, and Chromium UI smoke tests pass with 0 regressions. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All 3 user stories fully satisfy acceptance criteria. Definition of Done 100% compliant. Release PR authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] All 3 user stories implemented and reviewed against acceptance criteria.
- [x] Backend Jest unit and integration tests pass with 100% success (`npm run test:backend`).
- [x] Token refresh endpoint verified via JSON body payloads and cookie fallbacks with zero `undefined` values.
- [x] Multer file naming verified with Bearer token authentication in `profile.test.ts`.
- [x] Mutating requests with Bearer tokens verified to bypass CSRF without `x-csrf-token` header.
- [x] Frontend Vitest component tests pass with 100% success (`npm run test:frontend`).
- [x] Playwright web E2E smoke tests pass without regressions (`npm run test:e2e:local` or `npm run test:api`).
- [x] `mobile/` compiles cleanly with zero TypeScript errors, resolves `@buggybooks/types`, and passes unit test suite (`npm run test:mobile:unit`).
- [x] Section 19 documented in `specs/test_cases_catalog.md`.
- [x] Feature branch committed with conventional commits, pushed to remote, Pull Request [#97](https://github.com/munna7862/buggy-books/pull/97) raised, all 27 CI checks passed, and merged into `main`.

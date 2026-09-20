# Sprint 11.2: Core Navigation, Authentication & Catalog Flow

**Sprint Identifier**: `SPRINT-11.2-CORE-NAVIGATION-AUTHENTICATION-AND-CATALOG-FLOW`  
**Phase Mapping**: [Phase 11: Cross-Platform Mobile App Foundations (Android & iOS) & Dual-Auth](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_11_mobile_foundations_and_full_stack_core.md)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Implement secure token persistence with `expo-secure-store`, typed API client with 401/403 refresh interceptors, native navigation hierarchy (Auth Stack + Main Tabs), and functional Login, Register, Catalog, and Book Detail screens.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog grooming, live burndown tracking in `task.md`, cross-persona handoffs, review facilitation, and DoD compliance audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, authoring Section 20 in `specs/test_cases_catalog.md` (`MOB_AUTH_01`–`MOB_CAT_05`), designing refresh mutex and navigation test scenarios. |
| **Mobile Developer / Dev Architect** | AI Agent / Mobile | Implement SecureStore wrapper, Axios client with refresh mutex, `AuthContext` with offline hydration, navigation hierarchy, and screen components. |
| **UI/UX Mobile Designer** | AI Agent / UX | Ensure responsive layouts, glassmorphism/BuggyBooks visual alignment, accessible touch targets, and smooth transitions. |
| **Security Champion** | AI Agent / SEC | Audit hardware-backed SecureStore usage, credential protection in memory, CSRF exemption integrity, and token purge on logout. |
| **QA Specialist** | AI Agent / QA | Execute mobile Jest unit tests, verify backend Jest tests, frontend Vitest tests, and confirm zero regressions in existing test suites. |
| **Product Owner** | Human PO / AI PO | Review acceptance criteria, aesthetic & functional completeness, approve Definition of Done, and authorize release PR. |
| **DevOps Engineer** | AI Agent / DevOps | Monorepo build, lint, git synchronization with `origin/main`, commit hygiene, and automated GitHub PR creation. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-MOB-1121: Secure Storage, API Client with Refresh Mutex & AuthContext
*As a Mobile User, I want my login session securely remembered on my phone with resilient token auto-refresh, so that I do not have to re-enter my credentials every time I open the app and my session does not drop during background tasks.*
- [x] **US-MOB-1121.1** (`Mobile Developer`): Implement `mobile/src/utils/storage.ts` wrapping `expo-secure-store` with `saveTokens`, `getAccessToken`, `getRefreshToken`, and `clearTokens`.
- [x] **US-MOB-1121.2** (`Mobile Developer`): Implement `mobile/src/utils/jwt.ts` providing safe base64 decoding of JWT payloads for offline session hydration.
- [x] **US-MOB-1121.3** (`Mobile Developer`): Implement `mobile/src/api/client.ts` with dynamic `baseURL` resolution, Bearer header injection, 401/403 token expiration interception, and a promise-based refresh mutex queue.
- [x] **US-MOB-1121.4** (`Mobile Developer`): Create `mobile/src/context/AuthContext.tsx` providing `user`, `token`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`, with offline session hydration.
- [x] **US-MOB-1121.5** (`SDET Architect` & `Mobile Developer`): Author unit tests in `mobile/src/__tests__/storage.test.ts`, `mobile/src/__tests__/client.test.ts`, and `mobile/src/__tests__/AuthContext.test.tsx`.

### User Story US-MOB-1122: Root Navigation Hierarchy & Auth Screens
*As a Mobile User, I want a seamless navigation experience between authentication and the main bookstore tabs, so that I can sign in, register, and navigate books intuitively.*
- [x] **US-MOB-1122.1** (`Mobile Developer`): Configure navigation types and hierarchy in `mobile/src/navigation/` (`RootNavigator`, `AuthNavigator`, `AppTabNavigator`, `CatalogNavigator`).
- [x] **US-MOB-1122.2** (`Mobile Developer` & `UI/UX Designer`): Implement `mobile/src/screens/LoginScreen.tsx` with accessible inputs, error banner, and link to registration.
- [x] **US-MOB-1122.3** (`Mobile Developer` & `UI/UX Designer`): Implement `mobile/src/screens/RegisterScreen.tsx` with Full Name, Username, Password, instant auto-login, and link to login.
- [x] **US-MOB-1122.4** (`Security Champion`): Audit credential handling, ensure no secrets or passwords logged to console, and verify token purge on logout.

### User Story US-MOB-1123: Book Catalog & Book Detail Screens & Test Catalog
*As a Mobile Book Buyer & SDET, I want to browse and search books on mobile, and have all mobile authentication and discovery test cases cataloged, so that I can find books and ensure test coverage traceability per AGENTS.md.*
- [x] **US-MOB-1123.1** (`Mobile Developer` & `UI/UX Designer`): Implement `mobile/src/screens/CatalogScreen.tsx` with debounced search bar, 2-column `FlatList`, pull-to-refresh `RefreshControl`, and empty state.
- [x] **US-MOB-1123.2** (`Mobile Developer` & `UI/UX Designer`): Implement `mobile/src/screens/BookDetailScreen.tsx` with large cover art, metadata, stock badge, quantity selector (`-`/`+`), and "Add to Cart" CTA.
- [x] **US-MOB-1123.3** (`Mobile Developer`): Implement tab placeholder screens for `CartScreen.tsx`, `ProfileScreen.tsx` (with user profile & logout button), and `ChaosScreen.tsx`.
- [x] **US-MOB-1123.4** (`SDET Architect`): Author Section 20 in `specs/test_cases_catalog.md` documenting `MOB_AUTH_01`–`MOB_AUTH_05` and `MOB_CAT_01`–`MOB_CAT_05`.
- [x] **US-MOB-1123.5** (`SDET Architect` & `Mobile Developer`): Author screen/component tests in `mobile/src/__tests__/Catalog.test.tsx` and verify complete mobile unit test suite.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Section 20 authored in `specs/test_cases_catalog.md`. Mobile API client and SecureStore contracts defined. | `[APPROVED]` |
| **Storage, Auth & Security Gate** | Security Champion & Mobile Dev | Verify SecureStore token storage, 401/403 refresh mutex serialization, and token purge on logout. | `[APPROVED]` |
| **Navigation & Screen UI Gate** | UI/UX Designer & Mobile Dev | Native navigation transitions, responsive 2-column grid, search debounce, and accessible touch targets verified. | `[APPROVED]` |
| **Full Regression QA Gate** | QA Specialist | All mobile Jest unit tests (20/20), backend Jest tests (97/97), frontend Vitest tests (80/80), and Playwright API tests (55/55) pass with 0 regressions. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All 3 user stories satisfy acceptance criteria. Definition of Done 100% compliant. Release PR authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] All 3 user stories implemented with strict TypeScript typing (0 `any`).
- [x] Token persistence in hardware-backed `expo-secure-store` implemented and verified.
- [x] Axios client with baseURL resolution, Bearer injection, and 401/403 refresh mutex queue verified.
- [x] `AuthContext` provides session state, login, register, and offline hydration from stored JWT.
- [x] Navigation hierarchy (Root, Auth Stack, Main Tabs, Catalog Stack) configured and functional.
- [x] Login, Register, Catalog, and BookDetail screens implemented with accessible touch targets and state handling.
- [x] Section 20 authored in `specs/test_cases_catalog.md`.
- [x] Mobile unit tests pass with 100% success (`npm test --workspace=mobile` - 20/20 tests).
- [x] Full monorepo typecheck and lint pass cleanly (`npm run typecheck`, `npm run lint`).
- [x] Full backend and frontend test suites pass cleanly without regressions (`npm run test:backend`, `npm run test:frontend`).
- [x] Feature branch committed with conventional commits, pushed to remote, Pull Request raised via GitHub CLI, and all CI checks passed.


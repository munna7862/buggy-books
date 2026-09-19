# Sprint 11.2: Core Navigation, Authentication & Catalog Flow

**Sprint Identifier**: `SPRINT-11.2-CORE-NAVIGATION-AUTHENTICATION-AND-CATALOG-FLOW`  
**Phase Mapping**: [Phase 11: Cross-Platform Mobile App Foundations (Android & iOS) & Dual-Auth](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_11_mobile_foundations_and_full_stack_core.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement secure token persistence with `expo-secure-store`, typed API client with 401 refresh interceptors, native navigation hierarchy (Auth Stack + Main Tabs), and functional Login, Register, Catalog, and Book Detail screens.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Story breakdown, acceptance verification, and burndown tracking. |
| **Mobile Developer** | AI Agent / Mobile | Build `AuthContext`, API client, navigation architecture, and screen components. |
| **UI/UX Mobile Designer** | AI Agent / UX | Ensure accessible touch targets, native transitions, and responsive layout across phones and tablets. |
| **Security Champion** | AI Agent / SEC | Verify that JWT tokens are strictly stored in hardware-backed `expo-secure-store` and cleared on logout. |
| **QA Specialist** | AI Agent / QA | Verify navigation transitions, form validations, search query handling, and offline behavior. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-MOB-1121: Secure Storage, API Client with Refresh Mutex & AuthContext
- **Story Statement**:  
  *As a* Mobile User,  
  *I want* my login session securely remembered on my phone with resilient token auto-refresh,  
  *So that* I do not have to re-enter my credentials every time I open the app and my session does not drop during background tasks.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Implement `mobile/src/utils/storage.ts` wrapping `expo-secure-store`:
    - `saveTokens(token: string, refreshToken: string): Promise<void>`
    - `getAccessToken(): Promise<string | null>`
    - `getRefreshToken(): Promise<string | null>`
    - `clearTokens(): Promise<void>`
  - [ ] Implement `mobile/src/api/client.ts`:
    - Automatic `baseURL` resolution: Prioritize `process.env.EXPO_PUBLIC_API_URL` (critical for `adb reverse` in CI). Fallback to `10.0.2.2:4000` for Android Emulator, `localhost:4000` for iOS Simulator, dynamic LAN IP via `Constants.expoConfig?.hostUri` for physical devices, and Render for production.
    - Request interceptor injecting `Authorization: Bearer <token>`.
    - Response interceptor catching **both `401 Unauthorized` and `403 Forbidden`** (specifically when `error.response?.data?.error` contains `token` or `Invalid token`):
      - *Note on BuggyBooks Backend*: The Express API returns `403 Forbidden` (not 401) when an access token expires. The interceptor must check `status === 401 || (status === 403 && data?.error?.includes('token'))`.
      - Implement a promise-based **refresh mutex queue** to serialize simultaneous 401/403s into a single `POST /api/auth/refresh` request, replaying queued requests upon resolution.
      - On refresh failure, wipe tokens and dispatch auth logout event.
  - [ ] Create `mobile/src/context/AuthContext.tsx`:
    - Provides `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`.
  - [ ] Author unit tests in `mobile/src/__tests__/storage.test.ts` and `mobile/src/__tests__/AuthContext.test.tsx` verifying token saving, clearing, and session hydration.
- **Acceptance Criteria**:
  - [ ] Logging in persists JWT in secure storage.
  - [ ] Expired token responses (`403 Forbidden: Invalid token`) and `401 Unauthorized` trigger silent refresh with mutex queue, recovering requests seamlessly.
  - [ ] Multiple parallel expired requests trigger exactly one `/api/auth/refresh` call and all resolve seamlessly.
  - [ ] Relaunching the app restores authenticated session without prompting for login.
  - [ ] Logging out wipes secure storage and navigates to the login screen.
  - [ ] Unit tests pass cleanly via `npm test --workspace=mobile`.

---

### User Story US-MOB-1122: Root Navigation Hierarchy & Auth Screens
- **Story Statement**:  
  *As a* Mobile User,  
  *I want* a seamless navigation experience between authentication and the main bookstore tabs,  
  *So that* I can sign in, register, and navigate books intuitively.
- **Story Points**: 1 SP
- **Technical Subtasks**:
  - [ ] Configure React Navigation in `mobile/src/navigation/`:
    - `RootNavigator`: Conditionally renders `AuthNavigator` or `AppTabNavigator`.
    - `AuthNavigator`: `LoginScreen` and `RegisterScreen` with native slide transitions.
    - `AppTabNavigator`: Bottom tab bar with icons for Catalog, Cart, Profile, and Chaos.
  - [ ] Implement `LoginScreen`:
    - Form fields with baseline accessibility labels and inputs (proto-testIDs configured for subsequent Sprint 12.1 obfuscation).
    - Error banners on invalid credentials (HTTP 401).
  - [ ] Implement `RegisterScreen`:
    - Fields: Full Name, Username, Password.
    - Password strength hints and instant login upon successful registration.
  - [ ] Security Champion (SEC) Audit: Verify that credentials are not logged to console and tokens are cleared on logout.
- **Acceptance Criteria**:
  - [ ] Submitting valid credentials immediately transitions to the Catalog tab.
  - [ ] Pressing back does not navigate to login when authenticated.

---

### User Story US-MOB-1123: Book Catalog & Book Detail Screens & Test Catalog
- **Story Statement**:  
  *As a* Mobile Book Buyer & SDET,  
  *I want* to browse and search books on mobile, and have all mobile authentication and discovery test cases cataloged,  
  *So that* I can find books and ensure test coverage traceability per AGENTS.md.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Implement `CatalogScreen`:
    - 2-column `FlatList` with cover thumbnail, title, author, price, and rating badge.
    - Native `TextInput` search bar dispatching queries to `GET /api/books?q=`.
    - Pull-to-refresh (`RefreshControl`) re-fetching catalog data.
    - Empty search results state and loading shimmer indicator.
  - [ ] Implement `BookDetailScreen`:
    - Large cover art, full description, ISBN, stock status indicator.
    - Quantity selector (`-` and `+` buttons).
    - "Add to Cart" CTA button.
  - [ ] SDET Task: Document mobile test cases in `specs/test_cases_catalog.md`:
    - `MOB_AUTH_01`: Valid Login & SecureStore Persistence.
    - `MOB_AUTH_02`: Invalid Credentials & Error Banner.
    - `MOB_AUTH_03`: Registration & Instant Navigation.
    - `MOB_AUTH_04`: Silent Token Refresh on Expiration.
    - `MOB_AUTH_05`: Logout & Storage Purge.
    - `MOB_CAT_01`: Initial Catalog Load & Two-Column Grid.
    - `MOB_CAT_02`: Catalog Search Filtering with Debounce.
    - `MOB_CAT_03`: Catalog Pull-to-Refresh State Synchronization.
    - `MOB_CAT_04`: Search No-Results Empty State.
    - `MOB_CAT_05`: Book Detail View, Metadata & Quantity Selector.
- **Acceptance Criteria**:
  - [ ] Tapping a book card navigates to its `BookDetailScreen`.
  - [ ] Searching filters books dynamically with debouncing.
  - [ ] Pull-to-refresh refreshes list from the backend API.
  - [ ] `specs/test_cases_catalog.md` contains the new Mobile Test Suite section covering `MOB_AUTH_01`–`MOB_CAT_05`.

---

## 3. Definition of Done (DoD)

- [ ] All 3 user stories implemented with strict TypeScript typing.
- [ ] Mobile app runs on Android Emulator and iOS Simulator without runtime crashes.
- [ ] Authentication, token refresh mutex, and logout verified with live backend.
- [ ] Catalog search and book detail rendering verified with backend database.
- [ ] Mobile unit tests pass with 100% success (`npm test --workspace=mobile`).
- [ ] Test cases cataloged in `specs/test_cases_catalog.md`.

---

## 4. Verification Commands

```bash
# Start backend in development mode
npm run dev:backend

# Run mobile unit tests
npm test --workspace=mobile

# Launch Expo app on Android emulator
npm run dev:mobile:android

# Launch Expo app on iOS simulator
npm run dev:mobile:ios
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Concurrent 401/403 Refresh Storm & Backend 403 Expiration** | High | High | Implement an Axios response interceptor promise queue (mutex) that intercepts both 401 and 403 (Invalid token) to collapse multiple simultaneous responses into a single refresh call. |
| **Android Emulator Localhost Network Failure** | High | Medium | Prioritize `EXPO_PUBLIC_API_URL` (enabling `adb reverse` in CI), falling back to `10.0.2.2` mapping for Android and auto-detecting host IP via Expo's manifest for physical Wi-Fi testing. |
| **SecureStore Emulation Inconsistency** | Low | Low | `expo-secure-store` falls back gracefully to encrypted SQLite/SharedPreferences on emulators where hardware Keystores are simulated. |


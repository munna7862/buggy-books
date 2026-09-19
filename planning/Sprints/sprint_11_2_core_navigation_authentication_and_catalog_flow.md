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

### User Story US-MOB-1121: Secure Storage, API Client & AuthContext
- **Story Statement**:  
  *As a* Mobile User,  
  *I want* my login session securely remembered on my phone,  
  *So that* I do not have to re-enter my credentials every time I open the app.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Implement `mobile/src/utils/storage.ts` wrapping `expo-secure-store`:
    - `saveTokens(token: string, refreshToken: string): Promise<void>`
    - `getAccessToken(): Promise<string | null>`
    - `getRefreshToken(): Promise<string | null>`
    - `clearTokens(): Promise<void>`
  - [ ] Implement `mobile/src/api/client.ts`:
    - Automatic `baseURL` resolution (`10.0.2.2:4000` for Android Emulator, `localhost:4000` for iOS Simulator, Render for remote).
    - Request interceptor injecting `Authorization: Bearer <token>`.
    - Response interceptor catching `401 Unauthorized` and attempting silent refresh via `/api/auth/refresh`.
  - [ ] Create `mobile/src/context/AuthContext.tsx`:
    - Provides `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`.
- **Acceptance Criteria**:
  - [ ] Logging in persists JWT in secure storage.
  - [ ] Relaunching the app restores authenticated session without prompting for login.
  - [ ] Logging out wipes secure storage and navigates to the login screen.

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
    - Fields: Username (`txt_usr_77`), Password (`txt_pwd_99`).
    - Error banners on invalid credentials (HTTP 401).
  - [ ] Implement `RegisterScreen`:
    - Fields: Full Name, Username, Password.
    - Password strength hints and instant login upon successful registration.
- **Acceptance Criteria**:
  - [ ] Submitting valid credentials immediately transitions to the Catalog tab.
  - [ ] Pressing back does not navigate to login when authenticated.

---

### User Story US-MOB-1123: Book Catalog & Book Detail Screens
- **Story Statement**:  
  *As a* Mobile Book Buyer,  
  *I want* to browse books in a responsive grid, search by title or author, and view complete book details,  
  *So that* I can find books and add them to my cart.
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
- **Acceptance Criteria**:
  - [ ] Tapping a book card navigates to its `BookDetailScreen`.
  - [ ] Searching filters books dynamically with debouncing.
  - [ ] Pull-to-refresh refreshes list from the backend API.

---

## 3. Definition of Done (DoD)

- [ ] All 3 user stories implemented with strict TypeScript typing.
- [ ] Mobile app runs on Android Emulator and iOS Simulator without runtime crashes.
- [ ] Authentication, token refresh, and logout verified with live backend.
- [ ] Catalog search and book detail rendering verified with backend database.

---

## 4. Verification Commands

```bash
# Start backend in development mode
npm run dev:backend

# Launch Expo app on Android emulator
npm run dev:mobile:android

# Launch Expo app on iOS simulator
npm run dev:mobile:ios
```

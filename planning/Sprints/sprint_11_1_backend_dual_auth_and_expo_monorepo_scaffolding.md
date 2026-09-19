# Sprint 11.1: Backend Dual-Auth & Expo Monorepo Scaffolding

**Sprint Identifier**: `SPRINT-11.1-BACKEND-DUAL-AUTH-AND-EXPO-MONOREPO-SCAFFOLDING`  
**Phase Mapping**: [Phase 11: Cross-Platform Mobile App Foundations (Android & iOS) & Dual-Auth](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_11_mobile_foundations_and_full_stack_core.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Enable dual-mode authentication (Bearer tokens + httpOnly cookies) on the backend without breaking existing web/E2E tests, bypass CSRF checks for Bearer tokens, and scaffold the `mobile/` React Native + Expo TypeScript workspace.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog tracking, DoD validation, and dependency coordination. |
| **Backend Specialist** | AI Agent / SDE | Implement dual-auth in `authController.ts`, `api.ts`, and CSRF bypass in `app.ts`. |
| **Mobile Developer** | AI Agent / Mobile | Configure root npm workspaces, scaffold Expo TypeScript app in `mobile/`, and link `@buggybooks/types`. |
| **Security Champion** | AI Agent / SEC | Validate JWT verification semantics, header inspection security, and ensure no auth bypass exists. |
| **QA Specialist** | AI Agent / QA | Run existing Jest backend and Vitest frontend unit tests and Playwright E2E smoke tests to verify zero regressions. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-MOB-1111: Backend Dual-Authentication & Token Delivery
- **Story Statement**:  
  *As a* Mobile Developer,  
  *I want* the backend login, register, and refresh endpoints to accept and return JWT `token` and `refreshToken` in the JSON payload, protected routes to accept `Authorization: Bearer <token>` headers, and avatar uploads to recognize Bearer tokens,  
  *So that* native mobile clients can securely authenticate, silently rotate tokens, and upload profile assets without browser cookies.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Modify `backend/src/services/auth.service.ts`:
    - Update `refresh(refreshToken?: string)` to verify the token, generate a refreshed access token and a refreshed rotation token, and return `{ token: newToken, refreshToken: newRefreshToken, username }`.
  - [ ] Modify `backend/src/controllers/authController.ts`:
    - On `login`, return `{ message, username, token, refreshToken }`.
    - On `register`, return `{ message, username, token, refreshToken }`.
    - On `refresh`, accept `req.body.refreshToken` (or fallback to `req.cookies?.refreshToken`), invoke `authService.refresh`, pass valid tokens to `setAuthCookies(res, result.token, result.refreshToken)`, and return `{ success: true, username, token, refreshToken }`.
    - Continue setting `httpOnly` cookies via `setAuthCookies(res, token, refreshToken)` for web backward compatibility.
  - [ ] Modify `backend/src/routes/api.ts` in `authenticateToken`:
    - Read `req.headers.authorization`. If it starts with `Bearer `, verify and extract user.
    - If `Authorization` header is not present, fall back to `req.cookies?.token`.
    - If neither is valid, return `401 Unauthorized`.
    - **Crucial**: Preserve `loggerStore` context for structured log correlation:
      ```typescript
      const store = loggerStore.getStore();
      if (store && user.username) {
        store.username = user.username;
      }
      ```
  - [ ] Expand contracts in `shared/types/` (`auth.types.d.ts` and `index.d.ts`):
    - Export `AuthUser` (`{ username: string; type: 'access' }`).
    - Export `AuthTokensResponse` (`{ message?: string; success?: boolean; username: string; token: string; refreshToken: string }`).
    - Export `UserProfile` (`{ username: string; fullName?: string; avatarUrl?: string }`).
  - [ ] Modify `backend/src/controllers/profileController.ts` in `storageEngine.filename`:
    - Since `authenticateToken` middleware executes before `handleAvatarUpload` and populates `req.user`, directly leverage `(req as Request).user?.username || 'anonymous'`, ensuring mobile avatar uploads save as `<username>-<timestamp>.ext` cleanly without redundant JWT decoding.
  - [ ] Add unit and integration tests in `backend/src/__tests__/auth.test.ts` and `profile.test.ts` verifying:
    - Bearer header authentication on protected routes (`/api/cart`, `/api/profile`).
    - Body-based token refresh (`POST /api/auth/refresh` with `{ refreshToken }`) returning rotated tokens.
    - Avatar upload with Bearer token saves filename with authenticated username.
    - Existing cookie-based web auth flows remain 100% green.
- **Acceptance Criteria**:
  - [ ] Sending valid `Authorization: Bearer <jwt>` grants access to protected routes.
  - [ ] Sending valid `refreshToken` in request body returns new `token` and `refreshToken` pair in JSON.
  - [ ] Avatar uploads with Bearer token name files with authenticated user ID.
  - [ ] Existing cookie-based web requests continue to function identically.

---

### User Story US-MOB-1112: CSRF Exemption for Bearer Token Requests
- **Story Statement**:  
  *As an* API Client using Bearer tokens,  
  *I want* mutating requests (`POST`, `PUT`, `DELETE`) with valid Bearer tokens to be exempt from double-submit cookie CSRF checks,  
  *So that* native mobile apps do not encounter 403 Forbidden errors when submitting mutations.
- **Story Points**: 1 SP
- **Technical Subtasks**:
  - [ ] Update `skipCsrfProtection` in `backend/src/app.ts`:
    ```typescript
    skipCsrfProtection: (req) => {
      // Allow Bearer token requests to bypass CSRF (mobile native clients)
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1]?.trim() : undefined;
      if (token && token.length > 10) return true;
      ...
    }
    ```
  - [ ] Add integration test verifying a `POST /api/cart` request with Bearer token succeeds without `x-csrf-token` header.
- **Acceptance Criteria**:
  - [ ] Bearer-authenticated mutations succeed without requiring CSRF cookies or headers.
  - [ ] Cookie-authenticated web requests still require valid CSRF tokens.

---

### User Story US-MOB-1113: Expo Monorepo Workspace Scaffolding & Metro Bundler
- **Story Statement**:  
  *As a* Mobile Developer,  
  *I want* a clean React Native + Expo TypeScript workspace initialized in `mobile/` with monorepo Metro resolution and unit test runner,  
  *So that* the mobile app is integrated into the monorepo, can consume `@buggybooks/types`, and has test execution parity.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Update root `package.json` to include `"mobile"` in the `workspaces` array.
  - [ ] Scaffold `mobile/` with Expo SDK 52+, React Native 0.76+, and TypeScript.
  - [ ] Configure `mobile/metro.config.js` for npm workspaces:
    ```javascript
    const { getDefaultConfig } = require('expo/metro-config');
    const path = require('path');
    const projectRoot = __dirname;
    const workspaceRoot = path.resolve(projectRoot, '..');
    const config = getDefaultConfig(projectRoot);
    config.watchFolders = [workspaceRoot];
    config.resolver.nodeModulesPaths = [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ];
    config.resolver.disableHierarchicalLookup = true;
    module.exports = config;
    ```
  - [ ] Configure `mobile/package.json` with dependencies, explicit package name (`"name": "mobile"`), and unit test runner:
    - Package Name: `"name": "mobile"`
    - Dependencies: `"react": "18.3.1"`, `"react-native": "0.76.6"`, `"expo": "~52.0.0"`, `"@buggybooks/types": "*"`, `"@react-navigation/native": "^7.0.0"`, `"@react-navigation/native-stack": "^7.0.0"`, `"@react-navigation/bottom-tabs": "^7.0.0"`, `"expo-secure-store": "~14.0.0"`, `"expo-image-picker": "~16.0.0"`, `"expo-haptics": "~14.0.0"`
    - Note on React Isolation: Pin React 18.3.1 strictly in `mobile/package.json`. Metro's `nodeModulesPaths` resolves `mobile/node_modules` first, ensuring complete isolation from the frontend's React 19.
    - DevDependencies: `"jest": "^29.2.1"`, `"jest-expo": "~52.0.0"`, `"@testing-library/react-native": "^12.0.0"`, `"react-test-renderer": "18.3.1"`, `"typescript": "^5.3.0"`
    - Scripts: `"test": "jest"`, `"lint": "eslint ."`
  - [ ] Configure `mobile/tsconfig.json` for React 18 type isolation:
    - Set `"typeRoots": ["./node_modules/@types"]` and configure `"paths": { "react": ["./node_modules/react"], "@types/react": ["./node_modules/@types/react"] }` so that `npx tsc` resolves React 18 types locally rather than traversing upward to root `node_modules` (which contains frontend's React 19 types).
  - [ ] Configure `app.json` with app name (`BuggyBooks`), bundle identifier (`com.buggybooks.app`), and `"orientation": "default"`.
  - [ ] Add root npm scripts:
    - `"dev:mobile": "npm start --workspace=mobile"`
    - `"lint:mobile": "npm run lint --workspace=mobile"`
    - `"typecheck:mobile": "npx tsc --noEmit -p mobile/tsconfig.json"`
    - `"test:mobile:unit": "npm test --workspace=mobile"`
- **Acceptance Criteria**:
  - [ ] `npm run install:all` cleanly provisions all monorepo dependencies including `mobile/`.
  - [ ] `npm run typecheck:mobile` validates types without errors.
  - [ ] `npm run test:mobile:unit` executes successfully.
  - [ ] Metro bundler resolves `@buggybooks/types` without module resolution exceptions.

---

## 3. Definition of Done (DoD)

- [ ] All 3 user stories implemented and reviewed against acceptance criteria.
- [ ] Backend Jest unit and integration tests pass with 100% success (`npm run test:backend`).
- [ ] Token refresh endpoint verified via JSON body payloads and cookie fallbacks with zero `undefined` values.
- [ ] Multer file naming verified with Bearer token authentication in `profile.test.ts`.
- [ ] Frontend Vitest component tests pass with 100% success (`npm run test:frontend`).
- [ ] Playwright web E2E smoke tests pass without regressions (`npm run test:e2e:local`).
- [ ] `mobile/` compiles cleanly with zero TypeScript errors, resolves `@buggybooks/types`, and passes unit test suite (`npm run test:mobile:unit`).

---

## 4. Verification Commands

```bash
# 1. Verify backend tests with dual-auth coverage
npm run test:backend

# 2. Verify frontend unit tests remain green
npm run test:frontend

# 3. Verify TypeScript across mobile workspace
npm run typecheck:mobile

# 4. Verify mobile unit tests execute
npm run test:mobile:unit

# 5. Launch Expo dev server to verify mobile scaffolding & Metro resolution
npm run dev:mobile
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Metro Bundler Symlink Failure** | High | High | Explicitly configure `watchFolders` and `nodeModulesPaths` in `mobile/metro.config.js` to ensure hoisted packages from monorepo root resolve deterministically. |
| **Breaking Existing Web & Playwright Tests** | High | Low | Implement additive dual-authentication: Bearer tokens are checked first, falling back to `req.cookies?.token`. Existing cookies continue to be set and read identically. |
| **CSRF Bypass Security Vulnerability** | Critical | Low | Restrict CSRF bypass strictly to requests containing non-empty `Authorization: Bearer <token>` headers; reject requests with empty headers or cookie-only credentials. |


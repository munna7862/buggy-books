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
  *I want* the backend login, register, and refresh endpoints to accept and return JWT `token` and `refreshToken` in the JSON payload, and protected routes to accept `Authorization: Bearer <token>` headers,  
  *So that* native mobile clients can securely authenticate and silently rotate tokens without browser cookies.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Modify `backend/src/controllers/authController.ts`:
    - On `login`, return `{ message, username, token, refreshToken }`.
    - On `register`, return `{ message, username, token, refreshToken }`.
    - On `refresh`, accept `req.body.refreshToken` (or fallback to `req.cookies?.refreshToken`), invoke `authService.refresh`, and return `{ success: true, username, token, refreshToken }`.
    - Continue setting `httpOnly` cookies via `setAuthCookies(res, token, refreshToken)` for web backward compatibility.
  - [ ] Modify `backend/src/routes/api.ts` in `authenticateToken`:
    - Read `req.headers.authorization`. If it starts with `Bearer `, verify and extract user.
    - If `Authorization` header is not present, fall back to `req.cookies?.token`.
    - If neither is valid, return `401 Unauthorized`.
  - [ ] Add unit and integration tests in `backend/src/__tests__/auth.test.ts` verifying:
    - Bearer header authentication on protected routes (`/api/cart`, `/api/profile`).
    - Body-based token refresh (`POST /api/auth/refresh` with `{ refreshToken }`).
    - Existing cookie-based web auth flows remain 100% green.
- **Acceptance Criteria**:
  - [ ] Sending valid `Authorization: Bearer <jwt>` grants access to protected routes.
  - [ ] Sending valid `refreshToken` in request body returns new `token` and `refreshToken` pair in JSON.
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
      if (authHeader && authHeader.startsWith('Bearer ')) return true;
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
  *I want* a clean React Native + Expo TypeScript workspace initialized in `mobile/` with monorepo Metro resolution,  
  *So that* the mobile app is integrated into the monorepo and can consume `@buggybooks/types`.
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
    module.exports = config;
    ```
  - [ ] Configure `mobile/package.json` with dependencies:
    - `"@buggybooks/types": "*"`
    - `"@react-navigation/native"`, `"@react-navigation/native-stack"`, `"@react-navigation/bottom-tabs"`
    - `"expo-secure-store"`, `"expo-image-picker"`, `"expo-haptics"`
  - [ ] Configure `app.json` with app name (`BuggyBooks`), bundle identifier (`com.buggybooks.app`), and `"orientation": "default"`.
  - [ ] Add root npm scripts:
    - `"dev:mobile": "npm start --workspace=mobile"`
    - `"lint:mobile": "npm run lint --workspace=mobile"`
    - `"typecheck:mobile": "npx tsc --noEmit -p mobile/tsconfig.json"`
- **Acceptance Criteria**:
  - [ ] `npm run install:all` cleanly provisions all monorepo dependencies including `mobile/`.
  - [ ] `npm run typecheck:mobile` validates types without errors.
  - [ ] Metro bundler resolves `@buggybooks/types` without module resolution exceptions.

---

## 3. Definition of Done (DoD)

- [ ] All 3 user stories implemented and reviewed against acceptance criteria.
- [ ] Backend Jest unit and integration tests pass with 100% success (`npm run test:backend`).
- [ ] Token refresh endpoint verified via JSON body payloads and cookie fallbacks.
- [ ] Frontend Vitest component tests pass with 100% success (`npm run test:frontend`).
- [ ] Playwright web E2E smoke tests pass without regressions (`npm run test:e2e:local`).
- [ ] `mobile/` compiles cleanly with zero TypeScript errors and resolves `@buggybooks/types`.

---

## 4. Verification Commands

```bash
# 1. Verify backend tests with dual-auth coverage
npm run test:backend

# 2. Verify frontend unit tests remain green
npm run test:frontend

# 3. Verify TypeScript across mobile workspace
npm run typecheck:mobile

# 4. Launch Expo dev server to verify mobile scaffolding & Metro resolution
npm run dev:mobile
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Metro Bundler Symlink Failure** | High | High | Explicitly configure `watchFolders` and `nodeModulesPaths` in `mobile/metro.config.js` to ensure hoisted packages from monorepo root resolve deterministically. |
| **Breaking Existing Web & Playwright Tests** | High | Low | Implement additive dual-authentication: Bearer tokens are checked first, falling back to `req.cookies?.token`. Existing cookies continue to be set and read identically. |
| **CSRF Bypass Security Vulnerability** | Critical | Low | Restrict CSRF bypass strictly to requests containing non-empty `Authorization: Bearer <token>` headers; reject requests with empty headers or cookie-only credentials. |


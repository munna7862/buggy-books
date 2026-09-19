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
  *I want* the backend login and register endpoints to return the JWT `token` and `refreshToken` in the JSON response and accept `Authorization: Bearer <token>` headers,  
  *So that* native mobile clients can securely authenticate without being constrained to browser cookie jars.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Modify `backend/src/controllers/authController.ts`:
    - On `login`, return `{ message, username, token, refreshToken }`.
    - On `register`, return `{ message, username, token, refreshToken }`.
    - Continue setting `httpOnly` cookies via `setAuthCookies(res, token, refreshToken)`.
  - [ ] Modify `backend/src/routes/api.ts` in `authenticateToken`:
    - Read `req.headers.authorization`. If it starts with `Bearer `, verify and extract user.
    - If `Authorization` header is not present, fall back to `req.cookies?.token`.
    - If neither is valid, return `401 Unauthorized`.
  - [ ] Add unit tests in `backend/src/__tests__/auth.test.ts` verifying both Bearer header and cookie auth flows.
- **Acceptance Criteria**:
  - [ ] Sending valid `Authorization: Bearer <jwt>` grants access to protected routes (`/api/cart`, `/api/profile`, `/api/orders`).
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

### User Story US-MOB-1113: Expo Monorepo Workspace Scaffolding
- **Story Statement**:  
  *As a* Mobile Developer,  
  *I want* a clean React Native + Expo TypeScript workspace initialized in `mobile/`,  
  *So that* the mobile app is integrated into the monorepo and can consume `@buggybooks/types`.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Update root `package.json` to include `"mobile"` in the `workspaces` array.
  - [ ] Scaffold `mobile/` with Expo SDK 52+, React Native 0.76+, and TypeScript.
  - [ ] Configure `mobile/package.json` with dependencies:
    - `"@buggybooks/types": "*"`
    - `"@react-navigation/native"`, `"@react-navigation/native-stack"`, `"@react-navigation/bottom-tabs"`
    - `"expo-secure-store"`, `"expo-image-picker"`
  - [ ] Configure `app.json` with app name (`BuggyBooks`), bundle identifier (`com.buggybooks.app`), and orientation settings.
  - [ ] Add root npm scripts: `"dev:mobile": "npm start --workspace=mobile"`.
- **Acceptance Criteria**:
  - [ ] `npm run install:all` cleanly provisions all monorepo dependencies including `mobile/`.
  - [ ] `npm run typecheck` validates types across backend, frontend, and mobile without errors.

---

## 3. Definition of Done (DoD)

- [ ] All 3 user stories implemented and reviewed against acceptance criteria.
- [ ] Backend Jest unit and integration tests pass with 100% success (`npm run test:backend`).
- [ ] Frontend Vitest component tests pass with 100% success (`npm run test:frontend`).
- [ ] Playwright web E2E smoke tests pass without regressions (`npm run test:e2e:local`).
- [ ] `mobile/` compiles cleanly with zero TypeScript errors.

---

## 4. Verification Commands

```bash
# 1. Verify backend tests with dual-auth coverage
npm run test:backend

# 2. Verify frontend unit tests remain green
npm run test:frontend

# 3. Verify TypeScript across all workspaces
npm run typecheck

# 4. Launch Expo dev server to verify mobile scaffolding
npm run dev:mobile
```

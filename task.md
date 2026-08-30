# Sprint 1.3: Frontend ESLint Resolution & Test Hygiene

**Sprint Identifier**: `SPRINT-1.3-FRONTEND-HYGIENE`  
**Phase**: Phase 1 (Full-Stack Quality & Developer Foundations)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Resolve all 34 ESLint errors across the React 19 frontend codebase, eliminate React 19 test `act(...)` console warnings in Vitest, and map shared domain contracts in `frontend/src/api.ts`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task tracking, sprint burndown, phase gate sign-off. |
| **SDET Architect** | AI Agent / SDET | Test hygiene audit, wrapping async state updates in Vitest tests with `waitFor`/`act()`, test suite verification. |
| **Dev Architect** | AI Agent / Dev Arch | Refactoring React hooks (`useProfile`, `useBooks`, `useCart`), fixing 34 lint errors, mapping `/shared/types/` in `api.ts`. |
| **Security Officer** | AI Agent / Sec Officer | Reviewing auth/profile mutations, credential security, strict typing verification. |
| **Product Owner** | AI Agent / PO | Conducting visual/functional check and Phase 1 Authorization. |
| **DevOps Engineer** | AI Agent / DevOps | Verifying Phase 1 completion, conventional commits, remote push, and preparing PR. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-FE-101: Resolve 34 Frontend ESLint Errors
*As a frontend engineer, I want all 34 ESLint errors resolved in the frontend codebase, so that `npm run lint` executes with 0 errors and complies with React 19 strict standards.*
- [x] **US-FE-101.1** [Dev Architect]: Configure `frontend/eslint.config.js` with `allowConstantExport: true` and `allowExportNames` for React Refresh.
- [x] **US-FE-101.2** [Dev Architect]: Refactor `src/hooks/useProfile.ts` to eliminate synchronous `setState` in `useEffect` and replace `any` with strong typing.
- [x] **US-FE-101.3** [Dev Architect]: Refactor `src/pages/BookDetail.tsx` to fix synchronous `setState` in `useEffect`.
- [x] **US-FE-101.4** [Dev Architect]: Refactor `src/pages/Register.tsx` to convert password strength into pure derived state and replace `any`.
- [x] **US-FE-101.5** [Dev Architect]: Refactor `src/AuthContext.tsx` to remove redundant synchronous state setting in effect and fix unused variable `e`.
- [x] **US-FE-101.6** [Dev Architect]: Refactor `src/hooks/useBooks.ts` to eliminate synchronous state setting in effect body.
- [x] **US-FE-101.7** [Dev Architect]: Refactor `src/hooks/useCart.ts` to eliminate unused variable `e`, synchronous effect state setter, and `any` types.
- [x] **US-FE-101.8** [Dev Architect]: Refactor `src/hooks/useCheckout.ts` to eliminate unused `_total` variable.
- [x] **US-FE-101.9** [Dev Architect]: Refactor `src/pages/Login.tsx` and `src/pages/Profile.tsx` to eliminate unused variables and `any` types.
- [x] **US-FE-101.10** [Dev Architect]: Refactor `src/mocks/handlers.ts` to replace explicit `any` types with typed params/requests.
- [x] **US-FE-101.11** [Dev Architect]: Refactor `src/setupTests.ts`, `src/pages/Login.test.tsx`, and `src/pages/Register.test.tsx` to replace `any` with `vi.mocked(...)`.
- [x] **US-FE-101.12** [Dev Architect]: Verify `npm run lint` in `frontend/` outputs `0 problems (0 errors, 0 warnings)`.

### User Story US-FE-102: Eliminate React 19 `act(...)` Warnings & Test Hygiene in Vitest
*As an SDET running component tests, I want Vitest test suites to execute cleanly without `Warning: An update to TestComponent was not wrapped in act(...)` or unhandled rejections, so that test execution logs are clean and deterministic.*
- [x] **US-FE-102.1** [SDET Architect]: Refactor `src/pages/Cart.test.tsx` to wrap removal and clearing interactions with `fireEvent` and wait for DOM assertions.
- [x] **US-FE-102.2** [SDET Architect]: Refactor `src/App.test.tsx` to wait for initial async state settlements (`ChaosProvider` / `Catalog`).
- [x] **US-FE-102.3** [SDET Architect]: Refactor `src/pages/Catalog.test.tsx` to provide `getCart` mock on `api` and use static imports.
- [x] **US-FE-102.4** [SDET Architect]: Verify all 9 Vitest test suites (26 tests) pass with 100% clean output.

### User Story US-FE-103: Type API Responses in `api.ts` with Shared Contracts
*As a frontend developer, I want `frontend/src/api.ts` to return typed interfaces from `/shared/types/`, so that component consumers have full compile-time safety when accessing book, cart, and user properties.*
- [x] **US-FE-103.1** [Dev Architect]: Import `Book`, `CartItem`, `PaginatedBooks`, `ChaosConfig`, `UserRecord`, `Order` from `@buggybooks/types`.
- [x] **US-FE-103.2** [Dev Architect]: Type generic `processResponse<T>` and `apiRequest<T>` methods.
- [x] **US-FE-103.3** [Dev Architect]: Annotate all `api.*` methods with explicit return types.
- [x] **US-FE-103.4** [Dev Architect]: Verify `npm run build` compiles cleanly with zero `any` fallbacks.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect React hooks refactoring, zero-any compliance, and `/shared/types/` integration. 0 `any` types and 0 lint errors achieved. | `[APPROVED]` |
| **Security Audit** | Security Officer | Verify authentication flow, profile upload handling, error handling, and token security. | `[APPROVED]` |
| **SDET Quality Gate** | SDET Architect | Verify 26 Vitest tests pass with 0 `act()` warnings and full monorepo test pass (66 backend + 26 frontend = 92 tests). | `[APPROVED]` |
| **PO Phase 1 Review** | Product Owner | Verify full Phase 1 acceptance criteria across Monorepo DX, Backend, and Frontend. Phase 1 complete and release authorized. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] All 34 ESLint errors resolved (`npm run lint` returns 0 errors, 0 warnings).
- [x] All 26 Vitest component tests pass with 0 warnings.
- [x] TypeScript compiles cleanly with `npm run build`.
- [x] Phase 1 criteria fully satisfied across Monorepo, Backend, and Frontend.
- [x] Changes committed to feature branch with conventional commits.
- [x] Pull Request opened via `gh pr create` with structured summary and test evidence.
- [x] Phase 1 sign-off issued by Product Owner.

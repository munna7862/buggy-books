# Sprint 1.3: Frontend ESLint Resolution & Test Hygiene

**Sprint Identifier**: `SPRINT-1.3-FRONTEND-HYGIENE`  
**Phase Mapping**: Phase 1 (Full-Stack Quality & Developer Foundations)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Resolve all 34 ESLint errors across the React 19 frontend codebase, eliminate React 19 test `act(...)` console warnings in Vitest, and map shared domain contracts in `frontend/src/api.ts`.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task tracking, sprint burndown, phase gate sign-off. |
| **Dev Architect** | AI Agent / Dev Arch | Refactoring React hooks (`useProfile`), fixing 34 lint errors, mapping `/shared/types/` in `api.ts`. |
| **SDET Architect** | AI Agent / SDET | Wrapping async state updates in Vitest tests with `waitFor`/`act()`. |
| **Product Owner** | Human PO / AI PO | Conducting visual/functional check and Phase 1 Authorization. |
| **DevOps Engineer** | AI Agent / DevOps | Verifying Phase 1 completion and preparing PR. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-FE-101: Resolve 34 Frontend ESLint Errors
- **Story Statement**:  
  *As a* frontend engineer,  
  *I want* all 34 ESLint errors resolved in the frontend codebase,  
  *So that* `npm run lint` executes with 0 errors and complies with React 19 strict standards.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Fix synchronous `setState` in `useEffect` in `src/hooks/useProfile.ts` (lines 30–32).
  - [ ] Fix synchronous `setState` in `useEffect` in `src/pages/BookDetail.tsx` (line 16).
  - [ ] Fix synchronous `setState` in `useEffect` in `src/pages/Register.tsx` (line 40).
  - [ ] Replace explicit `any` types in `src/mocks/handlers.ts` (lines 66, 77, 99, 115, 163).
  - [ ] Replace explicit `any` types in `src/pages/Login.tsx`, `Login.test.tsx`, `Register.test.tsx`, `Profile.tsx`, and `setupTests.ts`.
  - [ ] Remove unused variable `err` in `src/pages/Profile.tsx` (line 41).
- **Acceptance Criteria**:
  - [ ] Running `cd frontend && npm run lint` outputs `0 problems (0 errors, 0 warnings)`.

---

### User Story US-FE-102: Eliminate React 19 `act(...)` Warnings in Vitest
- **Story Statement**:  
  *As an* SDET running component tests,  
  *I want* Vitest test suites to execute cleanly without `Warning: An update to TestComponent was not wrapped in act(...)`,  
  *So that* test execution logs are clean and deterministic.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] Inspect `src/__tests__/msw-api-mocking.test.tsx` and wrap async state transitions in React Testing Library `waitFor()`.
  - [ ] Verify all 9 test files (26 tests) pass cleanly without console warnings.
- **Acceptance Criteria**:
  - [ ] `cd frontend && npm test` passes 100% of tests with clean console output.

---

### User Story US-FE-103: Type API Responses in `api.ts` with Shared Contracts
- **Story Statement**:  
  *As a* frontend developer,  
  *I want* `frontend/src/api.ts` to return typed interfaces from `/shared/types/`,  
  *So that* component consumers have full compile-time safety when accessing book, cart, and user properties.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] Import `Book`, `Cart`, `User`, `ChaosConfig` from `/shared/types/`.
  - [ ] Annotate API methods in `src/api.ts` with explicit return types.
- **Acceptance Criteria**:
  - [ ] `cd frontend && npm run build` compiles cleanly with zero `any` fallbacks.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Dev Technical Review** | Dev Architect | Inspect React hooks refactoring and `/shared/types/` integration. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Verify 26 Vitest tests pass with 0 `act()` warnings. | `[PENDING]` |
| **PO Phase 1 Review** | Product Owner | Verify full Phase 1 acceptance criteria (DX, Backend, Frontend). | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] All 34 ESLint errors resolved (`npm run lint` returns 0 errors).
- [ ] All 26 Vitest component tests pass with 0 warnings.
- [ ] TypeScript compiles cleanly with `npm run build`.
- [ ] Phase 1 criteria fully satisfied across Monorepo, Backend, and Frontend.
- [ ] Changes committed to feature branch with conventional commits.
- [ ] Phase 1 sign-off issued by Product Owner.

---

## 5. Sprint Verification Plan

```bash
# 1. Frontend Lint Check
cd frontend
npm run lint

# 2. Frontend Component Tests
npm test

# 3. Frontend Production Build
npm run build

# 4. Monorepo Cross-Project Verification (from root)
npm run typecheck
npm run test:unit
```

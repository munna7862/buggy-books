# Sprint 9.3: Frontend Dynamic CSRF Lifecycle, Route Safety & Mock Harmonization

**Sprint Identifier**: `SPRINT-9.3-FRONTEND-DYNAMIC-CSRF-ROUTE-SAFETY-AND-MOCK-HARMONIZATION`  
**Phase Mapping**: [Phase 9: Full-Stack Quality Hardening, Monorepo Workspaces & System Resilience](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_9_full_stack_quality_hardening_monorepo_workspaces_and_system_resilience.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement a resilient self-healing CSRF token lifecycle in `api.ts`, replace abrupt `window.location.href` redirects with React Router navigation callbacks, harmonize frontend test mocks around MSW, and add baseline accessibility roles to the Shadow DOM component.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Backlog Grooming, Sprint Goal alignment, DoD verification, and velocity burndown tracking. |
| **Frontend Specialist** | AI Agent / Frontend | Refactoring [api.ts](file:///c:/BuggyBooks/buggy-books/frontend/src/api.ts) with self-healing CSRF retries, integrating navigation callbacks, and enhancing [OrderSummary.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/components/OrderSummary.tsx). |
| **QA Test Architect** | AI Agent / QA Lead | Harmonizing frontend test mocks in [setupTests.ts](file:///c:/BuggyBooks/buggy-books/frontend/src/setupTests.ts) around MSW handlers in `src/mocks/`. |
| **Accessibility Specialist** | AI Agent / A11y | Ensuring `<order-summary-box>` Web Component contains valid semantic landmark roles and ARIA labels. |
| **Product Owner** | Human PO / AI PO | Validating seamless UX during session timeouts and smooth client-side checkout interactions. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-FE-931: Self-Healing CSRF Token Lifecycle & Safe Navigation Callbacks
- **Story Statement**:  
  *As a* User / QA Automation Script,  
  *I want* mutating API calls in `api.ts` to automatically refresh invalid CSRF tokens and handle session expiration through React Router,  
  *So that* requests do not fail with unexpected 403 Forbidden errors and token expiration does not abruptly crash the SPA or Vitest tests.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] In [frontend/src/api.ts](file:///c:/BuggyBooks/buggy-books/frontend/src/api.ts#L35-L50):
    - Replace static global `csrfToken` with dynamic lifecycle handling.
    - If a mutating request fails with HTTP 403 and the error mentions CSRF token mismatch, invalidate `csrfToken = null`, fetch a new token via `/csrf-token`, and retry the request once before throwing.
  - [ ] In [frontend/src/api.ts](file:///c:/BuggyBooks/buggy-books/frontend/src/api.ts#L110,L128,L139):
    - Remove hardcoded `window.location.href = '/login'`.
    - Provide an `onUnauthorized` callback hook or event listener registered by [AuthContext.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/AuthContext.tsx) to execute smooth client-side navigation (`navigate('/login')`) without wiping browser memory or breaking Vitest test runners.
- **Acceptance Criteria**:
  - [ ] A simulated 403 CSRF token mismatch automatically triggers a token refresh and succeeds on the retry attempt.
  - [ ] An unauthenticated 401 response invokes the `AuthContext` navigation handler instead of triggering a full-page browser reload.

---

### User Story US-FE-932: Test Mock Harmonization around MSW
- **Story Statement**:  
  *As a* Frontend Developer writing unit and component tests,  
  *I want* a unified Mock Service Worker (MSW) layer for all component tests,  
  *So that* test mocking is consistent, isolated, and doesn't rely on brittle string-matching `globalThis.fetch` overrides.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Review [setupTests.ts](file:///c:/BuggyBooks/buggy-books/frontend/src/setupTests.ts#L5-L50) and deprecate the crude `globalThis.fetch = vi.fn().mockImplementation(...)` block.
  - [ ] Expand [frontend/src/mocks/handlers.ts](file:///c:/BuggyBooks/buggy-books/frontend/src/mocks/handlers.ts) with default handlers for `/api/test/config`, `/api/books`, `/api/csrf-token`, and `/api/cart`.
  - [ ] Update `setupTests.ts` to boot MSW (`server.listen()`) before all tests, reset handlers after each test (`server.resetHandlers()`), and close the server on teardown.
  - [ ] Verify all 10 frontend test suites in `frontend/src/` execute against MSW cleanly.
- **Acceptance Criteria**:
  - [ ] All 32 frontend component and hook tests pass using MSW without unhandled request warnings.
  - [ ] Removing the `globalThis.fetch` override does not break Catalog, Cart, Checkout, Login, or Register tests.

---

### User Story US-FE-933: Shadow DOM Web Component Baseline Accessibility
- **Story Statement**:  
  *As an* Assistive Technology User / Accessibility Auditor,  
  *I want* the `<order-summary-box>` Shadow DOM Web Component to expose standard ARIA roles and labels,  
  *So that* automated accessibility scans pass cleanly when chaos mode is disabled while preserving the shadow boundary for automation test challenges.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] In [frontend/src/components/OrderSummary.tsx](file:///c:/BuggyBooks/buggy-books/frontend/src/components/OrderSummary.tsx), inspect the internal Web Component template.
  - [ ] Add semantic landmark container attributes inside the shadow root:
    ```html
    <div class="summary-wrapper" role="region" aria-label="Order Summary">
      <h3 id="summary-title">Order Summary</h3>
      ...
    </div>
    ```
  - [ ] Retain the shadow root isolation (`this.attachShadow({ mode: 'open' })`) to ensure the intentional testing challenge remains fully active for Selenium and Playwright scripts.
- **Acceptance Criteria**:
  - [ ] Axe accessibility scan on the Checkout page passes with 0 violations when `injectA11yViolations` chaos is disabled.
  - [ ] Shadow root encapsulation remains fully intact for test automation piercing exercises.

---

## 3. Definition of Done & Quality Gates

- [ ] Mutating API requests in `api.ts` transparently recover from 403 CSRF token mismatches via automatic retry.
- [ ] No direct assignments to `window.location.href` exist in `api.ts`; navigation is managed via `AuthContext`.
- [ ] All frontend component tests in `frontend/` execute using MSW with zero global fetch mock collisions.
- [ ] `<order-summary-box>` contains valid ARIA region roles inside the shadow root.
- [ ] All 10 frontend test suites (32 tests) pass with 100% green status in Vitest.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[PLANNED]`
- **Committed Story Points**: 5 SP
- **Primary Deliverables**:
  1. Self-healing CSRF retry lifecycle in `frontend/src/api.ts`.
  2. Non-destructive React Router navigation callback integration.
  3. Consolidated MSW mock architecture across all Vitest suites.
  4. Accessible ARIA landmark roles inside the Order Summary Shadow DOM.

# Sprint 2.2: Generic ApiUtil & Page Object Architecture Linter

**Sprint Identifier**: `SPRINT-2.2-API-AND-POM-HARDENING`  
**Phase Mapping**: Phase 2 (Test Automation Modernization & CI/CD Resilience)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Enhance `ApiUtil` with TypeScript generics for compile-time API response safety, and expand `finalize-spec.ts` to statically lint Page Objects for proper encapsulation and `BasePage` wrapper usage.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task tracking, sprint burndown. |
| **Playwright QA Specialist** | AI Agent / QA Spec | Refactoring `api.util.ts` with generics, expanding `finalize-spec.ts`. |
| **SDET Architect** | AI Agent / SDET | Reviewing static analysis rules and verifying API test contracts. |
| **Product Owner** | Human PO / AI PO | Reviewing quality gate validator improvements. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-E2E-203: Generic Type-Safe `ApiUtil`
- **Story Statement**:  
  *As an* API automation engineer,  
  *I want* `ApiUtil.makeRequest<T>()` to accept a generic return type,  
  *So that* response payloads in API tests are strictly typed rather than `any`.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Refactor `playwright-e2e/src/utils/api.util.ts`:
    ```typescript
    public async makeRequest<T = any>(options: {
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      url: string;
      data?: any;
      headers?: Record<string, string>;
      logMessage: string;
      responseType?: "data" | "status" | "headers" | "full";
      timeout?: number;
    }): Promise<T>
    ```
  - [ ] Update API specs in `src/tests/api/` to use typed models from `/shared/types/`.
- **Acceptance Criteria**:
  - [ ] `ApiUtil.makeRequest<Book[]>(...)` returns strongly-typed array of `Book`.
  - [ ] TypeScript compiles cleanly with zero `any` return warnings.

---

### User Story US-E2E-204: Extend `finalize-spec.ts` to Lint Page Objects
- **Story Statement**:  
  *As an* SDET Architect,  
  *I want* `finalize-spec.ts` to statically validate Page Objects in `src/pages/`,  
  *So that* anti-patterns like raw `page.click()` or public locators are blocked before merging.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Add Page Object validator logic in `scripts/finalize-spec.ts`:
    - Rule 1: Check for forbidden raw calls (`page.click(`, `page.fill(`, `page.textContent(`); must use `this.doClick`, `this.doEnterText`, `this.doGetText`.
    - Rule 2: Check that locators are defined as `private get <name>()`.
  - [ ] Add command option: `npm run finalize-spec -- --all-poms` to validate all POMs.
- **Acceptance Criteria**:
  - [ ] `npm run finalize-spec -- src/pages/checkout.page.ts` validates checkout POM cleanly.
  - [ ] Anti-pattern violations in Page Objects are reported with actionable error messages.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Verify POM static linter catches prohibited raw locator calls. | `[PENDING]` |
| **Dev Technical Review** | Dev Architect | Review generic type signatures in `api.util.ts`. | `[PENDING]` |
| **PO Acceptance Gate** | Product Owner | Verify clean developer output from `finalize-spec`. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] `ApiUtil` generic method implemented and verified with typed API specs.
- [ ] `finalize-spec.ts` extended to lint Page Objects.
- [ ] All Page Objects in `src/pages/` pass the new static linter rules.
- [ ] Playwright E2E and API suites pass 100%.
- [ ] Changes committed to feature branch with conventional commits.
- [ ] Handoff verified by Scrum Master for Sprint 2.3 kickoff.

---

## 5. Sprint Verification Plan

```bash
cd playwright-e2e

# 1. Test Page Object validation
npm run finalize-spec -- src/pages/catalog.page.ts

# 2. Run API specs with generic ApiUtil
npm run finalize-spec -- src/tests/api/BookCatalog/Test_001_BooksApi.spec.ts run
```

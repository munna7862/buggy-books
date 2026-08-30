# Sprint 2.2: Generic ApiUtil & Page Object Architecture Linter

**Sprint Identifier**: `SPRINT-2.2-API-AND-POM-HARDENING`  
**Phase**: Phase 2 (Test Automation Modernization & CI/CD Resilience)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Enhance `ApiUtil` with TypeScript generics for compile-time API response safety, and expand `finalize-spec.ts` to statically lint Page Objects for proper encapsulation and `BasePage` wrapper usage.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task tracking, sprint burndown, phase alignment, and handoff management. |
| **SDET Architect** | AI Agent / SDET | Reviewing static analysis rules, API contract definitions, and POM encapsulation patterns. |
| **Playwright QA Specialist** | AI Agent / QA Spec | Refactoring `api.util.ts` with generics, expanding `finalize-spec.ts`, refactoring Page Objects. |
| **Product Owner** | AI Agent / PO | Reviewing quality gate validator output and sprint acceptance criteria. |
| **DevOps Engineer** | AI Agent / DevOps | Git branch management, GitHub CLI Pull Request creation (`gh pr create`). |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-E2E-203: Generic Type-Safe `ApiUtil`
*As an API automation engineer, I want `ApiUtil.makeRequest<T>()` to accept a generic return type, so that response payloads in API tests are strictly typed rather than `any`.*
- [x] **US-E2E-203.1** [Playwright QA Specialist]: Refactor `ApiUtil.makeRequest<T = any>()` signature and implementation in `playwright-e2e/src/utils/api.util.ts` to return `Promise<T>`.
- [x] **US-E2E-203.2** [Playwright QA Specialist]: Strongly type `getBearerToken()` return value with `{ access_token: string }`.
- [x] **US-E2E-203.3** [SDET Architect]: Connect `Test_001_BooksApi.spec.ts` with `@buggybooks/types` (`Book`, `PaginatedBooks`) and `AxiosResponse`.
- [x] **US-E2E-203.4** [SDET Architect]: Create mirrored test data files under `src/test-data/api/` for `BookCatalog`, `CartAndInventory`, `ChaosAndTesting`, and `UserManagement`.
- [x] **US-E2E-203.5** [Playwright QA Specialist]: Strongly type all remaining API test specs (`CartAndInventory`, `ChaosAndTesting`, `Logging`, `UserManagement`).

### User Story US-E2E-204: Extend `finalize-spec.ts` to Lint Page Objects
*As an SDET Architect, I want `finalize-spec.ts` to statically validate Page Objects in `src/pages/`, so that anti-patterns like raw `page.click()` or public locators are blocked before merging.*
- [x] **US-E2E-204.1** [Playwright QA Specialist]: Implement Rule 1 (Wrapper Method Usage) in `scripts/finalize-spec.ts` to block raw `page.click(`, `page.fill(`, `page.textContent(`.
- [x] **US-E2E-204.2** [Playwright QA Specialist]: Implement Rule 2 (Locator Encapsulation) in `scripts/finalize-spec.ts` requiring locators to be `private get <name>(): Locator`.
- [x] **US-E2E-204.3** [Playwright QA Specialist]: Implement Rule 3 (BasePage Inheritance) and Rule 4 (No Static Waits).
- [x] **US-E2E-204.4** [Playwright QA Specialist]: Add `--all-poms` command line option and single POM file validation.
- [x] **US-E2E-204.5** [Playwright QA Specialist]: Refactor all 7 Page Objects in `src/pages/` to comply 100% with the new static linter rules.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Verify POM static linter catches prohibited raw locator calls and enforces private getter encapsulation. 29/29 checks passing across all 7 Page Objects. | `[APPROVED]` |
| **Dev Technical Review** | Dev Architect | Reviewed generic type signatures in `api.util.ts` and integration with `@buggybooks/types`. Zero compile warnings. | `[APPROVED]` |
| **PO Acceptance Gate** | Product Owner | Verified clear and actionable developer feedback for both Page Objects and API specs from `finalize-spec`. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `ApiUtil` generic method implemented and verified with typed API specs.
- [x] `finalize-spec.ts` extended to lint Page Objects.
- [x] All Page Objects in `src/pages/` pass the new static linter rules (29/29 checks passed).
- [x] Playwright E2E and API suites pass 100% with zero TypeScript errors (`npm run typecheck`).
- [x] Changes committed to feature branch `feature/sprint-2-2-api-and-pom-hardening` with conventional commits.
- [x] Remote Pull Request created via GitHub CLI (`gh pr create`) with structured summary.
- [x] Handoff verified by Scrum Master for Sprint 2.3 kickoff.


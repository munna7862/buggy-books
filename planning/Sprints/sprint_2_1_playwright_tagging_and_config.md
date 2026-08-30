# Sprint 2.1: Playwright Config Modernization & Tag-Based Execution

**Sprint Identifier**: `SPRINT-2.1-PLAYWRIGHT-TAGGING`  
**Phase Mapping**: Phase 2 (Test Automation Modernization & CI/CD Resilience)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Modernize Playwright configuration by replacing the static test list with dynamic glob discovery, implementing test tags (`@smoke`, `@regression`, `@chaos`, `@a11y`), and making `BasePage` action timeouts dynamically configurable.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task tracking and workflow management. |
| **SDET Architect** | AI Agent / SDET | Designing test tagging strategy, updating `specs/test_cases_catalog.md`. |
| **Playwright QA Specialist** | AI Agent / QA Spec | Refactoring `playwright.config.ts`, annotating specs with `@smoke`/`@regression`, updating `BasePage`. |
| **Product Owner** | Human PO / AI PO | Validating smoke and regression test batch execution. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-E2E-201: Dynamic Glob Discovery & Tag Filtering
- **Story Statement**:  
  *As a* test automation engineer or CI pipeline,  
  *I want* Playwright to dynamically discover all specs matching `src/tests/**/*.spec.ts` and support filtering via `@smoke`/`@regression` tags,  
  *So that* newly added specs run automatically without manually editing hardcoded config arrays.
- **Story Points**: 3 SP (Medium)
- **Status**: `[COMPLETED]`
- **Technical Subtasks**:
  - [x] Remove hardcoded `specificTests` array in `playwright.config.ts`.
  - [x] Set default `testMatch: ['**/*.spec.ts']`.
  - [x] Annotate high-priority test titles across all 26 specs in `src/tests/ui/` and `src/tests/api/` with `@smoke`, `@regression`, `@chaos`, `@a11y`.
  - [x] Verify `--grep "@smoke"` executes only smoke-tagged tests (39 smoke tests identified across 24 files).
- **Acceptance Criteria**:
  - [x] Running `npx playwright test --grep "@smoke"` runs all and only smoke tests.
  - [x] Running `npx playwright test` discovers all 26 specs / 104 tests under `src/tests/`.

---

### User Story US-E2E-202: Configurable BasePage Timeouts
- **Story Statement**:  
  *As an* SDET debugging failing tests,  
  *I want* `BasePage` element timeouts to be configurable via environment variables (defaulting to 15,000ms),  
  *So that* failing locator assertions fail fast instead of hanging for 60 seconds.
- **Story Points**: 2 SP (Medium)
- **Status**: `[COMPLETED]`
- **Technical Subtasks**:
  - [x] Add `timeout: parseInt(process.env.ELEMENT_TIMEOUT || '15000', 10)` in `env.config.ts`.
  - [x] Update `BasePage.DEFAULT_TIMEOUT` in `src/core/base/base.page.ts` to reference `envConfig.timeout`.
- **Acceptance Criteria**:
  - [x] `BasePage` actions (`doClick`, `doEnterText`, `doGetText`) use the dynamic 15s timeout.
  - [x] Setting `ELEMENT_TIMEOUT=5000` dynamically changes the timeout to 5,000ms.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **SDET Code Review** | SDET Architect | Verify test tagging annotations align with `test_cases_catalog.md`. Tags `@smoke`, `@regression`, `@chaos`, `@a11y` verified across all 26 specs. | `[PASSED]` |
| **QA Quality Gate** | Playwright QA | Dynamic test discovery and tag filtering verified; TypeScript compilation 100% clean across monorepo (`npm run typecheck`). | `[PASSED]` |
| **PO Acceptance Gate** | Product Owner | Verified smoke suite discovery (39 tests in 24 files) and customizable timeout support. | `[PASSED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Static test array removed from `playwright.config.ts`.
- [x] Specs annotated with `@smoke`, `@regression`, `@chaos`, `@a11y` tags.
- [x] `BasePage` timeout refactored to configurable 15s default.
- [x] Dynamic test discovery verified (104 tests across 26 files).
- [x] Tag-filtered execution verified (`--grep "@smoke"`).
- [x] Custom timeout override verified (`ELEMENT_TIMEOUT=5000`).
- [x] Changes committed to feature branch with conventional commits.
- [x] Handoff prepared by Scrum Master for Sprint 2.2 kickoff.

---

## 5. Sprint Verification Plan

```bash
cd playwright-e2e

# 1. Verify dynamic discovery and test listing
npx playwright test --list --config=src/config/playwright.config.ts

# 2. Verify smoke tag discovery
npx playwright test --list --grep "@smoke" --config=src/config/playwright.config.ts

# 3. Verify custom timeout override
npx cross-env HEADLESS=true ELEMENT_TIMEOUT=5000 npx playwright test src/tests/ui/UserManagement/Test_001_RegisterUser.spec.ts --config=src/config/playwright.config.ts
```

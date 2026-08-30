# Sprint 2.1: Playwright Config Modernization & Tag-Based Execution

**Sprint Identifier**: `SPRINT-2.1-PLAYWRIGHT-TAGGING`  
**Phase**: Phase 2 (Test Automation Modernization & CI/CD Resilience)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Modernize Playwright configuration by replacing the static test list with dynamic glob discovery, implementing test tags (`@smoke`, `@regression`, `@chaos`, `@a11y`), and making `BasePage` action timeouts dynamically configurable.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Task tracking, sprint burndown, phase alignment, and handoff management. |
| **SDET Architect** | AI Agent / SDET | Test tagging strategy, `test_cases_catalog.md` updates, `BasePage` timeout architecture. |
| **Playwright QA Specialist** | AI Agent / QA Spec | Refactoring `playwright.config.ts`, `env.config.ts`, annotating 26 spec files with tags, verifying smoke and regression runs. |
| **Product Owner** | AI Agent / PO | Reviewing tag coverage, validating test execution speed and smoke suite precision. |
| **DevOps Engineer** | AI Agent / DevOps | Verifying environment configuration, CI matrix compatibility, conventional commits. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-E2E-201: Dynamic Glob Discovery & Tag Filtering
*As a test automation engineer or CI pipeline, I want Playwright to dynamically discover all specs matching `src/tests/**/*.spec.ts` and support filtering via `@smoke`/`@regression`/`@chaos`/`@a11y` tags, so that newly added specs run automatically without manually editing hardcoded config arrays.*
- [x] **US-E2E-201.1** [Playwright QA Specialist]: Remove hardcoded `specificTests` array and legacy `loadTestSuite()` in `playwright.config.ts`.
- [x] **US-E2E-201.2** [Playwright QA Specialist]: Configure dynamic `testMatch: ['**/*.spec.ts']` under `testDir: '../tests'`.
- [x] **US-E2E-201.3** [SDET Architect]: Annotate all 18 UI test spec titles with `@smoke`, `@regression`, `@chaos`, `@a11y` tags based on catalog priorities.
- [x] **US-E2E-201.4** [SDET Architect]: Annotate all 8 API test spec titles with `@smoke`, `@regression`, `@chaos` tags based on catalog priorities.
- [x] **US-E2E-201.5** [Playwright QA Specialist]: Verify `npx playwright test --grep "@smoke"` executes only smoke-tagged tests.
- [x] **US-E2E-201.6** [Playwright QA Specialist]: Verify `npx playwright test --list` discovers all 26 specs dynamically (104 tests across 26 files).

### User Story US-E2E-202: Configurable BasePage Timeouts
*As an SDET debugging failing tests, I want `BasePage` element timeouts to be configurable via environment variables (defaulting to 15,000ms), so that failing locator assertions fail fast instead of hanging for 60 seconds.*
- [x] **US-E2E-202.1** [Playwright QA Specialist]: Add `timeout: parseInt(process.env.ELEMENT_TIMEOUT || '15000', 10)` in `playwright-e2e/src/config/env.config.ts`.
- [x] **US-E2E-202.2** [Playwright QA Specialist]: Update `BasePage.DEFAULT_TIMEOUT` in `playwright-e2e/src/core/base/base.page.ts` to reference `envConfig.timeout`.
- [x] **US-E2E-202.3** [SDET Architect]: Clean up legacy `USE_SPECIFIC_TESTS` from `env.config.ts`, `.env`, and documentation.
- [x] **US-E2E-202.4** [SDET Architect]: Verify custom timeout override works via `ELEMENT_TIMEOUT=5000`.

### User Story US-E2E-203: Catalog and Documentation Alignment
*As a team member, I want the test documentation and test catalog updated to reflect tag annotations and dynamic configuration.*
- [x] **US-E2E-203.1** [SDET Architect]: Update `specs/test_cases_catalog.md` with tag classifications (`@smoke`, `@regression`, `@chaos`, `@a11y`).
- [x] **US-E2E-203.2** [SDET Architect]: Update `playwright-e2e/README.md` and `BuggyBooks_Test_Documentation.md` with new tag-based commands.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **SDET Code Review** | SDET Architect | Verify test tagging annotations align with `test_cases_catalog.md` and tag filtering operates cleanly. Verified 104 tests across 26 files, with 39 `@smoke`, 104 `@regression`, 18 `@chaos`, 4 `@a11y`. | `[PASSED]` |
| **QA Quality Gate** | Playwright QA Specialist | Execute dynamic glob discovery, smoke tag execution (`--grep "@smoke"`), and timeout override. All verified. | `[PASSED]` |
| **PO Acceptance Gate** | Product Owner | Verify smoke suite execution speed, accuracy, and Sprint 2.1 DoD fulfillment. Verified. | `[PASSED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] Static test array removed from `playwright.config.ts`.
- [x] Dynamic glob discovery discovers all specs matching `src/tests/**/*.spec.ts`.
- [x] All 26 spec files annotated with `@smoke`, `@regression`, `@chaos`, `@a11y` tags.
- [x] `BasePage` timeout refactored to configurable 15s default via `envConfig.timeout`.
- [x] `npx playwright test --grep "@smoke"` executes only smoke-tagged tests.
- [x] TypeScript typecheck passes cleanly with zero errors.
- [x] Changes committed to feature branch `feature/sprint-2-1-playwright-tagging` with conventional commits.
- [x] Handoff verified by Scrum Master for Sprint 2.2 kickoff.

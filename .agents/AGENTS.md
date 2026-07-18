# 🤖 BuggyBooks Agent Development & QA Rules

This document outlines the workflow and rules that all AI assistants must follow when implementing new features, backend modifications, or QA automation in the BuggyBooks codebase.

---

## 🔄 Core Workflow Rules

Every new feature implementation, bugfix, or test automation addition must follow this strict sequence:

1. **Branch Isolation**:
   * NEVER make changes directly on the `main` branch.
   * Always create and check out a descriptive feature branch (e.g., `feature/feature-name` or `bugfix/issue-name`) before modifying code.

2. **Feature Development**:
   * Implement code changes cleanly in their respective backend (`/backend`) or frontend (`/frontend`) directories.
   * Adhere to the existing architecture: use standard Express controllers/data stores for the backend and React/Vite/CSS variables for the frontend.

3. **Unit & Component Testing**:
   * Implement comprehensive unit tests for new backend logic (using **Jest** in `/backend`).
   * Implement component tests for new UI/page views (using **Vitest + React Testing Library + MSW** in `/frontend`).
   * Ensure test coverage is maximized for the newly added functions.

4. **Master Catalog Registration**:
   * Before writing Playwright tests, document the manual/automation test cases in [specs/test_cases_catalog.md](file:///c:/BuggyBooks/buggy-books/specs/test_cases_catalog.md).
   * Specify the correct Target Coverage (e.g. `Playwright UI`, `Playwright API`, `Frontend Component (Vitest)`, or `Backend Unit (Jest)`).

5. **Playwright E2E/API Testing**:
   * Implement End-to-End or API test specs under `playwright-e2e/src/tests/` matching the categorizations in the catalog.
   * Register the test path in `playwright-e2e/src/config/playwright.config.ts` if using specific tests configuration.

6. **State Reset & Test Isolation**:
   * All new Playwright tests must call the `POST /api/test/reset` endpoint in `beforeEach` and/or `afterAll` hooks to ensure clean state and prevent flaky cross-test regressions.

7. **Verification & Clean Run**:
   * Spin up local development servers (`npm run dev`).
   * Execute unit/component tests (`npm test` in `/backend` and `/frontend`).
   * Run Playwright tests using `npx playwright test`.
   * Verify all tests complete with ✅ success.

8. **Review & PR Creation**:
   * Conduct a final review of code diffs for quality, comments, and structure.
   * Commit and push the branch to remote, and prepare a Pull Request for review. Do not merge directly to `main` without PR build validation.

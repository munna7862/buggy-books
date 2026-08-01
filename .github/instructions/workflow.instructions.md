---
description: "Workflow governance: branch policies, Definition of Done, prohibited actions, and GitHub Actions matrix synchronization"
applyTo: "**"
---
# Workflow Governance rules

Always-on process rules for all work in this repository.

## Branch policy
- Never commit directly to `main`.
- Create feature branches per logical task:
  - `feature/<name>` — new tests, page objects, or capabilities
  - `bugfix/<name>` — fixing broken or flaky tests
  - `test/<name>` — test coverage additions
  - `refactor/<area>` — structural cleanup without behavior changes

## Definition of Done
A test automation change is complete ONLY when all apply:
- [ ] UI specs use fixture injection (`../../../core/base/base.fixture`) and `test.step(...)` blocks; API specs use native `test`/`expect` from `@playwright/test`.
- [ ] Zero inline selectors in specs — all locators declared in Page Objects as private getters.
- [ ] Locator hierarchy followed: `getByRole` > `getByLabel`/`getByPlaceholder`/`getByTestId`/`getByText` > CSS > relative XPath (axes only). **Zero absolute XPaths.**
- [ ] Action methods call custom `BasePage` wrappers (`doClick`, `doEnterText`, `doGetText`, etc.) with descriptive log messages.
- [ ] Soft-then-hard assertion pattern used (`commonFunctions.compareTwoValues(...)` + final consolidated hard assertion).
- [ ] Test data JSON exists under `src/test-data/` mirroring the spec path.
- [ ] When adding a new test suite directory under `src/tests/ui/`, update matrix shard definitions in `.github/workflows/playwright-docker.yml` so Docker CI executes it.
- [ ] No TypeScript compilation or lint errors.
- [ ] Targeted spec passes locally in isolation (`--workers=1`).

## Prohibited actions
- Do NOT push directly to `main` or force-push shared branches.
- Do NOT bypass failure hooks or skip tests to force green builds.
- Do NOT hardcode credentials, URLs, or secrets in code or test data files.
- Do NOT leave absolute XPaths (`/html/body/...`) in page objects or spec files.
- Do NOT edit files unrelated to the requested task.

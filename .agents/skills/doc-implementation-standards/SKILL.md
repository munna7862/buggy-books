---
name: doc-implementation-standards
description: Enforces documentation synchronization standards across specs/test_cases_catalog.md, README.md, intentional_bugs.md, and pull request artifacts.
---

# Documentation Implementation Standards

Every completed feature, test addition, or bug fix must keep BuggyBooks documentation perfectly synchronized before a pull request can be merged.

---

### 1. Mandatory Documentation Artifacts

#### A. Test Cases Catalog (`specs/test_cases_catalog.md`)
The single source of truth for all manual and automated testing in BuggyBooks. Whenever an automated spec is added or modified, the catalog MUST be updated with:
- **Test ID**: Unique sequential ID (e.g. `UI-AUTH-001`, `API-CHAOS-002`, `UI-CHECKOUT-005`).
- **Title & Description**: High-level workflow summary and specific assertions tested.
- **Priority & Type**: Automated (Playwright / Vitest / Jest) vs Manual, Severity (P1/P2/P3).
- **Execution Status**: Passed, Flaky, Blocked, or Deprecated.

#### B. Intentional Bugs & Chaos Guide (`intentional_bugs.md`)
If new intentional anti-patterns or chaos scenarios are added for SQE practice:
- Document the endpoint or UI component exhibiting the behavior.
- Document how test automation engineers are expected to handle or configure the behavior (e.g. via `/api/test/config`).

#### C. Environment Variables (`.env.example`)
- Any new environment variable (`BASE_URL`, `API_BASE_URL`, `JWT_SECRET`, etc.) must be added to `.env.example` with clear comments explaining its purpose and safe local defaults.

#### D. Pull Request Summaries (`gh pr create`)
Every pull request must include a structured description:
- **📌 Summary of Changes**: Key architectural and functional additions.
- **🧪 Verification**: Exact test execution output (unit tests, Vitest component tests, Playwright 100% green run report).

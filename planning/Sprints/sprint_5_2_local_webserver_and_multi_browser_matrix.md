# Sprint 5.2: Self-Contained Local WebServer Orchestration & Multi-Browser Matrix

**Sprint Identifier**: `SPRINT-5.2-LOCAL-WEBSERVER-AND-MULTI-BROWSER-MATRIX`  
**Phase Mapping**: Phase 5 (Enterprise Quality Assurance, Ephemeral E2E Gates & Performance Baseline Regression)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Eliminate local developer setup friction, external network/staging coupling, and cross-browser blind spots by implementing native Playwright `webServer` lifecycle orchestration, fallback mock seed credentials in `env.config.ts`, and a comprehensive cross-browser and mobile device emulation matrix (Chromium, WebKit/Safari, Firefox, Pixel 5, iPhone 13).

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog management, burndown velocity tracking, and Definition of Done verification. |
| **SDET Architect** | AI Agent / SDET | Authoring Playwright `webServer` orchestration, configuring multi-browser & mobile device profiles, and building mock seed credential fallback mechanisms in `env.config.ts`. |
| **DevOps Engineer** | AI Agent / DevOps | Integrating multi-browser targets into scheduled/nightly workflows, managing browser binary caching, and configuring target-specific npm scripts. |
| **Product Owner** | Human PO / AI PO | Reviewing cross-browser visual fidelity, mobile touch UX verification, and sprint acceptance sign-off. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-QA-503: Self-Contained Local WebServer Orchestration & Seed Fallbacks
- **Story Statement**:  
  *As an* SDET & Full-Stack Developer,  
  *I want* running `npx playwright test` locally to automatically boot the backend API and frontend preview servers and fall back to local seed credentials if staging secrets are missing,  
  *So that* developers and fork contributors can execute end-to-end tests instantly with zero manual server management or external staging network dependencies.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Configure `webServer` array in `playwright-e2e/playwright.config.ts`:
    - Boot backend server: `command: 'node ../backend/dist/server.js'`, `port: 4000`, `reuseExistingServer: !process.env.CI`.
    - Boot frontend server: `command: 'npx vite preview --port 5173'`, `port: 5173`, `reuseExistingServer: !process.env.CI`.
    - Configure health check timeouts (`timeout: 120 * 1000`) and stdout pipe forwarding.
  - [ ] Enhance `playwright-e2e/config/env.config.ts` with local fallback credentials:
    - Default `E2E_BASE_URL` to `http://127.0.0.1:5173` when `BASE_URL` or `STAGING_URL` is omitted.
    - Default `E2E_API_URL` to `http://127.0.0.1:4000/api` when omitted.
    - Supply fallback seed credentials (`testuser` / `password123` or seeded admin) when environment variables are unset.
  - [ ] Update auth fixtures (`auth.fixture.ts` / page models) to handle local seed user authentication seamlessly.
  - [ ] Add `npm run test:e2e:local` convenience command to root `package.json` and `playwright-e2e/package.json`.
- **Acceptance Criteria**:
  - [ ] Running `npx playwright test` with no external servers running boots both backend and frontend automatically, runs tests, and shuts servers down cleanly.
  - [ ] Running tests without any `.env` file or repository secrets uses seeded mock credentials and passes without authentication errors.

---

### User Story US-QA-504: Multi-Browser & Mobile Viewport Compatibility Matrix
- **Story Statement**:  
  *As a* QA Lead,  
  *I want* the Playwright suite to execute across Desktop Chromium, Firefox, WebKit (Desktop Safari), and mobile viewports (Pixel 5 & iPhone 13),  
  *So that* layout shifts, touch interaction bugs, and browser engine rendering discrepancies are identified before reaching users.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Configure multi-browser and device `projects` in `playwright-e2e/playwright.config.ts`:
    - `chromium`: Desktop Chrome (viewport: 1280x720).
    - `firefox`: Desktop Firefox (viewport: 1280x720).
    - `webkit`: Desktop Safari (viewport: 1280x720).
    - `mobile-chrome`: `devices['Pixel 5']` (touch enabled, mobile user-agent).
    - `mobile-safari`: `devices['iPhone 13']` (WebKit mobile emulation).
  - [ ] Add granular npm execution scripts in `playwright-e2e/package.json`:
    - `npm run test:e2e:chromium`
    - `npm run test:e2e:firefox`
    - `npm run test:e2e:webkit`
    - `npm run test:e2e:mobile`
    - `npm run test:e2e:all`
  - [ ] Update mobile navigation page objects (handling hamburger drawer menus, tap gestures, and mobile viewports).
  - [ ] Update `.github/workflows/playwright-ci.yml` matrix strategy to execute cross-browser and mobile runs on schedule/workflow_dispatch while keeping PR smoke gates fast.
  - [ ] Document test cases `TC-QA-009` (Native WebServer Local Orchestration) and `TC-QA-010` (Cross-Browser & Mobile Matrix) in `specs/test_cases_catalog.md`.
- **Acceptance Criteria**:
  - [ ] All critical user journeys execute and pass cleanly across Chromium, Firefox, WebKit, and mobile emulators.
  - [ ] Mobile navigation and touch gestures operate without viewport clipping or unclickable target errors.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Validated that `webServer` correctly reuses running instances during active development without triggering port conflicts. Confirmed fallback seed credentials match the in-memory/sqlite seed database. | `[PENDING]` |
| **DevOps Code Review** | DevOps Engineer | Verified that WebKit and Firefox browser installations are scoped properly in CI to avoid ballooning cache sizes and execution times on standard PRs. | `[PENDING]` |
| **PO Sprint Review** | Product Owner | Review mobile responsive journeys (Pixel 5 & iPhone 13) and confirm seamless navigation and checkout experience across all target browser engines. Issue sprint acceptance. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] `webServer` configuration active in `playwright.config.ts` supporting backend and frontend lifecycle.
- [ ] Fallback mock seed credentials implemented in `env.config.ts` with zero missing-secret exceptions.
- [ ] Multi-project configuration active with Desktop Chrome, Firefox, WebKit, Pixel 5, and iPhone 13.
- [ ] Mobile responsive navigation interactions validated on mobile viewports.
- [ ] Target-specific npm scripts added to `playwright-e2e/package.json`.
- [ ] Test cases catalog updated with `TC-QA-009` and `TC-QA-010`.
- [ ] Local zero-dependency execution verified from a clean shell without running dev servers.
- [ ] Pull Request opened and merged with conventional commits.

---

## 5. Sprint Verification Plan

```bash
# 1. Verify zero-dependency local run (no pre-existing servers)
cd playwright-e2e
# Should auto-launch backend:4000 and frontend:5173, execute smoke, and tear down
npx playwright test --grep "@smoke" --project=chromium

# 2. Verify cross-browser and mobile execution
npx playwright test --project=firefox --grep "@smoke"
npx playwright test --project=webkit --grep "@smoke"
npx playwright test --project=mobile-chrome --grep "@smoke"
npx playwright test --project=mobile-safari --grep "@smoke"

# 3. Verify execution with empty environment (fallback credentials test)
env -u E2E_USER_EMAIL -u E2E_USER_PASSWORD npx playwright test --grep "@smoke"
```

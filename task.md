# Sprint 5.2: Self-Contained Local WebServer Orchestration & Multi-Browser Matrix

**Sprint Identifier**: `SPRINT-5.2-LOCAL-WEBSERVER-AND-MULTI-BROWSER-MATRIX`  
**Phase**: Phase 5 (Enterprise Quality Assurance, Ephemeral E2E Gates & Performance Baseline Regression)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Eliminate local developer setup friction, external staging coupling, and cross-browser blind spots by implementing native Playwright `webServer` lifecycle orchestration, fallback mock seed credentials in `env.config.ts`, and a comprehensive cross-browser and mobile device emulation matrix (Chromium, WebKit/Safari, Firefox, Pixel 5, iPhone 13).

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Test strategy, documenting `TC-QA-009` and `TC-QA-010` in `specs/test_cases_catalog.md`, designing fallback credential validation and mobile emulation scenarios. |
| **Dev Architect / Senior SDE** | AI Agent / SDE | Playwright `webServer` orchestration, multi-browser project configurations, `env.config.ts` fallback credentials, auth fixture enhancement, mobile drawer navigation, and npm scripts. |
| **Security Officer** | AI Agent / SEC | Auditing fallback credentials for credential leakage prevention and verifying test network boundaries. |
| **Playwright QA Specialist** | AI Agent / QA | Zero-dependency local verification, cross-browser execution (Chromium, Firefox, WebKit), mobile viewport validation (Pixel 5, iPhone 13), 100% green test execution. |
| **Product Owner** | AI Agent / PO | Acceptance review of local developer experience, cross-browser fidelity, mobile touch UX, and release authorization. |
| **DevOps Engineer** | AI Agent / DevOps | Updating `.github/workflows/ci.yml` and `.github/workflows/playwright-ci.yml`, Git sync, PR creation, CI monitoring, and merge closeout. |

---

## 2. Sprint Backlog & Subtask Tracking

### User Story US-QA-503: Self-Contained Local WebServer Orchestration & Seed Fallbacks
*As an SDET & Full-Stack Developer, I want running `npx playwright test` locally to automatically boot the backend API and frontend preview servers and fall back to local seed credentials if staging secrets are missing, so that developers and fork contributors can execute end-to-end tests instantly with zero manual server management or external staging network dependencies.*
- [x] **US-QA-503.1** (`Dev Architect / Senior SDE`): Configure `webServer` array in `playwright-e2e/src/config/playwright.config.ts` (and root `playwright-e2e/playwright.config.ts` alias) to automatically boot backend (`node dist/server.js`, port 4000) and frontend preview (`npx vite preview --port 5173 --host 127.0.0.1`, port 5173) with `reuseExistingServer: !process.env.CI`.
- [x] **US-QA-503.2** (`Dev Architect / Senior SDE`): Configure health check timeouts (`timeout: 120 * 1000`) and stdout/stderr pipe forwarding for both servers.
- [x] **US-QA-503.3** (`Dev Architect / Senior SDE`): Enhance `playwright-e2e/src/config/env.config.ts` with local fallback credentials: default `baseUrl` to `http://127.0.0.1:5173` and `apiBaseUrl` to `http://127.0.0.1:4000` when unset.
- [x] **US-QA-503.4** (`Dev Architect / Senior SDE`): Supply default fallback seed credentials (`admin` / `password123`) in `getLoginCredentials()` and eliminate missing-secret exceptions.
- [x] **US-QA-503.5** (`Dev Architect / Senior SDE`): Add `playwright-e2e/src/core/base/auth.fixture.ts` and update `SignUpPage` to handle seed user authentication seamlessly.
- [x] **US-QA-503.6** (`Dev Architect / Senior SDE`): Add `test:e2e:local` convenience command to root `package.json` and `playwright-e2e/package.json`.
- [x] **US-QA-503.7** (`SDET Architect`): Document test case `TC-QA-009` (Native WebServer Local Orchestration) in `specs/test_cases_catalog.md`.
- [x] **US-QA-503.8** (`Playwright QA Specialist`): Verify zero-dependency local execution from a clean shell without running dev servers.

### User Story US-QA-504: Multi-Browser & Mobile Viewport Compatibility Matrix
*As a QA Lead, I want the Playwright suite to execute across Desktop Chromium, Firefox, WebKit (Desktop Safari), and mobile viewports (Pixel 5 & iPhone 13), so that layout shifts, touch interaction bugs, and browser engine rendering discrepancies are identified before reaching users.*
- [x] **US-QA-504.1** (`Dev Architect / Senior SDE`): Configure multi-browser and device `projects` in `playwright-e2e/src/config/playwright.config.ts`: `chromium`, `firefox`, `webkit`, `mobile-chrome` (`devices['Pixel 5']`), and `mobile-safari` (`devices['iPhone 13']`).
- [x] **US-QA-504.2** (`Dev Architect / Senior SDE`): Add granular npm execution scripts in `playwright-e2e/package.json` (`test:e2e:chromium`, `test:e2e:firefox`, `test:e2e:webkit`, `test:e2e:mobile`, `test:e2e:all`).
- [x] **US-QA-504.3** (`Dev Architect / Senior SDE`): Implement responsive hamburger drawer navigation in `frontend/src/App.tsx` and `frontend/src/styles/_layout.css`.
- [x] **US-QA-504.4** (`Dev Architect / Senior SDE`): Update `CatalogPage` navigation methods to handle mobile drawer menus and touch viewports.
- [x] **US-QA-504.5** (`SDET Architect`): Document test case `TC-QA-010` (Cross-Browser & Mobile Matrix) in `specs/test_cases_catalog.md`.
- [x] **US-QA-504.6** (`DevOps Engineer`): Scope PR smoke gate in `.github/workflows/ci.yml` specifically to `--project=chromium` to keep PR checks fast.
- [x] **US-QA-504.7** (`DevOps Engineer`): Update `.github/workflows/playwright-ci.yml` with multi-browser matrix strategy and browser caching.
- [x] **US-QA-504.8** (`Playwright QA Specialist`): Execute and validate smoke journeys across Chromium, Firefox, WebKit, and mobile emulators.

---

## 3. Sprint Review Comments & Refinement Loop

| Reviewer Role | Target Role | Feedback / Action Item | Status |
| :--- | :--- | :--- | :--- |
| **SDET Quality Gate** | SDET Architect | Verified that `webServer` correctly boots backend and frontend preview servers without port conflicts and automatically releases ports on completion. Confirmed fallback seed credentials match seeded user records (`admin` / `password123`) and operate with zero-env friction. Validated catalog entries `TC-QA-009` and `TC-QA-010`. | `[APPROVED]` |
| **Dev Code Acceptance** | Dev Architect | Audited TypeScript code for strict typing: 0 `any` violations, clean TypeScript compilation across backend and playwright-e2e (`tsc --noEmit`), 80/80 backend unit tests passing, 32/32 frontend component tests passing, and Vite production bundle generated without warnings. | `[APPROVED]` |
| **Security Audit** | Security Officer | Verified fallback credentials are only utilized when environment secrets are omitted, point strictly to local seeded mock data (`admin`), and never log plain credentials or tokens. Test session storage isolation and CSRF protections confirmed functional. | `[APPROVED]` |
| **DevOps Code Review** | DevOps Engineer | Verified PR smoke checks in `.github/workflows/ci.yml` target `--project=chromium` for sub-4-minute PR gating. Confirmed `.github/workflows/playwright-ci.yml` matrix installs target browser engines selectively, and verified workflow YAML syntax via `js-yaml`. | `[APPROVED]` |
| **PO Sprint Review** | Product Owner | Verified that running `npm run test:e2e:local` provides immediate out-of-the-box local execution. Validated responsive drawer on mobile viewports (Pixel 5 & iPhone 13) and verified seamless cross-browser parity across Chromium, Firefox, and WebKit. Accepted all sprint deliverables. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `webServer` configuration active in `playwright.config.ts` supporting backend and frontend lifecycle.
- [x] Fallback mock seed credentials implemented in `env.config.ts` with zero missing-secret exceptions.
- [x] Multi-project configuration active with Desktop Chrome, Firefox, WebKit, Pixel 5, and iPhone 13.
- [x] Mobile responsive navigation interactions validated on mobile viewports.
- [x] Target-specific npm scripts added to `playwright-e2e/package.json` and root `package.json`.
- [x] Test cases catalog updated with `TC-QA-009` and `TC-QA-010`.
- [x] Local zero-dependency execution verified from a clean shell without running dev servers.
- [x] Cross-browser and mobile smoke journeys pass 100% across all engines.
- [x] Pull Request opened and merged with conventional commits after CI green check.

# BuggyBooks

[![CI](https://github.com/munna7862/buggy-books/actions/workflows/ci.yml/badge.svg)](https://github.com/munna7862/buggy-books/actions/workflows/ci.yml)
[![Publish Container Images to GHCR](https://github.com/munna7862/buggy-books/actions/workflows/publish-images.yml/badge.svg)](https://github.com/munna7862/buggy-books/actions/workflows/publish-images.yml)
[![Codacy Security Scan](https://github.com/munna7862/buggy-books/actions/workflows/codacy.yml/badge.svg)](https://github.com/munna7862/buggy-books/actions/workflows/codacy.yml)

BuggyBooks is a small online bookshop built on purpose for practising test automation. It has a web frontend, a REST + WebSocket API and an Expo mobile app, and it ships with intentional defects and chaos switches (random checkout failures, slow endpoints, dropped sockets, expiring tokens, obfuscated locators, Shadow DOM) that a test suite has to handle.

The main test suites that target it live in [automation-frameworks](https://github.com/munna7862/automation-frameworks).

## Live links

| What | URL |
| --- | --- |
| Frontend | https://buggy-books-fe.onrender.com |
| API | https://buggy-books.onrender.com/api (for example `/api/books`, `/api/health`) |
| Playwright report (GitHub Pages) | https://munna7862.github.io/buggy-books/AutomationReports/CI/ |
| Container images | `ghcr.io/munna7862/buggy-books-backend`, `ghcr.io/munna7862/buggy-books-frontend` |

Both Render services are on the free tier and sleep after about 15 minutes idle. The first request after that can take 30-60 seconds, and the data resets when the service restarts.

## Status

Version `1.0.0`. Phases 1-11 of the roadmap are delivered (36 sprints). Phase 12, mobile automation, is in progress: Sprints 12.1 (mobile anti-patterns) and 12.2 (Maestro and Appium suites) are merged; Sprint 12.3 (mobile CI pipeline and build artifacts) is next. The latest change publishes the backend and frontend images to GHCR.

The roadmap is in [planning/Master/master_plan.md](planning/Master/master_plan.md) and [planning/Master/mobile_app_master_plan.md](planning/Master/mobile_app_master_plan.md). Some phase files under `planning/Phases/` still show "Planned" in their header although their sprints have merged.

## Tech stack

| Part | Stack |
| --- | --- |
| Backend (`backend/`) | Node.js, TypeScript, Express 4, Socket.IO, JWT access and refresh tokens in httpOnly cookies (plus Bearer tokens for mobile), bcrypt, Zod, Helmet, CORS, `express-rate-limit`, `csrf-csrf`, Jest + Supertest |
| Frontend (`frontend/`) | React 19, TypeScript, Vite 8, React Router 7, `socket.io-client`, Vitest + Testing Library |
| Mobile (`mobile/`) | Expo 52, React Native 0.76, Jest (`jest-expo`) |
| Shared (`shared/`) | `@buggybooks/types`, shared TypeScript types such as the chaos config |
| Tests in this repo | Playwright (`playwright-e2e/`), k6 (`performance/`), Appium + WebdriverIO and Maestro (`mobile-automation/`), Lighthouse CI |
| Delivery | GitHub Actions, Docker Compose, GHCR, Render |

## Run it locally

Requirements: Node.js 20 or later and npm. Docker is optional.

```bash
git clone https://github.com/munna7862/buggy-books.git
cd buggy-books
npm install                 # all workspaces
cp .env.example .env        # set JWT_SECRET
npm run dev                 # backend on http://localhost:4000, frontend on http://localhost:5173
```

Or build and run both in Docker with `docker compose up --build` (backend on 4000, frontend on 5173). Prebuilt images are on GHCR (see Live links). The mobile app starts with `npm run dev:mobile` (Expo).

Seeded accounts:

| Username | Password |
| --- | --- |
| `admin` | `password123` |
| `testuser` | `buggybooks` |

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Backend and frontend with hot reload |
| `npm run build` | Production builds of backend and frontend |
| `npm run typecheck` | Type checks for backend, frontend, Playwright, mobile and mobile automation |
| `npm run lint` | ESLint across all workspaces |
| `npm run test:unit` | Backend Jest and frontend Vitest |
| `npm run test:mobile:unit` | Mobile app Jest tests |
| `npm run test:e2e` | Playwright suite (`npm run test:api` for API only) |
| `npm run test:perf:smoke` | k6 smoke; also `test:perf`, `:stress`, `:journey`, `:auth`, `:checkout`, `:soak`, `:breakpoint` |
| `npm run test:lhci` | Lighthouse CI audit |
| `npm run test:mobile:appium:android` / `:ios` | Appium mobile tests |

## API

All routes are under `/api`. Session auth uses an httpOnly `token` cookie; mobile clients can send `Authorization: Bearer <token>`. State-changing browser requests need the `x-csrf-token` header from `GET /api/csrf-token` (auth and `/api/test/*` routes are exempt).

| Area | Routes |
| --- | --- |
| Auth | `POST /login`, `POST /register`, `POST /logout`, `POST /auth/refresh` |
| Books | `GET /books` (search and paging), `GET /books/:id`, `GET /inventory/report` (slow on purpose when chaos is on) |
| Cart | `GET /cart`, `POST /cart`, `DELETE /cart/:bookId`, `DELETE /cart` |
| Checkout and orders | `POST /checkout/process`, `GET /orders` |
| Profile | `GET /profile`, `POST /profile/upload` (avatar) |
| Ops | `GET /health`, `GET /metrics`, `GET /csrf-token` |
| Test control | `GET /test/config`, `POST /test/config`, `POST /test/reset`, `POST /test/books/:id/stock`, `DELETE /test/session/:id` |

A WebSocket server (Socket.IO) runs on the same port as the API.

## Chaos switches

`POST /api/test/config` changes these at runtime. `POST /api/test/reset` restores the defaults and clears carts and orders. The settings are global to the server, so reset them after each test.

| Setting | Default | Effect |
| --- | --- | --- |
| `checkoutFailureRate` | `0` | Probability (0-1) that checkout returns 500 |
| `inventoryDelayMs` | `0` | Delay added to `/api/inventory/report` |
| `jwtExpirySeconds` | `900` | Access-token lifetime |
| `websocketDropRate` | `0` | Probability of dropping a WebSocket connection |
| `uploadFailureRate` | `0` | Probability that an avatar upload fails |
| `injectA11yViolations` | `false` | Adds accessibility violations to the UI |
| `visualChaos` | `false` | Shifts styles to break visual baselines |
| `inventoryLockingRate` | `0` | Probability of an optimistic-locking conflict on stock |

Always-on hurdles: obfuscated form field names (for example `txt_usr_77`), a delayed add-to-cart, Shadow DOM components, and a rate limiter (600 requests per IP per minute; tests can send `x-bypass-rate-limit: true`). The mobile app adds its own set (MOB-B1 to MOB-B6: dynamic locators, keyboard occlusion, async delays, gateway timeouts, offline banner, orientation shift). Full details: [intentional_bugs.md](intentional_bugs.md).

## Tests and CI

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | push, pull request | Backend Jest and frontend Vitest with coverage, Playwright typing and POM lint, builds, Lighthouse CI, k6 benchmarks (smoke on PRs, full on `main`), Playwright smoke against the built app |
| `playwright-ci.yml` | after CI, schedule, manual | Full Playwright run; publishes the report to GitHub Pages |
| `playwright-docker.yml`, `playwright-on-demand.yml` | manual | Playwright in Docker, or against a chosen environment and tag |
| `perf-endurance.yml` | schedule, manual | k6 soak and breakpoint tests |
| `perf-baseline-recalibrate.yml` | manual | Recalculates k6 baselines |
| `quarantine-audit.yml` | schedule, manual | Repeats quarantined tests to check stability |
| `publish-images.yml` | push to `main`, manual | Builds and pushes the backend and frontend images to GHCR |
| `codacy.yml` | push, pull request, schedule | Codacy security scan |

The Playwright test cases are listed in [specs/test_cases_catalog.md](specs/test_cases_catalog.md).

## Project structure

```
backend/            Express API: controllers, services, repositories, middleware, chaos store, Jest tests
frontend/           React app: catalog, book detail, cart, checkout, profile, login, register, chaos dashboard
mobile/             Expo React Native app
mobile-automation/  Appium + WebdriverIO screen objects and specs, Maestro flows
playwright-e2e/     Playwright UI and API tests
performance/        k6 scenarios, baselines and reporting scripts
shared/             shared TypeScript types
specs/              test case catalogue
planning/           master plans, phases, sprints
docker-compose.yml  backend and frontend containers
```

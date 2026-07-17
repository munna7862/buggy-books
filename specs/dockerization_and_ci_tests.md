# 📝 Test Spec: Dockerization, CI Pipeline & API Mocking

This document outlines the test cases and operational rationale for **Area 10** of the improvement plan.

---

## 💡 Rationale: Why This Area Was Added

1. **Reproducible Environments**: Docker removes "works on my machine" problems. SDETs need to be able to spin up the complete application stack with a single command to run their automation suites in a consistent environment.
2. **Continuous Integration**: GitHub Actions automatically runs the Jest and Vitest test suites on every push and PR to `main`. This ensures regressions are caught before merges and teaches SDETs to integrate their automation into a CI/CD pipeline.
3. **API Mocking (MSW)**: Mock Service Worker (MSW) allows frontend component tests to be written without a running backend. SDETs learn to isolate frontend behaviors (loading states, error handling, retry logic) without depending on real API availability.

---

## 📋 Catalog of Automation Test Cases

| ID | Title | Area / Description | Priority |
|:---|:---|:---|:---|
| **DOCKER_01** | Full Stack Boot | Run `docker-compose up --build`. Assert both `buggy-books-backend` and `buggy-books-frontend` containers are running and healthy. | Smoke |
| **DOCKER_02** | Backend Health Check | With containers running, `GET http://localhost:4000/api/books`. Assert `200 OK` and JSON array in body. | Smoke |
| **DOCKER_03** | Frontend Reachable | `GET http://localhost:5173`. Assert `200 OK` and HTML response contains `BuggyBooks`. | Smoke |
| **DOCKER_04** | JWT_SECRET Required | Start backend container without `JWT_SECRET` env var. Assert container exits with a fatal error log. | Regression |
| **DOCKER_05** | Graceful Restart | Run `docker-compose restart backend`. Assert backend recovers and responds to health checks within 15 seconds. | Regression |
| **CI_01** | CI Pipeline Triggers on Push | Push a commit to `feature/**`. Assert GitHub Actions workflow `CI` runs automatically. | Smoke |
| **CI_02** | Backend Tests Pass in CI | Assert `Backend Tests (Jest)` job completes with ✅ and all tests pass. | Smoke |
| **CI_03** | Frontend Tests Pass in CI | Assert `Frontend Tests (Vitest)` job completes with ✅ and all tests pass. | Smoke |
| **CI_04** | CI Fails on Broken Test | Intentionally break a test. Push to branch. Assert the CI workflow fails and marks the PR as blocked. | Regression |
| **CI_05** | TypeScript Build Verified in CI | Assert `Backend TypeScript Build` job produces no compilation errors. | Regression |
| **MSW_01** | Mock Books Endpoint | In a Vitest component test, import `server` from `src/mocks/server.ts`. Assert `GET /api/books` returns the 3 mock books without a real backend. | Smoke |
| **MSW_02** | Mock Login Success | POST to `/api/login` with `testuser/password123`. Assert mock returns `200` with username. | Smoke |
| **MSW_03** | Override Handler Per Test | Override `GET /api/books` to return an empty array in a specific test. Assert the Catalog renders the "No books found" empty state. | Regression |
| **MSW_04** | Override Checkout to Always Fail | Override `POST /api/checkout/process` to return 500. Assert the Checkout component shows the error banner. | Regression |

---

## 🐳 Docker Usage

```bash
# Build and start all services
docker-compose up --build

# Run in detached (background) mode
docker-compose up --build -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Full reset (including volumes)
docker-compose down -v
```

---

## 🧪 MSW Component Test Setup

Add MSW to your Vitest setup file (`src/setupTests.ts`):

```typescript
import { server } from "./mocks/server";
import { beforeAll, afterEach, afterAll } from "vitest";

// Start the mock server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers after each test (removes per-test overrides)
afterEach(() => server.resetHandlers());

// Shut down the mock server after all tests complete
afterAll(() => server.close());
```

Then in your test file:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import Catalog from "../pages/Catalog";

test("MSW_03 — renders empty state when no books returned", async () => {
  // Override the books endpoint just for this test
  server.use(
    http.get("http://localhost:4000/api/books", () => {
      return HttpResponse.json({ books: [], total: 0, page: 1, totalPages: 1 });
    })
  );

  render(<Catalog />);

  await waitFor(() => {
    expect(screen.getByText(/No books found/i)).toBeInTheDocument();
  });
});

test("MSW_04 — shows error banner when checkout fails", async () => {
  server.use(
    http.post("http://localhost:4000/api/checkout/process", () => {
      return HttpResponse.json({ error: "Server Error" }, { status: 500 });
    })
  );
  // ... render Checkout and assert error banner is visible
});
```

---

## 🔄 CI Pipeline Summary

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs three jobs:

| Job | Trigger | What it does |
|:---|:---|:---|
| `Backend Tests (Jest)` | push / PR to main | Runs `npm test` in `/backend` with `JWT_SECRET` set |
| `Frontend Tests (Vitest)` | push / PR to main | Runs `npm test` in `/frontend` |
| `Backend TypeScript Build` | after Backend Tests pass | Runs `npm run build` to verify TypeScript compiles cleanly |

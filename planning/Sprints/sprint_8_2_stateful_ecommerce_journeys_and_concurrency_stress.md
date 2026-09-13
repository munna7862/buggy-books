# Sprint 8.2: Stateful E-Commerce Journeys, Auth Bursts & Checkout Concurrency

**Sprint Identifier**: `SPRINT-8.2-STATEFUL-ECOMMERCE-JOURNEYS-AND-CONCURRENCY-STRESS`  
**Phase Mapping**: [Phase 8: Advanced Performance Engineering, Interactive Visual Reporting & Runtime Observability](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_8_performance_engineering_visual_reporting_and_runtime_observability.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Expand performance test coverage from 100% read-only GET queries to realistic, stateful e-commerce user journeys, benchmark authentication CPU saturation under bcrypt verification bursts, and validate inventory transaction contention during concurrent checkouts.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog prioritization, velocity tracking, blocker removal, and DoD signoff. |
| **Backend Architect** | AI Agent / Dev Architect | Advising on database transaction isolation, bcrypt cost factor benchmarks, and checkout locking mechanisms. |
| **SDET Architect** | AI Agent / SDET | Designing k6 weighted user journey scenarios (`ramping-arrival-rate`), session isolation, and concurrency safety. |
| **QA Performance Specialist** | AI Agent / Perf QA | Authoring journey, auth, and checkout k6 scripts, establishing golden baselines, and profiling bottleneck thresholds. |
| **Product Owner** | Human PO / AI PO | Validating realistic e-commerce user distribution percentages and SLA requirements. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-PERF-804: End-to-End Realistic E-Commerce User Journey Workload
- **Story Statement**:  
  *As a* Performance QA Specialist,  
  *I want* a composite user journey scenario simulating real-world e-commerce browsing and buying patterns,  
  *So that* we can measure system behavior under realistic multi-endpoint workloads rather than synthetic isolated GET requests.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Author `performance/scenarios/ecommerce-journey.js` using k6 multi-scenario execution or probabilistic action branching:
    - **60% Browsers**: `GET /api/books` and keyword search `GET /api/books?q=...`.
    - **20% Product Inspectors**: `GET /api/books/:id` detail views.
    - **10% Shoppers**: Authenticate, `GET /api/cart`, `POST /api/cart` (add book to cart).
    - **5% Buyers**: Complete flow through `POST /api/checkout/process` and `GET /api/orders`.
    - **5% Profile/Account Managers**: `GET /api/profile`.
  - [ ] Implement realistic user think times via random sleep jitter (`sleep(0.5 + Math.random() * 1.5)`).
  - [ ] Capture granular Trend metrics: `journey_browse_duration`, `journey_search_duration`, `journey_cart_duration`, `journey_checkout_duration`.
  - [ ] Establish golden baseline `performance/baselines/baseline-journey.json`.
  - [ ] Add `npm run test:perf:journey` to `performance/package.json`.
- **Acceptance Criteria**:
  - [ ] `ecommerce-journey.js` executes 50 concurrent VUs over 2 minutes without unhandled exceptions or session cross-talk.
  - [ ] Metrics for browsing, searching, cart mutation, and checkout are reported as distinct Trend percentiles in the HTML report.

---

### User Story US-PERF-805: Authentication Burst & Password Hashing Saturation Benchmark
- **Story Statement**:  
  *As a* Backend Architect,  
  *I want* a dedicated authentication load test targeting `POST /api/login` and `POST /api/auth/refresh`,  
  *So that* we can profile Node.js event loop saturation and CPU spikes caused by synchronous/asynchronous `bcrypt` password verification under traffic surges.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [ ] Author `performance/k6/auth-stress.js`:
    - Ramps from 0 to 40 concurrent authentication requests/sec.
    - Executes `POST /api/login` with valid seeded credentials.
    - Captures `auth_login_duration`, `auth_token_refresh_duration`, and CPU saturation thresholds.
  - [ ] Enforce SLA threshold: `auth_login_duration: ['p(95)<350', 'p(99)<700']` under 40 RPS.
  - [ ] Author golden baseline `performance/baselines/baseline-auth.json`.
  - [ ] Add `npm run test:perf:auth` to `performance/package.json`.
- **Acceptance Criteria**:
  - [ ] Benchmark highlights maximum sustainable login throughput before bcrypt threadpool starvation degrades latency beyond 500ms.
  - [ ] Baseline comparison verifies login performance regression gates.

---

### User Story US-PERF-806: High-Concurrency Checkout Contention & Stock Race Condition Load Test
- **Story Statement**:  
  *As an* SDET Architect,  
  *I want* a stress test targeting concurrent `POST /api/checkout/process` invocations on limited inventory,  
  *So that* we can expose race conditions, overselling defects, database deadlocks, or 500 errors under flash-sale conditions.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [ ] Author `performance/k6/checkout-stress.js`:
    - Seeds a book with fixed inventory (e.g. 50 units) in `setup()`.
    - Spawns 100 concurrent VUs attempting to purchase the same inventory item simultaneously.
    - Validates that successful checkouts match exactly the available stock (zero overselling).
    - Checks that remaining requests fail gracefully with HTTP 400 (`"Insufficient stock"`) rather than HTTP 500 crashes.
  - [ ] Measure transactional duration (`checkout_duration`) and lock contention times.
  - [ ] Establish golden baseline `performance/baselines/baseline-checkout.json`.
  - [ ] Add `npm run test:perf:checkout` to `performance/package.json`.
- **Acceptance Criteria**:
  - [ ] Concurrent checkout test cleanly differentiates between HTTP 200 (successful purchase) and HTTP 400 (stock exhausted), asserting that exactly 0 overselling occurred.
  - [ ] Transaction lock contention is profiled and documented in the performance HTML dashboard.

---

## 3. Definition of Done & Quality Gates

- [ ] All 3 new test scripts (`ecommerce-journey.js`, `auth-stress.js`, `checkout-stress.js`) execute reliably via `node performance/run-k6.js`.
- [ ] Golden baselines (`baseline-journey.json`, `baseline-auth.json`, `baseline-checkout.json`) are committed to `performance/baselines/`.
- [ ] New npm scripts (`test:perf:journey`, `test:perf:auth`, `test:perf:checkout`) pass in both local environments and containerized runners.
- [ ] Concurrency tests verify strict zero-overselling integrity on inventory checkouts.
- [ ] Generated HTML dashboard visualizes stateful operation latencies side-by-side with read-only endpoints.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[PLANNED]`
- **Committed Story Points**: 5 SP
- **Primary Deliverables**:
  1. `ecommerce-journey.js` multi-scenario user journey test.
  2. `auth-stress.js` authentication CPU saturation benchmark.
  3. `checkout-stress.js` concurrent stock contention and race condition test.
  4. Golden baselines for journey, auth, and checkout tiers.
  5. Updated `package.json` performance test scripts.

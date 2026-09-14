# Sprint 9.2: Backend Atomic Persistence, Concurrency Mutex & Security Hardening

**Sprint Identifier**: `SPRINT-9.2-BACKEND-ATOMIC-PERSISTENCE-CONCURRENCY-MUTEX-AND-SECURITY-HARDENING`  
**Phase Mapping**: [Phase 9: Full-Stack Quality Hardening, Monorepo Workspaces & System Resilience](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_9_full_stack_quality_hardening_monorepo_workspaces_and_system_resilience.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Implement an atomic, Windows-safe file persistence engine with a mutex-backed sequential write queue in `storage.ts`, patch the multi-tenant CORS wildcard vulnerability in `app.ts`, unref background intervals in `server.ts`, and bound session store capacity.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Backlog Grooming, Sprint Goal alignment, DoD verification, and velocity burndown tracking. |
| **Backend Specialist** | AI Agent / Backend | Refactoring [storage.ts](file:///c:/BuggyBooks/buggy-books/backend/src/data/storage.ts) with safe atomic file writes, mutex write queue, and unrefing simulation timers in [server.ts](file:///c:/BuggyBooks/buggy-books/backend/src/server.ts). |
| **Security Champion** | AI Agent / SecOps | Reviewing CORS origins in [app.ts](file:///c:/BuggyBooks/buggy-books/backend/src/app.ts), writing regression security tests, and verifying origin validation. |
| **QA Automation Specialist** | AI Agent / QA | Writing high-concurrency write stress tests to assert zero dropped updates or `EPERM`/`EBUSY` file lock crashes. |
| **Product Owner** | Human PO / AI PO | Validating data consistency guarantees and security boundary compliance. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-BE-921: Windows-Safe Atomic File Persistence & Mutex Write Queue
- **Story Statement**:  
  *As a* Backend Engineer,  
  *I want* database file writes in `storage.ts` to be strictly serialized via a FIFO write queue with atomic file-replacement fallbacks,  
  *So that* high-concurrency writes never cause `EPERM` or `EBUSY` file lock exceptions on Windows and intermediate data changes are never dropped.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] Investigate `fs.promises.rename` failures on Windows in [storage.ts](file:///c:/BuggyBooks/buggy-books/backend/src/data/storage.ts#L220).
  - [x] Implement an atomic write strategy:
    - Write to temporary file `${DB_PATH}.${Date.now()}.${Math.random().toString(36).substr(2, 5)}.tmp`.
    - Attempt atomic `fs.promises.rename`.
    - If `rename` fails with `EPERM`, `EBUSY`, or `EEXIST` (standard on Windows when target file is open or locked), fall back to `fs.promises.copyFile` followed by asynchronous `fs.promises.unlink` of the temp file.
    - Add retry with exponential backoff (up to 3 retries with 50ms jitter) before throwing an error.
  - [x] Replace single-slot `pendingWrite` in `Storage` class with a sequential promise-chained write queue (or mutex queue) to ensure all mutations flush in strict order.
  - [x] Ensure [storage.test.ts](file:///c:/BuggyBooks/buggy-books/backend/src/__tests__/storage.test.ts) exercises 50 rapid sequential and concurrent writes.
- **Acceptance Criteria**:
  - [x] Executing 50 concurrent writes in [storage.test.ts](file:///c:/BuggyBooks/buggy-books/backend/src/__tests__/storage.test.ts) produces zero `EPERM`, `EBUSY`, or file corruption errors.
  - [x] Final persisted `db.json` contains the exact state of the latest completed write.

---

### User Story US-SEC-922: Multi-Tenant CORS Regex Wildcard Hardening
- **Story Statement**:  
  *As a* Security Architect,  
  *I want* the backend CORS middleware in `app.ts` to reject unauthorized subdomains on multi-tenant cloud hosting providers,  
  *So that* third-party apps deployed on `onrender.com` cannot execute credentialed cross-origin requests against BuggyBooks users.
- **Story Points**: 1 SP (Low)
- **Technical Subtasks**:
  - [x] Inspect [app.ts lines 80-92](file:///c:/BuggyBooks/buggy-books/backend/src/app.ts#L80-L92):
    ```typescript
    // VULNERABLE: matches any arbitrary app on onrender.com
    /^([a-z0-9-]+\.)*onrender\.com$/.test(hostname);
    ```
  - [x] Replace the wildcard regex with an explicit origin check:
    - Allow exact verified origins: `https://buggy-books-fe.onrender.com`.
    - Allow local development origins: `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`.
    - Allow additional origins via configurable environment variable `ALLOWED_ORIGINS` (comma-separated).
    - Disallow all generic wildcard subdomains.
  - [x] Add unit test in `backend/src/__tests__/api.test.ts` verifying that requests with `Origin: https://malicious-app.onrender.com` are rejected by CORS.
- **Acceptance Criteria**:
  - [x] Requests from `https://buggy-books-fe.onrender.com` pass CORS with `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`.
  - [x] Requests from arbitrary origins like `https://attacker.onrender.com` fail CORS validation.

---

### User Story US-BE-923: Server Lifecycle Hygiene & Session Map Eviction Bounds
- **Story Statement**:  
  *As a* QA Automation Engineer / Developer,  
  *I want* background simulation timers unreferenced and session storage memory bounded,  
  *So that* Jest test workers terminate cleanly without hanging open handles and high-VU performance tests do not exhaust server memory.
- **Story Points**: 2 SP (Medium)
- **Technical Subtasks**:
  - [x] In [server.ts](file:///c:/BuggyBooks/buggy-books/backend/src/server.ts#L69-L88), capture the `setInterval` handle:
    ```typescript
    const eventInterval = setInterval(() => { ... }, 8000);
    if (eventInterval.unref) {
      eventInterval.unref();
    }
    ```
  - [x] Ensure that when `NODE_ENV === 'test'`, the simulation interval is disabled completely or mockable.
  - [x] In `SessionStorageManager` in [storage.ts](file:///c:/BuggyBooks/buggy-books/backend/src/data/storage.ts):
    - Introduce a `MAX_SESSIONS` limit (e.g. 1,000 sessions).
    - When `sessions.size >= MAX_SESSIONS`, automatically evict the least-recently-accessed session (LRU order) to maintain an upper bound on heap usage.
- **Acceptance Criteria**:
  - [x] Importing `server.ts` or running Jest suites does not leave unref-ed timers keeping the Node process alive.
  - [x] Continuous generation of 2,000 test sessions does not cause memory leaks beyond the configured capacity ceiling.

---

## 3. Definition of Done & Quality Gates

- [x] `performWrite` in `storage.ts` passes atomic persistence unit tests on both Windows and Linux without `EPERM` errors.
- [x] Mutex queue ensures all sequential state updates are written to disk without dropped frames.
- [x] CORS rejects arbitrary `onrender.com` subdomains, proven by automated security regression tests.
- [x] `server.ts` unrefs background intervals, yielding zero open handle warnings in Jest.
- [x] All 12 backend test suites (91 tests) pass cleanly.

---

## 4. Sprint Velocity & Deliverables Summary

- **Sprint Status**: `[COMPLETED]`
- **Committed Story Points**: 5 SP
- **Delivered Story Points**: 5 SP
- **Primary Deliverables**:
  1. Atomic file-write engine with Windows copy-fallback in `storage.ts`.
  2. Sequential write queue in `storage.ts`.
  3. Strict CORS origin whitelist in `app.ts`.
  4. Timer unref and LRU session eviction in `server.ts` and `storage.ts`.

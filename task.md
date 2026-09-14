# Sprint 9.2: Backend Atomic Persistence, Concurrency Mutex & Security Hardening

**Sprint Identifier**: `SPRINT-9.2-BACKEND-ATOMIC-PERSISTENCE-CONCURRENCY-MUTEX-AND-SECURITY-HARDENING`  
**Phase**: [Phase 9: Full-Stack Quality Hardening, Monorepo Workspaces & System Resilience](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_9_full_stack_quality_hardening_monorepo_workspaces_and_system_resilience.md)  
**Assigned Scrum Master**: AI Agent / Scrum Master  
**Sprint Goal**: Implement an atomic, Windows-safe file persistence engine with a mutex-backed sequential write queue in `storage.ts`, patch the multi-tenant CORS wildcard vulnerability in `app.ts`, unref background intervals in `server.ts`, and bound session store capacity with LRU eviction.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint backlog initialization, live burndown tracking in `task.md`, review facilitation, and DoD audit. |
| **SDET Architect** | AI Agent / SDET | Test case cataloging (`TC-PERSIST-001`, `TC-SEC-002`, `TC-RESIL-001` in `specs/test_cases_catalog.md`), designing concurrency stress tests and security regression tests. |
| **Backend Specialist** | AI Agent / Backend | Implementing Windows-safe atomic file writing with copyFile fallback, sequential FIFO write queue, and LRU bounded session storage in `storage.ts`; unrefing simulation timers in `server.ts`. |
| **Security Champion** | AI Agent / SecOps | Eliminating permissive wildcard CORS regex in `app.ts`, establishing strict origin whitelisting, and validating cross-origin request isolation. |
| **QA Automation Specialist** | AI Agent / QA | Executing 50 concurrent writes stress tests, memory limit validations, and Jest process lifecycle verification. |
| **Product Owner** | Human PO / AI PO | Validating data consistency guarantees, security boundary compliance, and final Sprint acceptance. |

---

## 2. Sprint Backlog & Granular Subtask Tracking

### User Story US-BE-921: Windows-Safe Atomic File Persistence & Mutex Write Queue
*As a Backend Engineer, I want database file writes in `storage.ts` to be strictly serialized via a FIFO write queue with atomic file-replacement fallbacks, so that high-concurrency writes never cause `EPERM` or `EBUSY` file lock exceptions on Windows and intermediate data changes are never dropped.*
- [x] **US-BE-921.1** (`SDET Architect`): Document `TC-PERSIST-001` (Windows-Safe Atomic File Persistence & Concurrency Mutex Queue) in `specs/test_cases_catalog.md`.
- [x] **US-BE-921.2** (`Backend Specialist`): Implement atomic write strategy in `storage.ts` with randomized temp files (`${DB_PATH}.${Date.now()}.${rand}.tmp`), `rename` with fallback to `copyFile` + `unlink` on Windows file lock codes (`EPERM`, `EBUSY`, `EEXIST`, `EACCES`), and exponential backoff retry with jitter.
- [x] **US-BE-921.3** (`Backend Specialist`): Implement serialized FIFO write queue in `Storage` class to prevent dropped writes and ensure `flush()` awaits complete disk persistence.
- [x] **US-BE-921.4** (`QA Automation Specialist`): Add 50-write rapid concurrent stress test in `backend/src/__tests__/storage.test.ts` asserting zero lock exceptions and exact state persistence.

### User Story US-SEC-922: Multi-Tenant CORS Regex Wildcard Hardening
*As a Security Architect, I want the backend CORS middleware in `app.ts` to reject unauthorized subdomains on multi-tenant cloud hosting providers, so that third-party apps deployed on `onrender.com` cannot execute credentialed cross-origin requests against BuggyBooks users.*
- [x] **US-SEC-922.1** (`SDET Architect`): Document `TC-SEC-002` (Multi-Tenant CORS Origin Hardening & Hostname Restriction) in `specs/test_cases_catalog.md`.
- [x] **US-SEC-922.2** (`Security Champion`): Replace permissive wildcard regex `/^([a-z0-9-]+\.)*onrender\.com$/` in `app.ts` with strict whitelist (`https://buggy-books-fe.onrender.com`, `localhost`, `127.0.0.1`, and configurable `ALLOWED_ORIGINS`).
- [x] **US-SEC-922.3** (`Security Champion`): Support comma-separated `ALLOWED_ORIGINS` environment variable in `backend/src/config.ts`.
- [x] **US-SEC-922.4** (`QA Automation Specialist`): Add security regression tests in `backend/src/__tests__/api.test.ts` verifying authorized origins pass with credentials while arbitrary subdomains (`https://attacker.onrender.com`) are blocked.

### User Story US-BE-923: Server Lifecycle Hygiene & Session Map Eviction Bounds
*As a QA Automation Engineer / Developer, I want background simulation timers unreferenced and session storage memory bounded, so that Jest test workers terminate cleanly without hanging open handles and high-VU performance tests do not exhaust server memory.*
- [x] **US-BE-923.1** (`SDET Architect`): Document `TC-RESIL-001` (Server Lifecycle Timer Unreferencing & LRU Session Storage Bounds) in `specs/test_cases_catalog.md`.
- [x] **US-BE-923.2** (`Backend Specialist`): Unreference simulation interval in `backend/src/server.ts` (`.unref()`) and skip timer startup in `test` environment (`NODE_ENV === 'test'`).
- [x] **US-BE-923.3** (`Backend Specialist`): Implement LRU capacity eviction in `SessionStorageManager` (`MAX_SESSIONS = 1000`) in `storage.ts`.
- [x] **US-BE-923.4** (`QA Automation Specialist`): Add LRU session boundary test in `backend/src/__tests__/storage.test.ts` verifying oldest sessions are evicted when exceeding capacity ceiling.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Architecture Gate** | SDET Architect | Verified `specs/test_cases_catalog.md` updated with `TC-PERSIST-001`, `TC-SEC-002`, and `TC-RESIL-001`. Test coverage strategy reviewed and signed off. | `[APPROVED]` |
| **Dev Technical Review** | Backend Specialist | Safe atomic file writing implemented with randomized temp files, `rename` with `copyFile` fallback on Windows lock errors, and exponential backoff retry. FIFO queue serialization implemented, ensuring disk state stays synchronized with in-memory store. Simulation intervals unrefed and disabled during test runs. | `[APPROVED]` |
| **Security Audit Gate** | Security Champion | Permissive `onrender.com` wildcard regex in `app.ts` removed. Strict origin whitelist enforces exact match on `https://buggy-books-fe.onrender.com`, `localhost`, and `ALLOWED_ORIGINS`. Unauthorized origins rejected with 403 Forbidden without credential exposure. | `[APPROVED]` |
| **QA Verification Gate** | QA Specialist | Concurrency stress test executed 50 rapid concurrent writes with 0 errors. LRU session eviction tested and verified. 12/12 backend test suites passed (91 tests total). Frontend tests passed (10 files, 32 tests). `npm run typecheck` and `npm run lint` passed with 0 errors. | `[APPROVED]` |
| **PO Acceptance Sign-off** | Product Owner | All acceptance criteria met. Windows persistence resilience validated under load. Multi-tenant CORS exploit eliminated. System resource bounds preserved. Ready for PR and merge into main. | `[APPROVED]` |

---

## 4. Definition of Done (DoD) Checklist

- [x] `specs/test_cases_catalog.md` updated with `TC-PERSIST-001`, `TC-SEC-002`, and `TC-RESIL-001`.
- [x] `performWrite` in `storage.ts` implements atomic file write with `copyFile` fallback and retry backoff.
- [x] Serialized write queue in `storage.ts` prevents dropped writes and reliably flushes all updates.
- [x] CORS rejects arbitrary `onrender.com` subdomains, proven by automated security regression tests in `api.test.ts`.
- [x] `config.ts` supports `ALLOWED_ORIGINS` environment variable.
- [x] `server.ts` unrefs background intervals and disables background simulation in test mode.
- [x] `SessionStorageManager` bounds memory with LRU eviction at `MAX_SESSIONS`.
- [x] `npm run typecheck` passes with 0 errors across all workspaces.
- [x] `npm run lint` passes with 0 errors and 0 warnings.
- [x] All 12 backend test suites (91 tests) and 10 frontend test suites (32 tests) pass with 100% green status.
- [x] Pull Request raised and linked: [#90](https://github.com/munna7862/buggy-books/pull/90).

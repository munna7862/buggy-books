# Sprint 3.3: Automated API Performance Testing & Lighthouse CI Quality Gates

**Sprint Identifier**: `SPRINT-3.3-PERF-AND-LIGHTHOUSE`  
**Phase Mapping**: Phase 3 (Multi-User Sandboxing, Chaos Engineering & Performance Resilience)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Establish automated API performance benchmarking with k6 scripts, integrate Lighthouse CI audits in GitHub Actions workflows with Core Web Vitals thresholds, and close out Phase 3.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint burndown, Phase 3 milestone closure. |
| **DevOps Engineer** | AI Agent / DevOps | Adding `.github/workflows/lighthouse-ci.yml`, configuring k6 load test runner. |
| **SDET Architect** | AI Agent / SDET | Authoring k6 performance test suites for catalog search and inventory reports. |
| **Product Owner** | AI Agent / PO | Conducting Phase 3 Acceptance Review & Final Milestone Sign-off. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-PERF-301: k6 API Load & Latency Benchmarking
- **Story Statement**:  
  *As an* SDET / Performance Engineer,  
  *I want* automated load test scenarios targeting catalog searching, inventory reporting, and checkout,  
  *So that* response latency regressions (p95/p99) are measured and flagged automatically.
- **Story Points**: 3 SP (Medium)
- **Technical Subtasks**:
  - [ ] Create `performance/k6/catalog-load.js` with virtual user ramp (0 to 50 VUs).
  - [ ] Create `performance/k6/inventory-stress.js` benchmarking delayed endpoint throughput.
  - [ ] Add root script `"test:perf": "k6 run performance/k6/catalog-load.js"`.
- **Acceptance Criteria**:
  - [ ] Catalog endpoint maintains p95 < 250ms under 50 concurrent VUs.

---

### User Story US-OPS-301: Lighthouse CI Quality Gates in GitHub Actions
- **Story Statement**:  
  *As a* DevOps engineer,  
  *I want* Lighthouse CI to audit frontend pages on every pull request,  
  *So that* regressions in Performance, Accessibility, Best Practices, and SEO are blocked.
- **Story Points**: 2 SP (Low)
- **Technical Subtasks**:
  - [ ] Create `.lighthouserc.json` with score assertion thresholds (`performance: 0.90`, `accessibility: 0.95`, `seo: 0.90`).
  - [ ] Add `lighthouse-ci` job in `.github/workflows/ci.yml`.
  - [ ] Upload Lighthouse HTML performance audit summaries as workflow artifacts.
- **Acceptance Criteria**:
  - [ ] Pull requests with failing Core Web Vitals or accessibility regressions are rejected.

---

## 3. Sprint Review Comments & Refinement Loop

| Gate / Reviewer | Target Role | Review Feedback & Comments | Gate Status |
| :--- | :--- | :--- | :--- |
| **DevOps Code Review** | DevOps Engineer | Inspect Lighthouse CI assertions and k6 runner configuration. | `[PENDING]` |
| **SDET Quality Gate** | SDET Architect | Verify k6 throughput thresholds and CI performance stability. | `[PENDING]` |
| **PO Phase 3 Review** | Product Owner | Complete Phase 3 Acceptance Review and issue formal milestone sign-off. | `[PENDING]` |

---

## 4. Definition of Done (DoD) Checklist

- [ ] k6 performance test suites created and executable via `npm run test:perf`.
- [ ] Lighthouse CI configured with score assertions in GitHub Actions.
- [ ] All unit, component, Playwright E2E, and performance tests passing.
- [ ] Phase 3 criteria fully satisfied.
- [ ] Changes committed and PR submitted via `gh pr create`.
- [ ] Phase 3 sign-off issued by Product Owner.

---

## 5. Sprint Verification Plan

```bash
# 1. Monorepo Verification
npm run typecheck
npm run lint
npm run test:unit

# 2. Performance Verification
npx k6 run performance/k6/catalog-load.js
```

# Sprint 12.3: GitHub Actions Mobile CI/CD Pipeline & Build Artifacts

**Sprint Identifier**: `SPRINT-12.3-GITHUB-ACTIONS-MOBILE-CICD-PIPELINE-AND-BUILD-ARTIFACTS`  
**Phase Mapping**: [Phase 12: Mobile Chaos Engineering, Appium/Maestro Automation & Mobile CI/CD](file:///c:/BuggyBooks/buggy-books/planning/Phases/phase_12_mobile_anti_patterns_automation_and_cicd.md)  
**Estimated Velocity**: 5 Story Points  
**Sprint Goal**: Integrate mobile quality gates (linting, typechecking, component tests) into main CI, establish a dedicated headless Android emulator workflow running Maestro tests, and configure automated EAS build pipelines to compile downloadable Android APK artifacts.

---

## 1. Persona Roles & Ownership Matrix

| Persona | Assigned Member | Responsibilities for this Sprint |
| :--- | :--- | :--- |
| **Scrum Master** | AI Agent / SM | Sprint burndown tracking, CI gate verification, and DoD signoff. |
| **DevOps Automation Architect** | AI Agent / DevOps | Configure GitHub Actions workflows, Android emulator runners, and artifact caching. |
| **Mobile Developer** | AI Agent / Mobile | Configure Expo EAS build profiles (`eas.json`) for local and cloud compilation. |
| **Security Champion** | AI Agent / SEC | Audit GitHub Actions secrets, EAS tokens, and verify no credential leakage in CI logs. |
| **Product Owner** | Human PO / AI PO | Validate downloadable APK artifact availability and GitHub Actions summary dashboards. |

---

## 2. Sprint Backlog & Granular User Stories

### User Story US-MOB-1231: Mobile Quality Gates in Main CI Pipeline
- **Story Statement**:  
  *As a* DevOps Engineer,  
  *I want* mobile linting, typechecking, and unit tests to execute on every Pull Request,  
  *So that* regressions in the mobile codebase are caught before merging into `main`.
- **Story Points**: 1.5 SP
- **Technical Subtasks**:
  - [ ] Update [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml) to add Stage 1 mobile jobs:
    ```yaml
    mobile-quality-gate:
      name: Mobile Lint & Typecheck
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: "20"
            cache: "npm"
        - run: npm ci
        - run: npm run lint --workspace=mobile
        - run: npm run build --workspace=mobile -- --dry-run || npx tsc --noEmit -p mobile/tsconfig.json
    ```
  - [ ] Add mobile unit test runner (`npm test --workspace=mobile`).
- **Acceptance Criteria**:
  - [ ] PRs with mobile TypeScript or linting errors are blocked by the CI quality gate.
  - [ ] Passing PRs complete Stage 1 within 5 minutes.

---

### User Story US-MOB-1232: Headless Android Emulator & Maestro CI Workflow
- **Story Statement**:  
  *As an* SDET,  
  *I want* Maestro E2E test flows to run automatically against a headless Android emulator in CI,  
  *So that* all mobile user journeys are verified continuously on real OS targets.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Create `.github/workflows/mobile-ci.yml`:
    - Trigger on PRs modifying `mobile/**` or `mobile-automation/**` or on-demand dispatch.
    - Run on `macos-latest` or `ubuntu-latest` with KVM acceleration.
    - Setup Android SDK and boot headless Android emulator using `reactivecircus/android-emulator-runner@v2`.
    - Install Maestro CLI.
    - Launch backend server in CI (`npm run dev:backend &`).
    - Build and install Expo Android APK into the emulator.
    - Execute `maestro test mobile-automation/.maestro/`.
    - Upload Maestro screenshots and test videos as GitHub Actions artifacts on failure.
- **Acceptance Criteria**:
  - [ ] Android emulator boots, installs the app, and executes all Maestro flows cleanly.
  - [ ] Failures capture automatic screenshots and attach them to the workflow summary.

---

### User Story US-MOB-1233: Automated Build Pipelines (EAS Build / APK Generation)
- **Story Statement**:  
  *As a* QA Tester,  
  *I want* automated builds that produce downloadable Android APKs when a release tag is pushed,  
  *So that* I can install and test the mobile app on real physical devices.
- **Story Points**: 1.5 SP
- **Technical Subtasks**:
  - [ ] Configure `mobile/eas.json` with build profiles:
    - `development`: Debug APK with Expo dev client.
    - `preview`: Standalone release APK for internal QA testing without Expo Go.
    - `production`: Optimized AAB/IPA production bundles.
  - [ ] Create `.github/workflows/mobile-release.yml`:
    - Trigger on git tags matching `v*`.
    - Execute EAS build or Gradle headless build (`./gradlew assembleRelease`).
    - Attach the compiled APK to the GitHub Release.
- **Acceptance Criteria**:
  - [ ] Pushing a release tag (e.g. `v1.1.0`) triggers build generation.
  - [ ] Standalone APK is attached to GitHub Release and ready for sideloading onto Android phones.

---

## 3. Definition of Done (DoD)

- [ ] Mobile linting and typecheck jobs active in main CI workflow.
- [ ] Headless Android emulator test workflow operational in GitHub Actions.
- [ ] EAS build profile (`eas.json`) tested and producing valid Android APKs.
- [ ] Zero secrets leaked in workflow definitions.

---

## 4. Verification Commands

```bash
# Verify mobile lint and typecheck
npm run lint:mobile
npx tsc --noEmit -p mobile/tsconfig.json

# Local dry-run of EAS build
cd mobile && npx eas-cli build --platform android --profile preview --local --dry-run
```

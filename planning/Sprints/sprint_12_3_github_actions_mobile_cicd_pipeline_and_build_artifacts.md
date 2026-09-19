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
  *I want* mobile linting, typechecking, and unit tests to execute on every Pull Request using secure, SHA-pinned actions,  
  *So that* regressions in the mobile codebase are caught before merging into `main`.
- **Story Points**: 1.5 SP
- **Technical Subtasks**:
  - [ ] Update [ci.yml](file:///c:/BuggyBooks/buggy-books/.github/workflows/ci.yml) to add Stage 1 mobile jobs with SHA-pinned actions:
    ```yaml
    mobile-quality-gate:
      name: Mobile Lint & Typecheck
      runs-on: ubuntu-latest
      timeout-minutes: 10
      steps:
        - name: Checkout repository
          uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.2.2

        - name: Set up Node.js 20
          uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
          with:
            node-version: "20"
            cache: "npm"

        - name: Install dependencies
          run: npm ci

        - name: Run Mobile Lint
          run: npm run lint:mobile

        - name: Run Mobile Typecheck
          run: npm run typecheck:mobile

        - name: Run Mobile Unit Tests
          run: npm test --workspace=mobile
    ```
- **Acceptance Criteria**:
  - [ ] PRs with mobile TypeScript or linting errors are blocked by the CI quality gate.
  - [ ] Passing PRs complete Stage 1 within 5 minutes.
  - [ ] All GitHub Actions are pinned to full commit SHAs per security policy.

---

### User Story US-MOB-1232: Headless Android Emulator & Maestro CI Workflow
- **Story Statement**:  
  *As an* SDET,  
  *I want* Maestro E2E test flows to run automatically against a headless Android emulator in CI on hardware-accelerated runners,  
  *So that* all mobile user journeys are verified continuously on real OS targets without timeouts.
- **Story Points**: 2 SP
- **Technical Subtasks**:
  - [ ] Create `.github/workflows/mobile-ci.yml`:
    - Trigger on PRs modifying `mobile/**` or `mobile-automation/**`, nightly cron, or on-demand dispatch (`workflow_dispatch`).
    - Run on `macos-latest` (Apple Silicon M1/M2) with native hardware acceleration enabled.
    - Set up Android SDK, Java 17, and boot headless Android emulator using `reactivecircus/android-emulator-runner@v2`:
      - API Level: 33/34
      - Target: `google_apis`
      - Arch: `arm64-v8a`
    - Install Maestro CLI: `curl -fsSL "https://get.maestro.mobile.dev" | bash`.
    - Launch backend server in CI: `npm run dev:backend &` with healthcheck wait loop.
    - Build or install Expo Android APK into the emulator:
      - For CI efficiency: run `npx expo prebuild --platform android` then `cd mobile/android && ./gradlew assembleDebug`, or install cached debug build.
      - Sideload APK into running emulator: `adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk`.
    - Execute `maestro test mobile-automation/.maestro/`.
    - Upload Maestro test artifacts, screenshots, and logs on failure.
- **Acceptance Criteria**:
  - [ ] Android emulator boots on `macos-latest` within 3 minutes and executes all Maestro flows cleanly.
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

- [ ] Mobile linting and typecheck jobs active in main CI workflow using SHA-pinned actions.
- [ ] Headless Android emulator test workflow operational in GitHub Actions on `macos-latest` runner.
- [ ] EAS build profile (`eas.json`) tested and producing valid Android APKs.
- [ ] Zero secrets leaked in workflow definitions.

---

## 4. Verification Commands

```bash
# Verify mobile lint and typecheck
npm run lint:mobile
npm run typecheck:mobile

# Local dry-run of EAS build
cd mobile && npx eas-cli build --platform android --profile preview --local --dry-run
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **macOS Runner Minute Consumption** | Medium | High | Restrict `mobile-ci.yml` trigger paths to `mobile/**` and `mobile-automation/**` only, and reserve full matrix runs for nightly schedules and release tags. |
| **Android Emulator Cold-Boot Slowness** | High | Medium | Cache AVD snapshots and Gradle dependencies across workflow runs using `actions/cache`. |
| **Expo EAS Token Exposure in CI Logs** | Critical | Low | Pass `EXPO_TOKEN` strictly via encrypted GitHub Secrets (`${{ secrets.EXPO_TOKEN }}`) with log masking. |


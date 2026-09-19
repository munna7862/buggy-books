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
            cache-dependency-path: package-lock.json

        - name: Install dependencies
          run: npm ci

        - name: Run Mobile Lint
          run: npm run lint:mobile

        - name: Run Mobile Typecheck
          run: npm run typecheck:mobile

        - name: Run Mobile Unit Tests with Coverage
          run: npm test --workspace=mobile -- --coverage

        - name: Generate Mobile Test Summary
          if: always()
          run: node scripts/generate-test-summary.js mobile mobile

        - name: Upload Mobile Coverage Artifacts
          uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.1
          if: always()
          with:
            name: mobile-coverage
            path: mobile/coverage
            retention-days: 7
    ```
  - [ ] Update `scripts/generate-test-summary.js`:
    - Add support for target `'mobile'`, assigning `testRunner = 'Jest'`.
    - Ensure `generateSummary('mobile', 'mobile')` reads `mobile/test-results.json` and `mobile/coverage/coverage-summary.json`.
- **Acceptance Criteria**:
  - [ ] PRs with mobile TypeScript or linting errors are blocked by the CI quality gate.
  - [ ] Passing PRs complete Stage 1 within 5 minutes and publish test summaries and coverage artifacts.
  - [ ] All GitHub Actions are pinned to full commit SHAs per security policy.

---

### User Story US-MOB-1232: Headless Android Emulator & Maestro CI Workflow
- **Story Statement**:  
  *As an* SDET,  
  *I want* Maestro E2E test flows to run automatically against a headless Android emulator in CI on hardware-accelerated runners with zero external bundler dependencies,  
  *So that* all mobile user journeys are verified continuously on real OS targets hermetically without timeouts.
- **Story Points*: 2 SP
- **Technical Subtasks**:
  - [ ] Create `.github/workflows/mobile-ci.yml`:
    - Strict path triggers: `mobile/**`, `mobile-automation/**`, `.github/workflows/mobile-ci.yml`, nightly cron, or manual dispatch (`workflow_dispatch`).
    - Runner: `macos-latest` (Apple Silicon hardware-accelerated virtualization).
    - Set up Java 17:
      ```yaml
      - name: Set up Java 17
        uses: actions/setup-java@3a4f6e1af504cf6a31855fa899c6aa5355ba6c12 # v4.7.0
        with:
          distribution: 'temurin'
          java-version: '17'
      ```
    - Install Maestro CLI and register in `$GITHUB_PATH`:
      ```yaml
      - name: Install Maestro CLI
        run: |
          curl -fsSL "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH
      ```
    - Set up Node.js 20 & Install Monorepo Dependencies:
      ```yaml
      - name: Set up Node.js 20
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: package-lock.json

      - name: Install Monorepo Dependencies
        run: npm ci
      ```
    - Launch backend server in CI with required test secret:
      ```yaml
      - name: Start Backend Server
        run: |
          npm run dev:backend &
          npx wait-on http://localhost:4000/api/books -t 30000
        env:
          PORT: 4000
          NODE_ENV: test
          JWT_SECRET: ci-test-secret-do-not-use-in-production
      ```
    - Hermetic Standalone APK Assembly & Signing:
      - Cleanly prebuild native Android directory: `cd mobile && npx expo prebuild --platform android --clean`
      - Pre-export offline JavaScript bundle: `npx expo export --platform android`
      - Assemble self-signed standalone debug APK with embedded JS bundle: `cd android && ./gradlew assembleDebug`
      - Note: `./gradlew assembleDebug` automatically signs the APK with the debug keystore and packages the exported JS bundle, avoiding `INSTALL_PARSE_FAILED_NO_CERTIFICATES` errors on `adb install` and runtime crashes without Metro.
    - Boot Android emulator using SHA-pinned action:
      ```yaml
      - name: Run Android Emulator & Maestro Tests
        uses: reactivecircus/android-emulator-runner@d94c3fbe4fe6a29e4ab5ba84646633a2c53a693c # v2.33.0
        with:
          api-level: 34
          target: google_apis
          arch: arm64-v8a
          profile: pixel_6
          script: |
            # 1. Reverse backend port so emulator localhost:4000 bridges directly to host
            adb reverse tcp:4000 tcp:4000
            
            # 2. Enable accelerometer auto-rotation for MOB-B6 landscape test
            adb shell settings put system accelerometer_rotation 1
            
            # 3. Install prebuilt self-signed standalone APK
            adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk
            
            # 4. Execute Maestro declarative flows
            maestro test mobile-automation/.maestro/
      ```
    - Upload Maestro test artifacts, screenshots, and logs on failure.
- **Acceptance Criteria**:
  - [ ] Android emulator boots on `macos-latest` within 3 minutes and executes all Maestro flows cleanly.
  - [ ] Sideloaded debug APK runs standalone with embedded JS bundle and accesses host backend via `adb reverse`.
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
    - Build standalone APK using headless Gradle (`./gradlew assembleRelease`) for free, account-independent builds, with fallback to cloud EAS if `EXPO_TOKEN` secret is configured.
    - Attach the compiled APK (`BuggyBooks-vX.Y.Z.apk`) to the GitHub Release.
- **Acceptance Criteria**:
  - [ ] Pushing a release tag (e.g. `v1.1.0`) triggers build generation.
  - [ ] Standalone APK is attached to GitHub Release and ready for sideloading onto Android phones.

---

## 3. Definition of Done (DoD)

- [ ] Mobile linting, typecheck, and unit test jobs active in main CI workflow using SHA-pinned actions.
- [ ] Headless Android emulator test workflow operational in GitHub Actions on `macos-latest` runner with `adb reverse` network bridging.
- [ ] Standalone release APK compiled and verified without Metro bundler dependencies.
- [ ] EAS build profile (`eas.json`) and Gradle headless build tested and producing valid Android APKs.
- [ ] Zero secrets leaked in workflow definitions.

---

## 4. Verification Commands

```bash
# 1. Verify mobile lint, typecheck, and unit tests
npm run lint:mobile
npm run typecheck:mobile
npm test --workspace=mobile

# 2. Local headless standalone bundle test
cd mobile && npx expo export -p android && cd android && ./gradlew assembleRelease

# 3. Local dry-run of EAS build
cd mobile && npx eas-cli build --platform android --profile preview --local --dry-run
```

---

## 5. Risk Assessment & Technical Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **macOS Runner Minute Consumption** | Medium | High | Restrict `mobile-ci.yml` trigger paths to `mobile/**` and `mobile-automation/**` only, and reserve full matrix runs for nightly schedules and release tags. |
| **Android Emulator Cold-Boot Slowness** | High | Medium | Cache AVD snapshots and Gradle dependencies across workflow runs using `actions/cache`. |
| **Emulator localhost Networking Mismatch** | High | High | Execute `adb reverse tcp:4000 tcp:4000` immediately after emulator boot and ensure `EXPO_PUBLIC_API_URL=http://localhost:4000/api` is injected so requests bridge directly to host. |
| **Debug APK Crash without Metro Bundler / Unsigned APK** | Critical | High | Build standalone APK (`./gradlew assembleDebug`) with pre-bundled offline JS assets (`npx expo export`) and automatic debug keystore signing, ensuring clean `adb install` without certificate failures or Metro runtime dependency in CI. |
| **Expo EAS Token Exposure in CI Logs** | Critical | Low | Pass `EXPO_TOKEN` strictly via encrypted GitHub Secrets (`${{ secrets.EXPO_TOKEN }}`) with log masking. |


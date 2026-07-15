# Pre-Launch Checklist

Work through this in full before submitting a build for **public** release on the App Store
or Play Store (i.e. before Phase 4 in `ROLLOUT.md`). Check items off in this file directly
(`- [x]`) and keep the completed checklist in the repo as a record of what was verified for
each release. Copy this file's checkboxes back to `- [ ]` when starting the next release
cycle.

## 1. Crash-free sanity pass

- [ ] Fresh install on a real iOS device — no crash on first launch.
- [ ] Fresh install on a real Android device — no crash on first launch.
- [ ] `pnpm --filter @workspace/authentic-steps run test` passes with no unexpected failures.
- [ ] `pnpm run typecheck` passes cleanly across the whole workspace.
- [ ] No unresolved crash reports from beta testers in `ROLLOUT_STATUS.md`'s open feedback
      list that are marked severity "crash".
- [ ] App has been used continuously for at least a few minutes per core flow below without
      a freeze, white screen, or force-close.

## 2. Core flows verified (manually, on a real device — not just simulator)

- [ ] **Onboarding** — first-launch flow completes end to end; recovery code is generated and
      copyable.
- [ ] **Sign in / invite redemption** — a member invite link opens the app and pre-fills the
      redeem code correctly.
- [ ] **Daily ritual** — gratitude → intention → "I am" statement flow completes and shows up
      in the journal afterward.
- [ ] **Toolbox / grounding exercises** — at least one breathing/grounding exercise runs
      start to finish with sound (if chimes enabled) and without hanging.
- [ ] **SOS / support** — the Support tab's "Help Me" triage flow reaches a helpline
      recommendation; tapping "Call" on a helpline actually opens the phone dialer.
- [ ] **Journal** — journal entries and grounding history display correctly; PDF and JSON
      export both produce a usable file with no missing data.
- [ ] **Notifications** — enabling a daily reminder actually schedules a local notification
      (verify via device settings or by waiting for the scheduled time in a test build).
- [ ] **Settings** — theme switching, chime toggle, "Report a problem" (opens a pre-filled
      email draft), sign out, and delete-all-data all work without crashing.
- [ ] **Community** — sample/community feed renders without errors.

## 3. Store listing assets ready

- [ ] App icon present at all required resolutions (verified via `eas build` output — EAS
      generates the platform-specific sizes from `assets/images/icon.png`).
- [ ] Screenshots captured for required device sizes (iPhone + iPad if `supportsTablet` is
      ever enabled; Android phone + tablet as required by Play Console).
- [ ] App Store / Play Store description, keywords, and category finalized.
- [ ] `store-assets/app-store-metadata-en-AU.md` reflects any description or keyword changes
      made since the last release — run `pnpm --filter @workspace/scripts run check-metadata-sync`
      to get a word-count comparison and flag large divergence between the base and AU files.
- [ ] Support URL and marketing URL (if any) are live and correct.
- [ ] App Store Connect "Age Rating" / Play Console "Content rating" questionnaire completed,
      appropriate for a youth mental-health support app.
- [ ] Marketing version bumped appropriately in `artifacts/authentic-steps/package.json`
      (`npm version patch|minor|major` — see `replit.md` → "Versioning strategy") and
      committed before the production build.

## 4. Privacy / permissions copy reviewed

- [ ] In-app Privacy Policy and Terms of Service (Profile → About) reflect current data
      practices — especially the recovery-code/local-storage model and that data is "never
      sold."
- [ ] Notification permission rationale text (shown before the OS prompt) accurately
      describes what reminders are for.
- [ ] iOS `NSPrivacyAccessedAPITypes` entries in `app.json` still match actual API usage (no
      new native APIs added since these reasons were last reviewed).
- [ ] Play Console Data Safety form matches what the app actually collects/stores (should be
      minimal — no PII beyond what's in the anonymous recovery payload).
- [ ] App Store privacy "nutrition label" (App Privacy section in App Store Connect) matches
      the same practices.
- [ ] Safe Messaging Guidelines content (Profile → About) has been reviewed against current
      best-practice guidance for youth mental-health content.

## 5. Beta feedback resolved

- [ ] All "blocking" items in `ROLLOUT_STATUS.md`'s open feedback list are closed or
      explicitly deferred with a reason.
- [ ] No open feedback items tagged as affecting the SOS/support flow specifically — that
      surface has zero tolerance for bugs given its purpose.

## Sign-off

- [ ] Reviewed by: ___________________  Date: ___________
- [ ] Build submitted: iOS build # _______  Android build # _______

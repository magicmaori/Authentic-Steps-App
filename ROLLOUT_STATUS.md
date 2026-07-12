# Rollout Status

Single place to see where the rollout stands. Update this whenever the phase changes,
testers are added/removed, or feedback comes in (from the mobile app's
"Report a problem" action, or from any other channel — Slack, text, hallway conversation). See
`ROLLOUT.md` for the process this status is tracking against, and `PRELAUNCH_CHECKLIST.md` for
the final gate before public launch.

_Last updated: 2026-07-12 — Android APK link added to TESTER_BRIEF.md_

## Current phase

**Phase 1 — Internal beta (Android ready; iOS needs App Store Connect investigation)**

Android APK builds are complete and hosted. The direct APK download link is live via Object
Storage. iOS builds are completing successfully on EAS, but submission to TestFlight is failing
with a generic Apple error — see "iOS TestFlight issue" below.

## Builds completed (2026-07-12)

| Platform | Build ID | Build # | Status | Notes |
|---|---|---|---|---|
| iOS (preview) | `e0809ce2-1f6e-43e9-9611-961880389440` | 2 | ✅ Built | Submission to ASC failing — see below |
| Android (APK) | `370ba045-c0e0-476a-8020-64eefd3bf950` | versionCode 4 | ✅ Built + Hosted | Ready to share |

## Android — APK download link (ready to share)

The APK is live and publicly downloadable:

```
https://2d1f7221-b40c-4736-8006-751e690f20a5-00-1t3nip2aakk7r-90ehfhha.kirk.replit.dev/api/storage/public-objects/builds/authentic-steps-1.0.0-build4.apk
```

> This is the development preview URL. Once the app is **deployed to production**, the stable
> URL will be:
> `https://<production-domain>/api/storage/public-objects/builds/authentic-steps-1.0.0-build4.apk`
>
> Deploy the API server first (Replit → Deploy), then share the production URL with testers.
> The APK is already in Object Storage — no re-upload needed after deploy.

Share the URL alongside `TESTER_BRIEF.md` with Android testers. They follow the "Installing
on Android" section in that file.

## iOS TestFlight issue — requires App Store Connect investigation

Every EAS submission attempt fails with:
> "Something went wrong when submitting your app to Apple App Store Connect."

The IPA itself builds correctly (valid distribution cert, valid provisioning profile, valid
App Store Connect API key). The error occurs on Apple's side during upload/processing. Multiple
builds and submissions have been attempted, all with the same result.

**What to check in App Store Connect (appstoreconnect.apple.com):**

1. Open the app with Apple ID **6787810652** → confirm the bundle ID is `org.authenticsteps.youth`
2. Go to the app's **TestFlight** tab — check if any builds show "Processing" or if there
   are any warnings or rejections under Activity
3. Go to **App Store → Compliance** or **General** — check if there's an export compliance
   prompt requiring action before builds can be uploaded
4. Check **Users and Access → Keys** — confirm the API key `2952PYUPAQ` still has App Manager
   access (not expired or revoked)
5. If builds are showing in TestFlight as "Processing", wait ~30 min and check again — Apple's
   processing queue can return a transient error that clears itself

**Once the issue is identified and resolved**, re-run:
```sh
export EXPO_TOKEN=<your token>
pnpm --filter @workspace/authentic-steps run eas-submit-ios-preview
# This submits the already-built IPA (e0809ce2) — no rebuild needed
# Then add testers in App Store Connect → TestFlight → Internal Testers
```

## Active testers

| Name | Platform | Phase added | Notes |
|---|---|---|---|
| _(add a row per tester when granted TestFlight/APK access)_ | | | |

> Move to a "Phase 2" note in this table once promoted to external/closed testing.

## Feedback triage

Feedback is tracked in **Linear** (team "Authentic Steps For Youth"). The in-app
"Report a problem" action (Profile → Support & Feedback) submits structured reports directly
to Linear via `POST /feedback` on the API server. Triage, prioritization, and status happen
in Linear itself.

If the structured submission fails (offline, server error, etc.), the app automatically falls
back to `mailto:hello@authenticsteps.com.au` — any mail that lands in that inbox should be
entered into Linear manually.

## Blocking items before testers can install

- [x] **Android**: APK uploaded to Object Storage and download link live. `TESTER_BRIEF.md`
  updated with the direct APK URL — share that file with Android testers to get started.
  Once the API server is **deployed to production**, update the URL in `TESTER_BRIEF.md` to
  the production domain for a permanent link (APK stays in Object Storage — no re-upload needed).
- [ ] **iOS**: Investigate the TestFlight submission error in App Store Connect (see above),
  re-run `eas-submit-ios-preview`, then add tester emails under Internal Testers

## Blocking items before public launch

- [ ] Complete `PRELAUNCH_CHECKLIST.md` in full.
- [ ] Resolve all `blocking`/`crash`-labeled issues open in the Linear triage queue.

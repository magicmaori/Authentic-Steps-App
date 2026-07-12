# Rollout Status

Single place to see where the rollout stands. Update this whenever the phase changes,
testers are added/removed, or feedback comes in (from the mobile app's
"Report a problem" action, or from any other channel — Slack, text, hallway conversation). See
`ROLLOUT.md` for the process this status is tracking against, and `PRELAUNCH_CHECKLIST.md` for
the final gate before public launch.

_Last updated: 2026-07-12 — APK build5 (versionCode 5) built and uploaded; fixes silent install failure caused by versionCode downgrade; Clerk proxy URL and pk_live key confirmed baked in_

## Current phase

**Phase 1 — Internal beta (Android ready; iOS needs App Store Connect investigation)**

Android APK builds are complete and hosted. The direct APK download link is live via Object
Storage. iOS builds are completing successfully on EAS, but submission to TestFlight is failing
with a generic Apple error — see "iOS TestFlight issue" below.

## Builds completed (2026-07-12)

| Platform | Build ID | Build # | Status | Notes |
|---|---|---|---|---|
| iOS (preview) | `e0809ce2-1f6e-43e9-9611-961880389440` | 2 | ✅ Built | Submission to ASC failing — see below |
| Android (APK) | `3b2a6151-7695-472c-9ab1-bf3ea0784c54` | versionCode **5** | ✅ Built + Hosted | **Use this link — replaces build4** |

## Android — APK download link (ready to share)

The APK is live and publicly downloadable:

```
https://authentic-steps-youth.replit.app/api/storage/public-objects/builds/authentic-steps-1.0.0-build5.apk
```

> **build5 replaces build4** — the previous APK had versionCode 3 (lower than the installed versionCode 4),
> so Android silently refused to install it. build5 has versionCode 5 and installs correctly.
> If a device already has build4, it can upgrade directly without uninstalling.
>
> This is the permanent production URL (API server deployed to `authentic-steps-youth.replit.app`).
> The APK is in Object Storage — share this link directly with Android testers.

Share the URL alongside `TESTER_BRIEF.md` with Android testers. They follow the "Installing
on Android" section in that file.

## iOS TestFlight issue — root cause confirmed, action required in App Store Connect

Every EAS submission attempt fails with:
> "Something went wrong when submitting your app to Apple App Store Connect."

**Investigation results (2026-07-12):**

✅ `EXPO_TOKEN` — valid, confirmed working  
✅ API key `2952PYUPAQ` ([Expo] EAS Submit blnk69EKA9) — active, found by EAS CLI  
✅ Build `e0809ce2` — correctly targeted (v1.0.0, build number 2, IPA built successfully)  
✅ EAS submission scheduling — succeeds (gets a submission ID; EAS reaches Apple)  
❌ Apple's side — rejects the IPA upload after receipt

**Root cause:** The rejection is happening on Apple's servers after the IPA is received, not in
our config or credentials. The detailed Apple error is only visible in the EAS web dashboard:

👉 **[Check submission logs at expo.dev →](https://expo.dev/accounts/authentic-steps-for-youthapp/projects/authentic-steps-app/submissions)**

The most common causes for this exact failure pattern:

**1. Pending export compliance prompt in App Store Connect (most likely)**
- Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- Open the app (Apple ID **6787810652**)
- Look for a banner or yellow warning asking about export compliance
- If prompted: the app uses only standard HTTPS (no custom encryption) → answer "No" to all
  encryption questions, or confirm `ITSAppUsesNonExemptEncryption = false`
- Note: the binary already has `ITSAppUsesNonExemptEncryption: false` in its Info.plist, but
  Apple sometimes requires a manual acknowledgement in ASC on the first upload

**2. Unaccepted Apple Developer Program agreement**
- In App Store Connect → **Agreements, Tax, and Banking**
- Check for any pending agreements (a yellow "Action Required" banner usually appears)
- Accept any outstanding agreements, then retry the submission

**3. App record missing required metadata**
- The app might need a Privacy Policy URL set before builds can be uploaded
- Check App Store Connect → Your App → **App Information** → Privacy Policy URL
- Add `https://authenticsteps.com.au/privacy` (or equivalent) if missing

**4. Check the exact Apple error in the EAS logs**
- Go to [expo.dev → Submissions](https://expo.dev/accounts/authentic-steps-for-youthapp/projects/authentic-steps-app/submissions)
- Open the latest failed submission
- The Apple Transporter error message in the logs will pinpoint the exact issue

**Once the issue is resolved**, re-run:
```sh
# EXPO_TOKEN is already set in this environment — just run:
pnpm --filter @workspace/authentic-steps run eas-submit-ios-preview
# Submits the already-built IPA (e0809ce2) — no rebuild needed.
# Then add testers: App Store Connect → TestFlight → Internal Testers → add emails
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

- [x] **Android**: APK in Object Storage. API server deployed to production (`authentic-steps-youth.replit.app`). `TESTER_BRIEF.md` has the permanent production download URL — share it with Android testers.
- [ ] **iOS**: Investigate the TestFlight submission error in App Store Connect (see above),
  re-run `eas-submit-ios-preview`, then add tester emails under Internal Testers

## Blocking items before public launch

- [ ] Complete `PRELAUNCH_CHECKLIST.md` in full.
- [ ] Resolve all `blocking`/`crash`-labeled issues open in the Linear triage queue.

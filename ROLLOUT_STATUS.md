# Rollout Status

Single place to see where the rollout stands. Update this whenever the phase changes,
testers are added/removed, or feedback comes in (from the mobile app's
"Report a problem" action, or from any other channel — Slack, text, hallway conversation). See
`ROLLOUT.md` for the process this status is tracking against, and `PRELAUNCH_CHECKLIST.md` for
the final gate before public launch.

_Last updated: 2026-07-12 — APK build7 (versionCode 7) uploaded; fixes Clerk `isLoaded` hang caused by stale SecureStore token on existing installs; adds self-healing "Clear cache & retry" button in loading screen_

## Current phase

**Phase 1 — Internal beta (Android ready; iOS needs App Store Connect investigation)**

Android APK builds are complete and hosted. The direct APK download link is live via Object
Storage. iOS builds are completing successfully on EAS, but submission to TestFlight is failing
with a generic Apple error — see "iOS TestFlight issue" below.

## Builds completed (2026-07-12)

| Platform | Build ID | Build # | Status | Notes |
|---|---|---|---|---|
| iOS (preview) | `e0809ce2-1f6e-43e9-9611-961880389440` | 2 | ✅ Built | Submission to ASC failing — see below |
| Android (APK) | `882ee810-7916-4bb9-be27-5ea9a6a1c3cf` | versionCode **7** | ✅ Built + Hosted | **Use this — fixes loading hang** |
| Android (APK) | `3b2a6151-7695-472c-9ab1-bf3ea0784c54` | versionCode **5** | superseded | Previous build — installs fine but loading may hang on re-install |

## Android — APK download link (ready to share)

The APK is live and publicly downloadable:

```
https://authentic-steps-youth.replit.app/api/storage/public-objects/builds/authentic-steps-1.0.0-build7.apk
```

> **build7 replaces build5** — fixes a bug where the app would show the loading spinner forever
> if the user had previously installed an older version (stale Clerk session token in SecureStore
> caused `isLoaded` to never resolve). build7 adds a 10-second timeout and a **"Clear cache &
> retry"** button that wipes the stale token and re-initialises Clerk automatically.
>
> **If testers are stuck on build5:** they can unblock themselves immediately by going to
> Settings → Apps → Authentic Steps → Storage → Clear Data, then reopening the app.
> build7 makes this self-service from within the app.
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

## Google Play content rating — action required before AAB submission

Google Play **blocks** any submission — including to the internal testing track — until a
completed IARC content rating questionnaire generates a certificate. The answers have been
pre-verified against the app's actual content (see `store-assets/app-store-metadata.md` →
"Content Rating — Google Play Questionnaire"). Here is what needs to happen in Play Console:

**Steps (takes ~5 minutes):**

1. Open [Play Console](https://play.google.com/console) → your app → **Policy → App content → Content rating**.
2. Click **Start questionnaire** (or **Continue** if one was started earlier).
3. Enter the contact email address and select the **"Utility, Productivity, Communication, or Other"** category — this is the closest match for a wellbeing/journaling app and yields the most appropriate rating.
4. Answer the questions as follows (pre-verified against actual app content):

   | Question | Answer |
   |---|---|
   | Does the app contain violence? | **No** |
   | Does the app contain sexual content? | **No** |
   | Does the app contain profanity? | **No** |
   | Does the app reference controlled substances? | **No** |
   | Does the app contain gambling content? | **No** |
   | Does the app contain user-generated content shared with others? | **No** _(journal entries are stored privately on the user's account and never shared)_ |
   | Is this app designed for children under 13? | **No** _(designed for youth broadly, not exclusively under-13)_ |

   If a health/wellness sub-question appears, answer that the app provides **general wellness guidance**, not medical or clinical treatment.

5. Click **Save**, then **Apply rating**. Play Console will generate the IARC certificate immediately and show the resulting rating (expected: **Everyone** or **Everyone 10+**).
6. Update this file — check off the item below and add the certificate date.

**Expected rating:** Everyone / Everyone 10+

**Status:** ⬜ Not yet submitted — certificate pending Play Console action

_Once the certificate is generated, the content rating item in `PRELAUNCH_CHECKLIST.md` can be checked off._

---

## Blocking items before testers can install

- [x] **Android**: APK in Object Storage. API server deployed to production (`authentic-steps-youth.replit.app`). `TESTER_BRIEF.md` has the permanent production download URL — share it with Android testers.
- [ ] **Android (AAB / Play Store internal track)**: Complete the Google Play content rating questionnaire (see section above) before submitting an AAB via `eas-submit-android` — Play Console will block the upload without it.
- [ ] **iOS**: Investigate the TestFlight submission error in App Store Connect (see above),
  re-run `eas-submit-ios-preview`, then add tester emails under Internal Testers

## Blocking items before public launch

- [ ] Complete `PRELAUNCH_CHECKLIST.md` in full.
- [ ] Resolve all `blocking`/`crash`-labeled issues open in the Linear triage queue.

# Rollout Status

Single place to see where the rollout stands. Update this whenever the phase changes,
testers are added/removed, or feedback comes in (from the mobile app's
"Report a problem" action, or from any other channel — Slack, text, hallway conversation). See
`ROLLOUT.md` for the process this status is tracking against, and `PRELAUNCH_CHECKLIST.md` for
the final gate before public launch.

_Last updated: 2026-07-10_

## Current phase

**Phase 1 — Internal beta (active)**

The open sign-up model is live and the sign-up → onboarding → home flow has been smoke-tested
(code-level, 2026-07-10). The app is ready for testers; see "Distribute to testers" below for
the EAS build commands to get the app onto devices.

## Distribute to testers

Run these commands once `EXPO_TOKEN` is exported in your shell, then add testers below:

```sh
# iOS → TestFlight
pnpm --filter @workspace/authentic-steps run eas-build-ios-preview   # ~15–20 min
pnpm --filter @workspace/authentic-steps run eas-submit-ios-preview
# Then in App Store Connect → TestFlight, add each tester's Apple ID under Internal Testers.

# Android → APK (download from expo.dev and share directly with testers)
pnpm --filter @workspace/authentic-steps run eas-build-android-apk
```

## Active testers

| Name | Platform | Phase added | Notes |
|---|---|---|---|
| _(none yet — add a row per tester when granted TestFlight/APK access)_ | | | |

> Move to a "Phase 2" note in this table (or a second table) once promoted to external/closed testing.

## Feedback triage

Feedback is tracked in **Linear** (team "Authentic Steps For Youth", key `AUT`). The in-app
"Report a problem" action (Profile → Support & Feedback) submits structured reports directly
to Linear via `POST /feedback` on the API server — see `artifacts/api-server/src/lib/linear.ts`
and `artifacts/api-server/src/routes/feedback.ts`. Triage, prioritization, and status happen
in Linear itself.

If the structured submission fails (offline, server error, etc.), the app automatically falls
back to the original `mailto:hello@authenticsteps.com.au` flow so no report is lost — any
mail that lands in that inbox should be entered into Linear manually as a fallback-path issue.

## Blocking items before next phase

- [ ] _(none yet — populate as Phase 1 feedback comes in)_

## Blocking items before public launch

- [ ] Complete `PRELAUNCH_CHECKLIST.md` in full.
- [ ] Resolve all `blocking`/`crash`-labeled issues open in the Linear triage queue.

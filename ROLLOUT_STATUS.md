# Rollout Status

Single place to see where the rollout stands. Update this whenever the phase changes,
testers are added/removed, or feedback comes in (from the mobile app's or Agency Dashboard's
"Report a problem" email, or from any other channel — Slack, text, hallway conversation). See
`ROLLOUT.md` for the process this status is tracking against, and `PRELAUNCH_CHECKLIST.md` for
the final gate before public launch.

_Last updated: 2026-07-10_

## Current phase

**Phase 1 — Internal beta** (awaiting new builds — see below)

> **Action required:** The open sign-up model was merged on 2026-07-10 (Task #400). The last
> distributed builds (iOS TestFlight Jul 8, Android APK Jul 9) pre-date this change and still
> show the old invite/locked-access screen. New EAS builds must be run before testers can use
> the app. Run these commands (requires `EXPO_TOKEN` exported in your shell):
>
> ```sh
> # iOS → TestFlight
> pnpm --filter @workspace/authentic-steps run eas-build-ios-preview   # ~15–20 min
> pnpm --filter @workspace/authentic-steps run eas-submit-ios-preview
>
> # Android → APK (download from expo.dev and share directly with testers)
> pnpm --filter @workspace/authentic-steps run eas-build-android-apk
> ```
>
> Once distributed, update this file: remove this notice, update "Last updated", add testers.

## Active testers

| Name | Platform | Phase added | Notes |
|---|---|---|---|
| _(none yet)_ | | | |

> Add a row per tester when they're added to TestFlight Internal Testing or the Play Console
> Internal testing track. Move to a "Phase 2" note in this table (or a second table) once
> promoted to external/closed testing.

## Feedback triage

Feedback is no longer tracked manually in this file. The in-app "Report a problem" action
(Profile → Support & Feedback) now submits structured reports directly to a **Linear** triage
queue (team "Authentic Steps For Youth", key `AUT`) via `POST /feedback` on the API server —
see `artifacts/api-server/src/lib/linear.ts` and `artifacts/api-server/src/routes/feedback.ts`.
Triage, prioritization, and status now happen in Linear itself, not in a markdown table here.

If the structured submission fails (offline, server error, etc.), the app automatically falls
back to the original `mailto:hello@authenticsteps.com.au` flow so no report is lost — any
mail that lands in that inbox should be entered into Linear manually as a fallback-path issue.

## Blocking items before next phase

- [ ] _(none yet — populate as Phase 1 feedback comes in)_

## Blocking items before public launch

- [ ] Complete `PRELAUNCH_CHECKLIST.md` in full.
- [ ] Resolve all `blocking`/`crash`-labeled issues open in the Linear triage queue.

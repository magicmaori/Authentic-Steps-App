# Rollout Status

Single place to see where the rollout stands. Update this whenever the phase changes,
testers are added/removed, or feedback comes in (from the mobile app's or Agency Dashboard's
"Report a problem" email, or from any other channel — Slack, text, hallway conversation). See
`ROLLOUT.md` for the process this status is tracking against, and `PRELAUNCH_CHECKLIST.md` for
the final gate before public launch.

_Last updated: 2026-07-08_

## Current phase

**Phase 1 — Internal beta** (not yet started; no builds have been distributed to testers yet)

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

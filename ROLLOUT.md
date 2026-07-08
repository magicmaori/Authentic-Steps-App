# Rollout Plan — Beta to Launch

This document is the process for taking **Authentic Steps For Youth** from internal demo
to public App Store / Play Store release. It defines the phases, who's in each one, how to
move people between phases, and how feedback gets captured. It complements (does not
replace) `replit.md`'s "Mobile builds (iOS & Android via EAS)" section, which covers the
build/submit commands referenced below.

For current phase, active testers, and open feedback, see `ROLLOUT_STATUS.md` — keep that
file up to date as the single source of truth; this file describes the *process*, not the
day-to-day status.

## Feedback capture

Every phase below relies on one lightweight mechanism: the **"Report a problem"** action in
the app's Profile tab (Settings → Support & Feedback). It opens a pre-filled email draft to
`hello@authenticsteps.com.au` with the device platform/OS version and the tester's anonymous
name attached, so reports are traceable without collecting any other personal data. There is
no backend ticket system by design — for a beta of this size, a shared inbox is durable
enough and avoids building/maintaining extra infrastructure. Log every incoming report (even
hallway/Slack/text feedback that didn't come through the app) into `ROLLOUT_STATUS.md` under
"Open feedback" so it doesn't get lost between updates.

## Phase 1 — Internal beta (trusted testers)

**Goal:** catch obvious breakage with people who'll tolerate rough edges and give direct
feedback (e.g. John Rutter and a handful of others).

**iOS — TestFlight Internal Testing**
1. Build: `pnpm --filter @workspace/authentic-steps run eas-build-ios-preview`
2. Submit: `pnpm --filter @workspace/authentic-steps run eas-submit-ios-preview`
3. In App Store Connect → TestFlight, add each tester's Apple ID email under **Internal
   Testers** (no Apple review needed, available almost immediately).
4. Testers install via the TestFlight app.

**Android — Play Console Internal Testing track**
1. Build: `pnpm --filter @workspace/authentic-steps run eas-build-android`
2. Submit: `pnpm --filter @workspace/authentic-steps run eas-submit-android`
3. One-time setup (see `replit.md` → "One-time Play Console internal testing setup"): add
   tester emails to the Internal testing track's tester list, send them the opt-in URL.
4. Testers install via the Play Store link after opting in.

**Exit criteria:** no crashes on core flows (onboarding, daily ritual, SOS/support, journal),
and the internal group has actually used the app for a few days.

## Phase 2 — Wider external beta

**Goal:** broader real-world feedback across more devices, OS versions, and usage patterns
than the internal group can provide.

**iOS — TestFlight External Testing**
1. Same build (`eas-build-ios-preview`) can be reused if still current, or cut a new one.
2. In App Store Connect → TestFlight, create/add testers to an **External Testing** group
   (via email list or a public link).
3. External builds require a brief Apple Beta App Review (~1 day) the first time — plan for
   that lead time before promising testers access on a specific date.
4. Testers install via the TestFlight app once approved.

**Android — Play Console Closed/Open Testing**
1. Promote from Internal testing to a **Closed testing** track (or Open testing, if you want
   anyone with the link to join) in Play Console → Testing.
2. Add the wider tester list (email list, Google Group, or an open link depending on track
   type).
3. Google requires the app to be enrolled with a minimum tester count and a short soak period
   before allowing a production release from closed/open testing on a new app — check current
   requirements in Play Console before committing to a launch date.

**Exit criteria:** feedback volume has dropped off (most reports are duplicates or minor),
and no new crash-causing bugs have appeared in the last testing round.

## Phase 3 — Final QA pass

Before submitting for public release, run through `PRELAUNCH_CHECKLIST.md` in full. This is
the gate between "beta feedback resolved" and "ready to submit." Do not start store
submission until every item is checked.

## Phase 4 — Public launch

Submit the reviewed, checked build to both stores:

```sh
pnpm --filter @workspace/authentic-steps run eas-build-ios       # production IPA
pnpm --filter @workspace/authentic-steps run eas-submit-ios      # App Store Connect
pnpm --filter @workspace/authentic-steps run eas-build-android   # production AAB
pnpm --filter @workspace/authentic-steps run eas-submit-android  # Play Console
```

Store submission and review itself (Apple App Review, Google Play review) is a separate,
later step — out of scope for this rollout plan beyond making sure the build reaching that
step is one that's passed the checklist.

## Moving between phases

- Update `ROLLOUT_STATUS.md`'s "Current phase" line and tester list whenever you promote to
  the next phase or add/remove testers.
- Recruiting/emailing individual testers is a people/process activity done outside this repo
  (email, Slack, text) — this doc only covers the mechanical steps for granting them access
  once you've decided who they are.

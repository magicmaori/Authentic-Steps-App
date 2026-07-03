---
name: Authentic Steps app quirks
description: Non-obvious gotchas for the artifacts/authentic-steps Expo app — config file resolution and a misleading jest exit code.
---

# Authentic Steps (artifacts/authentic-steps) quirks

## Expo config: app.config.ts shadows app.json
The app has BOTH `app.config.ts` and `app.json`. `app.config.ts` exports a
static object, so Expo uses it and **`app.json` is effectively inert** — a
static-object dynamic config replaces (does not merge) the static config.

**Why:** an edit made only to `app.json` (bundle id, privacy manifest,
permissions) will silently do nothing and can ship a misconfigured build.
**How to apply:** treat `app.config.ts` as the source of truth. When changing
native config, edit `app.config.ts`; keep `app.json` in sync only for
documentation, or prefer deleting `app.json` outright.

Related: the iOS privacy manifest key is `NSPrivacyAccessedAPITypeReasons`
(matches Apple), NOT `NSPrivacyAccessedAPIReasons` — Expo's ExpoConfig types
catch the wrong one at typecheck.

## jest exits 1 even though all tests pass
`pnpm --filter @workspace/authentic-steps test` (jest) prints
"Tests: N passed, N total / N suites passed" but still exits non-zero.

**Why:** a pre-existing "Cannot log after tests are done" (async log after
teardown) flake in `__tests__/BreathingTimer.test.tsx` and
`__tests__/ritual-save-failure.test.tsx`. It is unrelated to app config,
notifications, community, or profile changes — those suites don't import them.
**How to apply:** do not treat the exit-1 alone as a real failure. Confirm the
summary line shows all tests passing; only investigate if the passed/total
count drops or a `FAIL <suite>` line appears.

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

## `tsc --noEmit` has pre-existing systemic "not a valid JSX component" errors
Running `pnpm --filter @workspace/authentic-steps run typecheck` reports many
errors like `'LinearGradient' cannot be used as a JSX component` /
`'BlurView' ...` / `GestureHandlerRootView` children — across untouched screens
(index, streaks, sos, ritual/*, onboarding, etc.).

**Why:** pnpm (no hoist config, `auto-install-peers=false`) does not make
`@types/react` resolvable to transitive class-component libs that don't declare
it as a peer (expo-linear-gradient, expo-blur, gesture-handler), so their
`Component` base resolves without props/state. `pnpm why @types/react` confirms a
**single** 19.1.17 version — it is NOT a version conflict, and Metro/Babel builds
ignore it entirely. The real gates for this app are the Metro build + jest.
**How to apply:** don't chase these — they are baseline noise. When verifying an
edit, judge by whether you introduced NEW error kinds (logic/prop/type errors in
files you touched), not by the total error count. jest (295 tests) is the gate.

## Screens smoke test is Clerk-gated now
`__tests__/screens-smoke.test.tsx` mocks `@clerk/expo` (signed-in stub) because
ProfileScreen consumes `useAuth`/`useUser`. Home + Community stay Clerk-free and
must still render without that context.
**Why:** the app was flipped from anonymous/guest to invite-only Clerk gating;
the old "profile is Clerk-free" assertions were obsolete and removed.

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

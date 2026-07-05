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

## `@types/react` must be root-hoisted or `tsc` breaks with fake JSX errors
`tsc --noEmit` for this app WILL report dozens of bogus errors like
`'LinearGradient' cannot be used as a JSX component` / `'BlurView' ...` /
`GestureHandlerRootView` children UNLESS `@types/react` (and `@types/react-dom`)
are hoisted to the repo-root `node_modules` via `public-hoist-pattern[]` in
`.npmrc`.

**Why:** pnpm's default strict node_modules does not make `@types/react`
resolvable to transitive class-component libs that don't declare it as a peer
(expo-linear-gradient, expo-blur, gesture-handler), so their `Component` base
resolves without props/state. It is NOT a version conflict — `pnpm why
@types/react` is a single 19.1.17 — and Metro/Babel ignore it entirely. The
`public-hoist-pattern` places one copy at root where those libs resolve it.
**How to apply:** keep the two `public-hoist-pattern[]=@types/react*` lines in
`.npmrc`. If those bogus JSX errors reappear, the hoist was lost — re-add the
pattern and reinstall (with `CI=true` so pnpm can rewrite node_modules). Hoisting
a single already-single version does NOT reintroduce the mockup-sandbox "two
different types" error (that one is about two DIFFERENT versions). `tsc` is now a
real gate; treat new JSX-component errors as genuine.

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

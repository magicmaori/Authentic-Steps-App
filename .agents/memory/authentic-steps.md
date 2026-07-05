---
name: Authentic Steps app quirks
description: Non-obvious gotchas for the artifacts/authentic-steps Expo app — config file resolution, @types/react hoisting, and jest full-suite exit-code root causes (post-teardown act noise + Clerk MessagePort hang).
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

## jest full-suite exit code (root-caused + fixed)
`pnpm --filter @workspace/authentic-steps test` could print all tests passing
yet still exit non-zero. There were TWO independent causes; the earlier
attribution to `BreathingTimer.test.tsx` / `ritual-save-failure.test.tsx` was
WRONG (both are clean in isolation).

Cause 1 — post-teardown console noise crashing the worker ("Cannot log after
tests are done"). It only surfaced when suites share a worker (parallel worker
reuse; deterministically reproducible with `--runInBand`), so single-suite runs
looked clean. Two sources:
  - Real `@expo/vector-icons` async font load → setState after teardown →
    "not wrapped in act". Fixed globally by `jest.setup.js` (a Proxy that stubs
    every icon family as a sync `Text`, testID `icon-<name>`), wired via
    `setupFilesAfterEnv` in `jest.config.js`.
  - "overlapping act()" from the pattern
    `await act(async () => { create(<Screen/>); await flushPromises(); })` when
    `flushPromises` uses a **macrotask** (`setImmediate`). The macrotask boundary
    inside act lets React 19's async-act flush loop interleave. Fix: make
    `flushPromises` a **microtask** (`return Promise.resolve()`) in the
    render-then-flush smoke suites (screens-smoke, screens-corrupted-data).
    Do NOT change `AppContext.test.tsx`'s flushPromises — it tests real async and
    needs the macrotask.

Cause 2 — the worker HANGS after tests finish (open handle), so it never exits.
`app/(tabs)/profile.tsx` imports `@clerk/expo` → `@clerk/clerk-js`, which opens a
persistent **MessagePort** at module load. Any suite that imports a screen
pulling in `@clerk/expo` without mocking it (was `pdf-export-empty-data`) keeps
the process alive. Fix: `jest.mock('@clerk/expo', …)` with signed-in stubs.
**How to apply:** every suite that imports a Clerk-consuming screen MUST mock
`@clerk/expo`. When adding render-then-flush smoke tests, use a microtask
flushPromises. screens-corrupted-data also uses suite-level fake timers
(outermost `beforeEach useFakeTimers` / `afterEach clearAllTimers+useRealTimers`)
so CompleteScreen's fire-and-forget mount `Animated.spring/timing` never leaks a
real timer past teardown.

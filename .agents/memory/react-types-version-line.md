---
name: React types version line pinned to 19.1.x
description: Why @types/react is pinned to the 19.1.x line workspace-wide and must not be bumped to 19.2.
---

# @types/react is pinned to the 19.1.x line workspace-wide

The web catalog `@types/react` / `@types/react-dom` pins live in `pnpm-workspace.yaml`
and are aligned **down** to the `~19.1.x` line, plus a matching `overrides` entry that
forces a single copy across the whole tree.

**Why:** The Expo mobile app (`authentic-steps`) pins `@types/react: ~19.1.10` because
Expo SDK 54 / React Native 0.81 type defs target the 19.1.x line, and the runtime is
pinned to `react@19.1.0`. When the web catalog was on `^19.2.0`, two `@types/react`
copies (19.1.x + 19.2.x) both became visible to the mockup-sandbox typecheck (the 19.1.x
copy leaks in via shared transitive deps like Radix / vaul / react-day-picker), and TS
reported "Two different types with this name exist, but they are unrelated" in
`calendar.tsx` / `spinner.tsx`. Pushing Expo UP to 19.2 is the risky direction — Expo's
own types are written for 19.1.x.

**How to apply:** Keep the web `@types/react` catalog and override on the same `~19.1.x`
line as Expo. Do not bump to 19.2 unless Expo + the `react` runtime move up together.
After changing these pins, reinstall and confirm `pnpm why @types/react` resolves a single
version before typechecking. pnpm may leave an orphaned virtual-store dir
(`node_modules/.pnpm/@types+react@<old>`) that isn't in the lockfile — the lockfile is the
source of truth; delete the stray dir if you want the store fully tidy.

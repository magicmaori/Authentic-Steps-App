---
name: Screenshot mode for Authentic Steps store assets
description: How demo/screenshot mode is wired for App Store/Play Store screenshot generation, and the .env pitfall to avoid.
---

`EXPO_PUBLIC_SCREENSHOT_MODE=1` drives a demo mode (`constants/screenshotSeed.ts` + `AppContext`/`EntitlementContext`) that seeds a realistic user/entries/exercises and bypasses the entitlement gate, so store screenshots show populated screens instead of the real Clerk sign-in gate or empty states.

**Why:** store screenshots must show real-looking data, not lorem/empty/dev states, but the app is otherwise closed/invite-only behind Clerk — there's no other way to reach populated screens without a real invited account.

**Gotcha:** do not leave this flag set via `artifacts/authentic-steps/.env` after capturing screenshots — an `.env` file silently re-enables screenshot mode (bypassing real auth) on every future workflow restart, which is easy to miss since it doesn't show up in `package.json`. Always grep for a stray `.env` there and delete it once screenshots are captured; verify by screenshotting `/(tabs)` and confirming the real Clerk sign-in screen appears.

**How to apply:** when regenerating store screenshots, temporarily set the env var (workflow env or a scratch `.env`), capture, then explicitly remove it and confirm normal auth is restored before finishing.

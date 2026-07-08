---
name: EAS cloud builds don't inherit Replit env vars
description: Why EAS/Expo cloud builds crash on launch even though the dev workflow works fine, and how to source the live Clerk publishable key for them.
---

EAS builds run on Expo's own cloud infra, not inside the Replit container. Any `process.env.*` value that the dev workflow injects at `expo start` time (e.g. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN`) is simply undefined during an EAS build unless it's also registered as an EAS project environment variable (`eas env:create --environment <preview|production> ...`).

**Why it matters:** if app code does a non-null assertion on one of these (e.g. Clerk's `publishableKey!`), the built app crashes immediately on launch ("X keeps stopping") with no useful error — it's not a build failure, so it won't show up in the EAS build logs at all, only at runtime on-device.

**How to apply:** before/after any first EAS build, run `eas env:list --environment preview` (and `production`) from the app dir to check what's configured. At minimum an Expo/Clerk app usually needs `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_DOMAIN` (the latter feeds `setBaseUrl` for API calls) registered for every environment used by a build profile.

**Sourcing the live Clerk key for Replit-managed Clerk:** the live `pk_live_...` key is auto-swapped in only during Replit's own publish pipeline for the web app — it is not exposed as a readable secret in the dev workspace (no `PROD_CLERK_PUBLISHABLE_KEY` exists, only `PROD_CLERK_SECRET_KEY`, which is truly sensitive and must stay untouched). Since publishable keys are meant to be public, extract it safely from the already-published web bundle instead of guessing: `curl` the deployed site's index.html, find the built JS asset, then `grep -o 'pk_live_[A-Za-z0-9]*'` on it. This is not a secret leak — the key ships to every browser already.

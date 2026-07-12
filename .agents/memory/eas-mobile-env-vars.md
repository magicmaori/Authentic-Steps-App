---
name: EAS cloud builds don't inherit Replit env vars
description: Why EAS/Expo cloud builds hang on Clerk loading even when the key is set, and how to configure all required env vars for the production EAS environment.
---

EAS builds run on Expo's own cloud infra, not inside the Replit container. Any `process.env.*` value that the dev workflow injects at `expo start` time is simply undefined during an EAS build unless it's also registered as an EAS project environment variable (`eas env:create --environment <env> ...`).

**EAS environment resolution for build profiles:** When a build profile in `eas.json` does not have an explicit `"environment"` key, EAS defaults to the **production** EAS environment — even for a profile named `preview`. The EAS "environment" (development / preview / production) is separate from the build profile name. Always check `eas env:list --environment production` to confirm what a non-development build will load.

**Required env vars for the `preview` Android APK build (all in production EAS environment):**

| Var | Value |
|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsuYXV0aGVudGljLXN0ZXBzLXlvdXRoLnJlcGxpdC5hcHAk` |
| `EXPO_PUBLIC_DOMAIN` | `authentic-steps-youth.replit.app` |
| `EXPO_PUBLIC_CLERK_PROXY_URL` | `https://authentic-steps-youth.replit.app/api/__clerk` |

**Why the proxy URL is critical:** The publishable key `pk_live_Y2xlcm...` is a proxy-format key — it base64-decodes to `clerk.authentic-steps-youth.replit.app$` (note the trailing `$`). For `@clerk/expo` in a native mobile app, a proxy-format key REQUIRES the `proxyUrl` prop on `<ClerkProvider>` or Clerk hangs indefinitely on `<ClerkLoading>`. Without it, the SDK cannot determine where to send auth requests. The proxy is at `/api/__clerk` on the API server (returns 200 from production), and the ClerkProvider prop `proxyUrl={clerkProxyUrl}` wires it in.

**Sourcing the live Clerk key:** The `pk_live_` key is auto-swapped in by Replit's publish pipeline and is NOT directly readable as a workspace secret. Extracting via `grep -o 'pk_live_[A-Za-z0-9]*'` from the deployed web bundle does NOT work — all matches are Clerk SDK validation code, not the actual key. Instead, check `pnpm exec eas env:list --environment production` — the key was set in a previous session and persists in EAS.

**autoIncrement + git block:** `autoIncrement: true` in `eas.json` causes the EAS CLI to git-commit the incremented build number, which is blocked in the main agent. Workaround: manually bump `versionCode` in `app.json`, temporarily set `autoIncrement: false` in the build profile, run the build with `--no-wait`, then restore `autoIncrement: true`.

**How to apply:** before any EAS build, run `eas env:list --environment production` to confirm all three vars above are present. If adding a new var: `eas env:create --environment production --name EXPO_PUBLIC_... --value "..." --visibility plaintext`.

# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/api-server run smoke` — end-to-end smoke test of the agency-admin path (bootstrap → sign in → create sub-account → invite → redeem → renew → revoke) against **real Clerk test sessions**. Self-contained (boots the API in-process, no workflow needed), prints a numbered pass/fail per step, and deletes everything it creates. Requires a Clerk *test* instance (`sk_test`/`pk_test`) — it refuses to run against live keys. Complements `access-flows.test.ts`, which covers the same routes but mocks Clerk.
- `pnpm run typecheck` — full typecheck across all packages. Registered as the **`typecheck` validation check** (a real CI-style gate): it runs `tsc --build` for the libs then `tsc --noEmit` for every artifact/script, including the mobile app. Type regressions (e.g. a stray `@types/react` mismatch) fail this gate instead of silently reappearing. Its reliability depends on the `@types/react`/`@types/react-dom` hoist in `.npmrc` — do not remove those `public-hoist-pattern` lines.
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run bootstrap-agency "<Agency Name>" <admin-email>` — provision the first agency + its agency admin (the admin must have signed into Clerk at least once). Idempotent by (agency name, admin): re-running the same command is a safe no-op.
- `pnpm --filter @workspace/scripts run manage-admin <list|add|replace> "<Agency Name>|<agency-id>" [admin-email]` — manage admins on an **existing** agency (bootstrap-agency only creates new ones). `list` shows current active admins; `add` grants a co-admin (keeps existing ones); `replace` hands the agency off — makes `<admin-email>` the admin and revokes every other active admin. The target must have signed into Clerk at least once. Safe to re-run (idempotent upsert against the DB's uniqueness rules).
- Required env: `DATABASE_URL` — Postgres connection string; `CLERK_SECRET_KEY` — for bootstrap/user lookup

## Invite emails

Invites can carry an optional invitee email. When set, the API emails the redeem link automatically on creation and exposes a re-send action (`POST /invites/:id/resend`). Delivery uses the **Resend** connector (credentials fetched from the Replit connector proxy at runtime — no manual API key). Relevant optional env:

- `INVITE_EMAIL_FROM` — the From header (default `Authentic Steps <onboarding@resend.dev>`). To send to arbitrary recipients you must verify a sending domain in Resend and set this to an address on it; the default `onboarding@resend.dev` only reaches the Resend account owner.
- `DASHBOARD_URL` — full base URL of the dashboard used to build redeem links (e.g. `https://your-app.example.com/dashboard`). If unset, it is derived from `REPLIT_DOMAINS`/`REPLIT_DEV_DOMAIN` + `DASHBOARD_BASE_PATH` (default `/dashboard`).
- `MOBILE_APP_URL` — optional override for the mobile app's public entry URL used in member invite links (see below). If unset, it's derived the same way as `DASHBOARD_URL` but pointed at the root of the domain instead of `/dashboard`.

Email delivery is best-effort on create: a send failure never blocks invite creation — the invite is still valid and `emailSentAt` stays null so the dashboard shows "Not sent" with a Send/Resend button.

**Invite links are role-aware.** `member` invites (both the emailed link and the dashboard's "Copy Link" button) point at the mobile app's root URL (`https://<domain>/?code=<code>`) instead of the dashboard, since members' product surface is the Authentic Steps app, not the web dashboard. `agency_admin`/`sub_account_holder` invites still point at `/dashboard/redeem?code=<code>` — see `buildInviteUrl` in `artifacts/api-server/src/lib/email.ts` (backend) and `copyLink` in `artifacts/agency-dashboard/src/pages/invites.tsx` (frontend), which must stay in sync. The mobile app's landing page (served when Expo Go isn't installed) reads `?code=` from the URL and pre-fills it into an `exps://.../--/redeem?code=...` deep link; the app itself (`app/_layout.tsx` + `utils/pendingInvite.ts`) captures that code across the forced sign-in redirect and pre-fills it on the redeem screen. If a member ends up on the web dashboard anyway, the "Your Access" overview page shows a card pointing them to the mobile app instead of dashboard actions.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

The backend is a closed, invite-only, multi-tenant access system (agencies → sub-account holders → members) on Clerk auth. There is no self-serve "become an admin" path by design — the very first agency admin for each agency is provisioned by an operator via the `bootstrap-agency` script. Once bootstrapped, that admin can create sub-accounts, issue invites, and renew/revoke members.

Management happens through the **agency dashboard** web app (`artifacts/agency-dashboard`, served at `/dashboard/`) as well as directly via the API. The dashboard lets an agency admin create sub-accounts and issue/copy/revoke invites; sub-account holders manage their members (invite, renew, revoke); invitees redeem invite links to gain access. Brand-new agencies see friendly first-run empty states with clear calls-to-action on each list page.

**Going live:** the dashboard uses Replit-managed Clerk, so production (`pk_live`) keys are swapped in automatically on publish — no manual key setup. After publishing, provision the real first agency admin against the **production** database by running the `bootstrap-agency` script with production `DATABASE_URL` / `CLERK_SECRET_KEY` (the admin must have signed into the live app once first).

## Mobile builds (iOS & Android via EAS)

Web publishing stays on Replit's standard deployment flow. iOS and Android app builds use **EAS Build** directly — not Replit's built-in Expo Launch flow, which conflicts with manually-managed Apple credentials and doesn't support Android.

### Prerequisites (must be done once before any build can run)

| Secret / credential | Where to set it | Notes |
|---|---|---|
| `EXPO_TOKEN` | Shell env or CI secret | Personal/team token from expo.dev → Account Settings → Access Tokens |
| Apple App Store Connect API key | Uploaded interactively via `eas credentials` or pre-stored at `~/.eas/credentials.json` | Requires an App Store Connect API key with App Manager role |
| `eas.json` → `submit.production.ios.ascAppId` | `artifacts/authentic-steps/eas.json` | Replace `REPLACE_WITH_ASC_APP_ID` with the numeric App Store Connect app ID |
| `eas.json` → `submit.production.ios.appleTeamId` | `artifacts/authentic-steps/eas.json` | Replace `REPLACE_WITH_APPLE_TEAM_ID` with the 10-character Apple Team ID |
| `google-play-service-account.json` | Place at `artifacts/authentic-steps/google-play-service-account.json` (gitignored) | Google Play service account JSON with "Release Manager" role on the app. Required only for `eas-submit-android`. |

Running a build/submit script without `EXPO_TOKEN` set will fail immediately with an auth error from the EAS CLI — not a silent hang.

### iOS build & release commands

Run from `artifacts/authentic-steps/` or prefix with `pnpm --filter @workspace/authentic-steps run`:

```sh
# Build production IPA for App Store (uses manually-managed Apple credentials)
pnpm --filter @workspace/authentic-steps run eas-build-ios

# Build internal distribution IPA for TestFlight invite without store review
pnpm --filter @workspace/authentic-steps run eas-build-ios-preview

# Submit the latest production build to App Store Connect
pnpm --filter @workspace/authentic-steps run eas-submit-ios
```

### Android build & distribution commands

Two viable distribution paths — pick based on what you need:

**Option A — Google Play internal testing track (recommended for beta)**
Upload an AAB to Play Console's internal testing track. Testers install via the Play Store link. No sideloading, works on any Android device including those with restricted installs.

```sh
# Build production AAB for Play Console
pnpm --filter @workspace/authentic-steps run eas-build-android

# Submit the latest AAB to Play Console internal track (requires google-play-service-account.json)
pnpm --filter @workspace/authentic-steps run eas-submit-android
```

**Option B — Direct APK sideload (fastest for small tester groups)**
Build an APK and share it directly (e.g. via email or download link). Testers must enable "Install unknown apps" on their device. No Play Console account or review required, but Android 13+ may warn users during install.

```sh
# Build a directly-installable APK (preview profile)
pnpm --filter @workspace/authentic-steps run eas-build-android-apk
```

The EAS build dashboard at [expo.dev](https://expo.dev) shows build status, logs, and artifact download links for all builds.

### Build profiles summary (`artifacts/authentic-steps/eas.json`)

| Profile | iOS output | Android output | Distribution |
|---|---|---|---|
| `development` | IPA (device) | APK | Internal (dev client) |
| `preview` | IPA | APK | Internal (TestFlight / sideload) |
| `preview-aab` | IPA | AAB | Internal (Play internal track) |
| `production` | IPA | AAB | App Store / Play Store |

## User preferences

- Mobile distribution: wants both iOS (TestFlight pilot, then App Store) and Android testers. EAS build workflow documented above covers both paths.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

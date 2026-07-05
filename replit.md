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

Email delivery is best-effort on create: a send failure never blocks invite creation — the invite is still valid and `emailSentAt` stays null so the dashboard shows "Not sent" with a Send/Resend button.

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

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

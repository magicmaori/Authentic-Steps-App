# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run bootstrap-agency "<Agency Name>" <admin-email>` — provision the first agency + its agency admin (the admin must have signed into Clerk at least once). Idempotent by (agency name, admin): re-running the same command is a safe no-op.
- Required env: `DATABASE_URL` — Postgres connection string; `CLERK_SECRET_KEY` — for bootstrap/user lookup

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

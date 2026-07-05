---
name: Auth architecture (closed access)
description: How Authentic Steps does auth now — backend is Clerk-gated closed access; the mobile app's Expo Go constraint; the server-authoritative entitlement invariant.
---

# Auth architecture — closed, invite-only access

## Current state (supersedes the old "Clerk removed / guest-only" note)
The **backend** (`artifacts/api-server`) is now a fully-closed, invite-only,
time-limited multi-tenant system using **`@clerk/express`** (NOT `@clerk/expo`).
Hierarchy: agencies → sub-account holders → members. Access requires a valid
Clerk login AND an active, unexpired membership (a redeemed invite). There is
NO in-app payment; agencies are bootstrapped via `scripts/src/bootstrap-agency.ts`.
There is intentionally NO self-serve "become an admin" endpoint — a self-serve
admin path would break the closed-access guarantee, so the first admin is always
operator-provisioned. The bootstrap script is idempotent by (agency name, admin):
re-running the same command is a no-op; a second distinct agency for the same
admin requires a different name (the `memberships_user_agency_admin_uq` index
already forbids two admin rows for the same (user, agency)).

## Invariant: closure is server-authoritative, not client-side
Any route that serves or mutates **user data** must gate on an active
entitlement, not merely on being logged in. Use the middleware chain
`requireAuth, loadActor, requireEntitlement` (see
`artifacts/api-server/src/middlewares/auth.ts`). `requireAuth` alone only proves
a Clerk sign-up exists — a brand-new account with zero memberships would still
get in. This exact gap was found on `/sync` in review and fixed.

**Why:** the product guarantee is "fully closed." A login-only gate silently
leaks app data to any self-service Clerk signup.
**How to apply:** when adding a new user-data endpoint, wire all three
middlewares. `requireEntitlement` returns 403 with `reason`
(none/expired/revoked) so the client can message correctly.

## Keep pure authz logic runtime-isolated so it stays unit-testable
`artifacts/api-server/src/lib/access.ts` (computeEntitlement, extendExpiry, role
helpers) imports `@workspace/db` and `../middlewares/auth` with **`import type`
only**. Those are erased at runtime, so `access.ts` pulls in no DB/Clerk at
import and needs no `DATABASE_URL`. That is what lets `access.test.ts` (vitest)
run standalone. Preserve this: do not add value imports of `@workspace/db` or
`db` into `access.ts`, or the unit tests will require a live database.

## Renewal / entitlement rules worth remembering
- `extendExpiry` extends from **max(now, current expiry)** — early renewals never
  discard remaining time.
- `computeEntitlement` reason priority is active > expired > revoked > none.
- Invite redemption is atomic: a RETURNING-guarded
  `UPDATE ... WHERE status='pending'` inside a transaction, so concurrent
  redeemers serialize and the invite cannot be double-claimed.

## Mobile app: Expo Go constraint still applies
The **mobile** app (`artifacts/authentic-steps`) has NOT been wired to send
Clerk tokens yet — it still runs in guest/AsyncStorage mode. When integrating
auth on mobile, remember `@clerk/expo` needs a native module absent from Expo
Go (it caused a permanent blank screen before: `<ClerkLoaded>` never fired).
Use a development build, or a token flow compatible with Expo Go, rather than
assuming `@clerk/expo` works under Expo Go.

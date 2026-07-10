---
name: Auth architecture (open access)
description: How Authentic Steps does auth now — open sign-up, Clerk-only, no invite/membership model.
---

# Auth architecture — open sign-up

## Current state (as of the open-access pivot)
The app uses **Clerk** for auth (mobile: `@clerk/expo`, server: `@clerk/express`). Anyone can
create a Clerk account and immediately use the full app. There is no membership/invite system,
no agency hierarchy, and no entitlement check. **Signed in = full access.**

The former agency/invite/membership model (agencies → sub-accounts → members, invite redemption,
entitlement guards) has been entirely removed from the codebase:
- DB tables dropped: `agencies`, `sub_accounts`, `memberships`, `invites`
- API routes removed: `/me`, `/me/entitlement`, `/sub-accounts`, `/invites`, `/members`
- Middleware removed: `loadActor`, `requireEntitlement` (only `requireAuth` remains)
- Mobile: `EntitlementContext`, `redeem.tsx`, `locked.tsx`, `pendingInvite.ts` all deleted
- Agency dashboard artifact deleted entirely

## Access gate (mobile `_layout.tsx`)
- `AuthTokenSync` (component inside `<ClerkLoaded>`) attaches the Clerk bearer token to every
  generated API request via `setAuthTokenGetter`.
- `AccessGate` uses `useAuth()` — if `!isSignedIn`, redirects to `/(auth)/sign-in` unless
  already on a sign-in/sign-up screen; if signed in and in `(auth)`, redirects to `/(tabs)`.
- `OnboardingGate` checks `isSignedIn` (not entitlement state) before redirecting to onboarding.

## Server middleware (auth.ts)
Only `requireAuth` remains. It reads the Clerk session via `getAuth(req)` and populates
`req.userId`. No `actor`, no memberships, no DB query on every request.

**Why:** the product guarantee changed from "closed invite-only" to "open sign-up." All the
entitlement machinery was net-negative complexity for the new model.

**How to apply:** any new user-data endpoint only needs `requireAuth` middleware.

## Mobile Expo Go constraint
`@clerk/expo` works in Expo Go when `<ClerkLoaded>` is used correctly. The `AuthTokenSync`
component must be inside `<ClerkLoaded>` (not `<ClerkProvider>` directly) or `useAuth()` will
throw before Clerk is initialized.

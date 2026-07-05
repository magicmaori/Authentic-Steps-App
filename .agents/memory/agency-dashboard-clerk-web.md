---
name: Agency dashboard Clerk web SDK quirks
description: How @clerk/react (web) auth-state gating works in artifacts/agency-dashboard — no SignedIn/SignedOut components.
---

# Agency dashboard (artifacts/agency-dashboard) Clerk web wiring

## @clerk/react has NO SignedIn / SignedOut / RedirectToSignIn-as-you-expect
The web Clerk SDK (`@clerk/react`, v6.x) does NOT export `SignedIn` or
`SignedOut`. Use `<Show when="signed-in">` / `<Show when="signed-out">` for
conditional auth-state rendering. `RedirectToSignIn`, `SignInButton`, `Show`,
`useClerk`, `useUser` DO exist.
**Why:** the design subagent scaffolded with `SignedIn`/`SignedOut` (from
`@clerk/nextjs` habit) and typecheck failed. `Show` is the web equivalent.
**How to apply:** any auth-gated UI here uses `Show`. Protected routes wrap a
component in `<Show when="signed-in">…</Show>` + `<Show when="signed-out"><RedirectToSignIn/></Show>`.

## Web auth is COOKIE-based — no token plumbing
Do NOT add `getToken`/Bearer/`setAuthTokenGetter`. Generated hook URLs already
include the `/api` prefix and the browser sends the Clerk session cookie
automatically through the shared proxy.

## Appearance uses `theme`, not `baseTheme`
`ClerkProvider appearance={{ theme: dark }}` (import `dark` from
`@clerk/themes`). `baseTheme` is not a valid key in this SDK's Appearance type.

## Redeem page is a PUBLIC route (not behind ProtectedRoute)
The invitee redeem link (`/redeem?code=...`) must be reachable while signed out.
The page itself renders a `Show when="signed-out"` sign-in prompt (SignInButton
with `forceRedirectUrl`/`signUpForceRedirectUrl` preserving the code) and a
`Show when="signed-in"` redeem form. Redeeming binds the invite to the
authenticated user, so auth is still required to actually redeem.

## Role-gating source of truth
Active role = `me.memberships.find(m => m.status === "active")?.role` from
`useGetMe()`. Enum values: `agency_admin` sees all nav; `sub_account_holder`
sees Members + Invites; `member` sees Overview only. Matches server RBAC and the
generated `MembershipRole`/`MembershipStatus` enums.

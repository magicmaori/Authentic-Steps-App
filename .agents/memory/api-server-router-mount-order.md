---
name: api-server route mount order footgun
description: Why route ordering in artifacts/api-server/src/routes/index.ts matters, and how to add a new public route safely
---

Several routers in `artifacts/api-server/src/routes/` (e.g. `me.ts`, `sub-accounts.ts`,
`invites.ts`, `members.ts`) call `router.use(requireAuth, loadActor)` with **no path
argument**. Since each of these routers is itself mounted at `/` in
`routes/index.ts` (`router.use(meRouter)`, no prefix), that unscoped `requireAuth`
runs for **every request that reaches that router**, not just the paths it actually
owns — and it terminates the response with 401 before Express ever checks whether a
specific route matches.

**Why:** a new unauthenticated/public router (e.g. static asset serving) mounted
*after* these routers in `index.ts` never gets a chance to run — it 401s at the
first authed router in the list, even though none of that router's own paths match.

**How to apply:** any new route that must be reachable without `requireAuth` (public
asset serving, webhooks, etc.) must be mounted in `index.ts` **before** `meRouter`
and the other auth-gated routers. `healthRouter` and `syncRouter` (`syncRouter` scopes
its auth with an explicit `"/sync"` prefix) are the only routers currently safe to
sit before or after arbitrary new routers.

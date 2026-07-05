---
name: Agency dashboard component testing
description: How the agency-dashboard web app runs Vitest + RTL component tests (role-gating regression guard), and the jsdom/lib-declaration gotchas.
---

# Agency dashboard (artifacts/agency-dashboard) component testing

The dashboard uses **Vitest + React Testing Library** (jsdom) with a standalone
`vitest.config.ts` — NOT `vite.config.ts`, because the app's `vite.config.ts`
throws unless `PORT`/`BASE_PATH` are set. `pnpm --filter @workspace/agency-dashboard run test`.

## Mocking the API client
Tests mock hooks from `@workspace/api-client-react` with
`vi.mock(..., async (importOriginal) => ({ ...actual, useGetMe: vi.fn(), ... }))`
so real exports (types, `getListInvitesQueryKey`) stay intact while only the
React Query hooks are stubbed. Role gating is driven entirely by
`getActiveRole(me.memberships)`, so a mocked `useGetMe` return is enough to
exercise nav gating, `RoleGate`, and the Invites program-scoped dialog.

## jsdom gotchas (in src/test/setup.ts)
Radix Select/Dialog need `scrollIntoView`, `hasPointerCapture`,
`releasePointerCapture`, `setPointerCapture` — jsdom lacks them; the setup file
stubs them or the dialog/select never open. A component that renders the Invites
page also needs a real `QueryClientProvider` (it calls `useQueryClient`), and
any component using wouter `Link`/`Redirect` needs a `<Router>` (use
`wouter/memory-location`'s `memoryLocation` to seed/observe the path).

## Stale lib declarations bite the leaf typecheck
**Why:** `@workspace/api-client-react` is a composite lib that emits `.d.ts`.
After codegen changes, the dashboard's `tsc --noEmit` can report bogus
"no exported member `useResendInvite`" / "Property `email` does not exist on
Invite" errors against `invites.tsx`.
**How to apply:** run `pnpm run typecheck:libs` (root, `tsc --build`) FIRST to
rebuild lib declarations, then the leaf typecheck passes. Don't "fix" the app
code for these — they're stale-declaration artifacts.

## CI wiring
Validation commands `typecheck` (`pnpm run typecheck`) and `test`
(`pnpm --filter @workspace/agency-dashboard run test`) are registered so a
role-gating regression fails validation.

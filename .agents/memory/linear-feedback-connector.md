---
name: Linear connector as lightweight issue tracker backend
description: Using the Linear connector's GraphQL proxy to file structured records (e.g. user feedback) as issues, without a new DB table.
---

When a feature needs a "structured triage queue" (e.g. user-submitted bug reports) and a
healthy Linear connection already exists, filing records as Linear issues via the connector
proxy is a valid lightweight alternative to adding a new DB table + custom triage UI — it
gets a real queue, statuses, and assignment for free.

**How to apply:** use `connectors.proxy("linear", "/graphql", { method: "POST", body: JSON.stringify({ query, variables }) })`
from `@replit/connectors-sdk` (`ReplitConnectors`) — no manual API key. Cache the resolved
team id after the first `teams { nodes { id key name } }` query rather than re-querying per
request. Always make the write call (e.g. `issueCreate`) throw on any failure so the caller
can fall back to a non-structured path (e.g. mailto) instead of silently losing the report.

**Gotcha:** Orval does not always generate a Zod parser const for response-only/non-reused
OpenAPI schemas — it may only emit a TS `type`, not a `z.object(...)` you can `.parse()`
against. Check the generated file before assuming `.parse()` is available; building the
response object manually and typing it with the generated `type` is fine.

**Real-time nudge on issue creation:** don't rely on someone remembering to check the Linear
queue — after the issue-create call succeeds, fire an additional best-effort notification
(e.g. email via an existing transactional-email connector) so a human is nudged within
minutes. Never let the notification's own failure affect the already-successful issue
creation or the caller's response — fire it after responding, and only log a warning on
failure. Same Resend sandbox caveat as invite emails applies: the default
`onboarding@resend.dev` sender only reaches the Resend account's own verified email, so
verify a real recipient/domain before trusting delivery.

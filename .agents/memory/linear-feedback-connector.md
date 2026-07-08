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

---
name: Headless real Clerk session minting (for tests/scripts)
description: How to obtain a real, verifiable Clerk session JWT with no browser, for smoke tests against the unmocked API.
---

# Minting a real Clerk session token headlessly

Used by `artifacts/api-server/src/smoke/admin-flow.ts` to drive the real
(unmocked) API with genuine sessions, unlike `access-flows.test.ts` which mocks
`@clerk/express`.

**The 4-step dance (works on a `pk_test`/`sk_test` dev instance):**
1. Backend API (`api.clerk.com`, Bearer `CLERK_SECRET_KEY`): `POST /v1/sign_in_tokens {user_id}` → `{ token }`.
2. Frontend API `POST /v1/dev_browser` → dev-browser JWT. **Dev instances require this** — every later Frontend-API call must carry it as `?__clerk_db_jwt=<jwt>`.
3. Frontend API `POST /v1/client/sign_ins?__clerk_db_jwt=...` with form body `strategy=ticket&ticket=<sign_in_token>` → `response.created_session_id`.
4. Frontend API `POST /v1/client/sessions/<sid>/tokens?__clerk_db_jwt=...` → `{ jwt }`. Send that as `Authorization: Bearer <jwt>` to our API.

**Why / gotchas:**
- The Frontend API domain is `base64-decode(pk minus the pk_test_/pk_live_ prefix)` with the trailing `$` stripped — it is public, not a secret.
- Session tokens are ~60s-lived; a slow test must cache + re-mint (re-mint on any `401`).
- Clerk test users: use a `+clerk_test@…` email so no real mail is sent; delete them via `DELETE /v1/users/{id}` in a `finally`.
- The smoke script refuses to run against `pk_live`/`sk_live` so it can never create real users.
- The API verifies these tokens networklessly via JWKS using the configured secret + publishable key; hitting the app on `127.0.0.1` (no proxy host header) falls back to `CLERK_PUBLISHABLE_KEY`, which is correct.

---
name: Invite emails via Resend
description: How invite redeem links are emailed, credential resolution, and the graceful-degradation contract.
---

# Invite emails via Resend

Invite redeem links can be emailed automatically. Delivery lives in
`artifacts/api-server/src/lib/email.ts` and posts to the Resend REST API
(`https://api.resend.com/emails`) — no SDK.

## Credential resolution (order matters)
1. `RESEND_API_KEY` secret if present (operator-set, works without the connector).
2. Otherwise the Replit-managed Resend connector proxy (`REPLIT_CONNECTORS_HOSTNAME` + repl identity token).

**Why:** the connector requires a Resend account and an interactive connect flow;
some operators won't have/complete that. The secret fallback lets delivery work
without the connector.

## Graceful-degradation contract
Sending is **best-effort on invite create** — a send failure (including *no
credential configured*) must never block invite creation. On failure
`emailSentAt` stays null and the dashboard shows "Not sent" with a Send/Resend
button; admins can always copy the redeem link manually. Do not make invite
creation depend on email success.

## Gotcha
Default `INVITE_EMAIL_FROM` is `onboarding@resend.dev`, which only reaches the
Resend account owner until a sending domain is verified in Resend.

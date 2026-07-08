---
name: Planned swap to YouTube-hosted ritual videos
description: User intends to replace the app's self-hosted ritual/onboarding videos with YouTube links pending internal approval (John Rutter) — not yet implemented.
---

Status as of 2026-07-08: NOT YET IMPLEMENTED, pending business approval.

Context: the 5 ritual/onboarding videos (welcome, message-for-you, gratitude, intention,
I Am) currently stream as self-hosted .mp4 files from Object Storage via `expo-av`'s
`Video` component in `artifacts/authentic-steps/components/VideoPlaceholder.tsx` (URLs
built in `lib/videoSource.ts`).

The user wants to eventually point these at YouTube-hosted versions of the same videos
instead. Their team needs to review/approve the actual YouTube links in-house with John
Rutter first — no links exist yet, so no implementation work has started.

**Why this needs a real code change (not just a URL swap):** `expo-av`'s `Video` component
only plays direct video file URLs; it cannot play a `youtube.com/watch?v=...` link. Moving
to YouTube requires swapping in a YouTube-specific player (e.g. an embedded YouTube
iframe/player library) in `VideoPlaceholder.tsx`, which also changes the playback UX —
YouTube's own player chrome/branding replaces the current custom play button and
full-screen modal.

**How to apply:** when the user provides approved YouTube links, revisit
`VideoPlaceholder.tsx` and `lib/videoSource.ts` to add YouTube embed support (likely as an
alternate source type alongside the existing direct-URL streaming, since both patterns may
need to coexist during transition).

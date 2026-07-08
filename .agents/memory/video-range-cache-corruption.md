---
name: HTTP Range response caching corruption
description: Marking byte-range (206) video responses as publicly cacheable without strong validators can cause a cache to serve back a mismatched byte range for a different Range request to the same URL.
---

Serving HTTP 206 partial-content responses (e.g. video streaming via `Range` requests) with `Cache-Control: public, max-age=...` and no `ETag`/`Last-Modified` validator is unsafe: a browser or intermediary cache keyed on the URL alone can return a previously-cached response for a *different* `Range` header, since it has no way to tell the two apart. Symptom observed in practice: a request with `Range: bytes=7208960-` got back a response whose `Content-Range` started at `bytes 32768-...` — a completely different range, silently returned. This manifested as intermittent "video won't play" failures with no server-side error and no client console error, because the corrupted response and its own asserted `Content-Range` header were self-consistent (just wrong).

**Why:** HTTP range caching correctness depends on strong validators (`ETag`) and/or a cache that actually keys on the `Range` header value, not just the URL. `Cache-Control: public` alone provides no such guarantee.

**How to apply:** For endpoints serving byte-range content (video/audio streaming, chunked downloads) via `Range` requests: either (a) mark 206 responses `Cache-Control: no-store` so no cache retains them at all (safe default when each range read is cheap, e.g. backed by object storage), or (b) if caching partial responses is actually needed for performance, always attach a real `ETag`/`Last-Modified` from the source object's metadata so caches can validate before reuse. Prefer (a) unless you have a measured need for (b).

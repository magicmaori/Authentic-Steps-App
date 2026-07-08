---
name: Video/object-storage streaming needs HTTP Range support
description: Why a public object-storage streaming endpoint must forward and honor Range headers for mobile video playback.
---

An endpoint that streams large media (e.g. video) from object storage to a mobile player (expo-av / AVPlayer / ExoPlayer) must support HTTP Range requests (206 Partial Content + `Content-Range`/`Accept-Ranges`), not just a plain full-body 200 response.

**Why:** native video players issue range requests to seek and to re-buffer incrementally, especially after a network hiccup. Without 206 support, seeking/scrubbing silently misbehaves and recovery from partial reads on slow/lossy networks is unreliable — this class of bug won't show up in a plain `curl` smoke test or in mocked unit tests, only under real network conditions or careful manual Range-header testing.

**How to apply:** when adding/reviewing any "stream this file" endpoint, verify it parses an incoming `Range: bytes=...` header (including open-ended and suffix forms) and returns 206 with `Content-Range`/`Content-Length` for the requested slice, falling back to a full 200 when there's no/invalid range header. Test with `curl -H "Range: bytes=0-1023" ...` and a suffix range, not just a bare request.

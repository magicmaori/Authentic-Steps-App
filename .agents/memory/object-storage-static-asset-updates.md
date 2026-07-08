---
name: Updating static assets already in Object Storage
description: How to overwrite/add files under an existing public/ prefix in the app's Object Storage bucket without the presigned-upload web flow.
---

**Ritual video soundtracks specifically:** don't hand-roll a throwaway script for these —
`pnpm --filter @workspace/scripts run mix-video-audio` (see "Regenerating a video's
soundtrack" in replit.md) is now a permanent, repeatable script that mixes
generated music/voiceover into a silent video with ffmpeg and uploads straight to
`public/videos/<name>.mp4` via `--upload`. The generic one-off flow below is still the
right pattern for *other* static assets that don't have a dedicated script.

Some assets (e.g. the Authentic Steps ritual/onboarding videos) are pre-uploaded static
files served via `GET /api/storage/public-objects/<path>`, not user uploads. To replace
or add such a file directly (no browser, no presigned-URL flow):

1. Reuse the same GCS client auth pattern as `artifacts/api-server/src/lib/objectStorage.ts`
   (sidecar `external_account` credentials) in a throwaway `.mjs` script.
2. Run the script from **inside** the artifact package directory that already depends on
   `@google-cloud/storage` (e.g. `artifacts/api-server/`) so Node's ESM resolver can find
   the package — running it from the workspace root or `/tmp` fails with
   `ERR_MODULE_NOT_FOUND`. `tsx` isn't installed as a global bin either; if using a `.ts`
   script, top-level `await` fails under esbuild's default CJS transform — write plain
   `.mjs` with an async `main()` instead.
3. Use absolute paths for local source files — relative paths resolve against the script's
   cwd (the package dir), not the workspace root.
4. Upload with `bucket.upload(localPath, { destination: "public/<...>", metadata: { contentType } })`,
   targeting the same relative path under the bucket root that `PUBLIC_OBJECT_SEARCH_PATHS`
   already searches (see that env var for the bucket's public prefix).
5. Delete the throwaway script and any intermediate generated files afterward — no upload
   tooling should be committed for a one-off asset replacement.

**Why:** there's no admin UI/script for this in the repo (uploads are meant to happen via
the Object Storage tool pane), and the generic object-storage skill's presigned-URL flow is
for end-user uploads through the web app, not for agent-side static asset publishing.

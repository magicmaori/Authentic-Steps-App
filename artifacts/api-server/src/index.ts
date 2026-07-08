import app from "./app";
import { logger } from "./lib/logger";

/**
 * Video players (expo-av / AVPlayer / ExoPlayer) routinely abort in-flight
 * range requests mid-stream — seeking, switching to the next buffer-ahead
 * chunk, or closing the player — which is normal streaming behavior, not a
 * server error. When that happens while `@google-cloud/storage`'s
 * `retry-request`-backed read stream (used by the public object storage
 * route) has a retry in flight, its internal `duplexify` plumbing can
 * synchronously throw `ERR_STREAM_UNABLE_TO_PIPE` from inside an `emit()`
 * call while trying to pipe a late-arriving retry response into a stream
 * this server already destroyed. That throw happens on a different stack
 * than any `'error'` listener we can attach to our own wrapped streams, so
 * it surfaces here as an uncaught exception — and without this handler it
 * takes down the entire process (every other in-flight request too) over a
 * single client disconnecting from one video chunk request. This is a
 * narrowly-scoped guard for that specific, well-understood, harmless
 * failure mode; anything else is re-thrown so real bugs still crash loudly
 * instead of being silently swallowed.
 */
process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  if (err.code === "ERR_STREAM_UNABLE_TO_PIPE" || err.code === "ERR_STREAM_PREMATURE_CLOSE") {
    logger.warn(
      { err },
      "Ignored known-benign stream error (likely a client aborting a video/range request mid-stream)"
    );
    return;
  }

  logger.error({ err }, "Uncaught exception — exiting");
  process.exit(1);
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

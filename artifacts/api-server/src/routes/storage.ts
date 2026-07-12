import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets (e.g. onboarding/ritual videos) from
 * PUBLIC_OBJECT_SEARCH_PATHS. Unconditionally public — no auth/ACL checks.
 * Used so large media files can be streamed on demand instead of bundled
 * into the mobile app binary.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const found = await objectStorageService.searchPublicObject(filePath);
    if (!found) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Large binary downloads (APK builds etc.) are served via a GCS redirect
    // rather than proxied through Express. The production proxy kills
    // connections before a 96MB stream completes, so we make the file
    // publicly readable on GCS and redirect the client there directly.
    if (filePath.startsWith("builds/")) {
      try {
        const directUrl = await objectStorageService.getDirectDownloadUrl(found.file);
        res.redirect(302, directUrl);
        return;
      } catch (err) {
        req.log.warn({ err }, "getDirectDownloadUrl failed for builds/ file, falling back to proxy stream");
      }
    }

    const response = await objectStorageService.downloadObject(
      found.file,
      found.metadata,
      undefined,
      req.headers.range
    );

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);

      // Video players routinely abort in-flight range requests mid-stream
      // (e.g. seeking, switching to a new buffer-ahead chunk, or the user
      // closing the player) — this is normal streaming behavior, not a
      // server error. Without an explicit 'error' listener here, GCS's read
      // stream emitting an error on client disconnect (premature close /
      // ECONNRESET) would be an *unhandled* EventEmitter error, which
      // crashes the whole Node process instead of just failing this one
      // request. `pipe()` does not forward source errors to the
      // destination automatically, so this must be handled explicitly.
      nodeStream.on("error", (err) => {
        req.log.warn({ err }, "Public object stream ended early (likely client abort)");
        if (!res.writableEnded) res.destroy();
      });
      res.on("close", () => {
        if (!nodeStream.destroyed) nodeStream.destroy();
      });

      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

export default router;

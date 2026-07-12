import { Storage, File } from "@google-cloud/storage";
import type { FileMetadata } from "@google-cloud/storage";
import { Readable } from "stream";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// How long to trust a cached `{file, metadata}` lookup before re-checking
// GCS. Each lookup is a network round-trip (~0.5-1s in this environment),
// and a single video playback session can issue many range requests in
// quick succession (initial probe + incremental buffer-ahead chunks), so
// caching avoids paying that latency on every chunk. These are pre-uploaded,
// rarely-changed public assets, so a short TTL is safe and just bounds how
// stale a lookup can get after a real edit (e.g. re-uploading a video).
const METADATA_CACHE_TTL_MS = 60_000;

interface CachedLookup {
  file: File;
  metadata: FileMetadata;
  cachedAt: number;
}

/**
 * Only the public-asset-serving subset of the object storage service is
 * needed here — the app streams pre-uploaded videos, it doesn't accept
 * user uploads, so there's no upload-URL / private-object / ACL-writing
 * functionality in this trimmed-down copy of the object-storage template.
 */
export class ObjectStorageService {
  private readonly metadataCache = new Map<string, CachedLookup>();
  private readonly publicizedFiles = new Set<string>();

  constructor() {}

  /**
   * Makes a GCS object publicly readable (allUsers) and returns its public
   * URL. Idempotent — the allUsers binding is cached in-process so we only
   * hit the GCS IAM API once per server lifetime per file. Used for large
   * binary downloads (e.g. APK builds) so the client fetches directly from
   * GCS rather than being proxied through Express, avoiding production-proxy
   * timeouts on 50MB+ responses.
   */
  async makePublicAndGetUrl(file: File): Promise<string> {
    const key = `${file.bucket.name}/${file.name}`;
    if (!this.publicizedFiles.has(key)) {
      await file.makePublic();
      this.publicizedFiles.add(key);
    }
    return file.publicUrl();
  }

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  /**
   * Looks up a public object and returns both the `File` handle and its
   * metadata in one shot. Uses `getMetadata()` (not `exists()`) as the
   * existence check so `downloadObject` can reuse the same metadata instead
   * of re-fetching it — each of these calls is a network round-trip to GCS
   * (~0.5-1s in this environment), and video players issue many range
   * requests per playback (seeking, incremental buffering), so avoiding
   * duplicate round-trips per request matters for playback smoothness, not
   * just correctness.
   */
  async searchPublicObject(
    filePath: string
  ): Promise<{ file: File; metadata: FileMetadata } | null> {
    const cached = this.metadataCache.get(filePath);
    if (cached && Date.now() - cached.cachedAt < METADATA_CACHE_TTL_MS) {
      return { file: cached.file, metadata: cached.metadata };
    }

    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      try {
        const [metadata] = await file.getMetadata();
        this.metadataCache.set(filePath, { file, metadata, cachedAt: Date.now() });
        return { file, metadata };
      } catch (err) {
        const code = (err as { code?: number })?.code;
        if (code === 404) continue;
        throw err;
      }
    }

    return null;
  }

  /**
   * Streams the object, optionally honoring an HTTP `Range` header for
   * partial-content requests. Range support matters here specifically
   * because mobile video players (expo-av / AVPlayer / ExoPlayer) issue
   * range requests to seek and to buffer incrementally — without a 206
   * response, some players fail to seek or re-buffer cleanly after a
   * network hiccup.
   *
   * Takes `metadata` already fetched by `searchPublicObject` instead of
   * re-fetching it (or looking up an ACL policy) here: this route
   * (`GET /storage/public-objects/*`) is unconditionally public by design,
   * so there's no authorization decision to make from the ACL, and every
   * extra GCS round-trip directly adds latency to every single chunk a
   * video player requests during playback.
   */
  async downloadObject(
    file: File,
    metadata: FileMetadata,
    cacheTtlSec: number = 3600,
    rangeHeader?: string
  ): Promise<Response> {
    const totalSize = metadata.size ? Number(metadata.size) : undefined;
    const contentType = (metadata.contentType as string) || "application/octet-stream";
    const cacheControl = `public, max-age=${cacheTtlSec}`;
    // A generation-qualified ETag/Last-Modified so any cache that *does*
    // hold onto a response can at least validate it against this exact
    // object version instead of trusting a URL-only cache key blindly.
    const etag = metadata.etag ? `"${metadata.etag}"` : undefined;
    const lastModified = metadata.updated ? new Date(metadata.updated).toUTCString() : undefined;

    const range = totalSize !== undefined ? parseRangeHeader(rangeHeader, totalSize) : null;

    if (range) {
      const nodeStream = file.createReadStream({ start: range.start, end: range.end });
      attachStreamErrorGuard(nodeStream);
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;
      const headers: Record<string, string> = {
        "Content-Type": contentType,
        // Partial-content (206) responses must NOT be marked publicly
        // cacheable: a video player fires many range requests to the same
        // URL with different `Range` headers, and a shared/browser cache
        // keyed on the URL alone (without checking `Range`) can serve back
        // a completely mismatched byte range from an earlier request — this
        // was observed in practice (e.g. a `Range: bytes=7208960-` request
        // getting back a `Content-Range: bytes 32768-...` response) and was
        // the actual cause of intermittent playback failures. Each range
        // read is cheap here anyway (backed by the in-memory metadata cache
        // plus a direct GCS stream), so there's no benefit worth the risk.
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${range.start}-${range.end}/${totalSize}`,
        "Content-Length": String(range.end - range.start + 1),
      };
      if (etag) headers["ETag"] = etag;
      if (lastModified) headers["Last-Modified"] = lastModified;
      return new Response(webStream, { status: 206, headers });
    }

    const nodeStream = file.createReadStream();
    attachStreamErrorGuard(nodeStream);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "Accept-Ranges": "bytes",
    };
    if (totalSize !== undefined) {
      headers["Content-Length"] = String(totalSize);
    }
    if (etag) headers["ETag"] = etag;
    if (lastModified) headers["Last-Modified"] = lastModified;

    return new Response(webStream, { headers });
  }
}

/**
 * Video players routinely abort in-flight range requests mid-stream
 * (seeking, switching buffer-ahead chunks, closing the player) — normal
 * streaming behavior, not a server error. When that happens, `@google-cloud
 * /storage`'s underlying read stream (a `duplexify`-wrapped
 * `retry-request`) can emit an internal error — or, worse, its own retry
 * logic can synchronously throw `ERR_STREAM_UNABLE_TO_PIPE` while trying to
 * pipe a late-arriving retry response into a stream this route already
 * destroyed — and either one is an *unhandled* EventEmitter error that
 * crashes the entire Node process, taking down every other in-flight
 * request too, if nothing is listening for it. Node only suppresses that
 * crash-on-unhandled-error behavior once an `'error'` listener exists on
 * the stream, so one must be attached directly on this raw GCS stream
 * (before any `Readable.toWeb`/`fromWeb` wrapping, which can lose the
 * propagation) for every stream this service hands out.
 */
function attachStreamErrorGuard(stream: NodeJS.ReadableStream & { destroy?: () => void }): void {
  stream.on("error", () => {
    // Intentionally swallowed: the HTTP route layer (storage.ts) already
    // logs and cleans up the client-facing response when its own stream
    // errors or the connection closes. This listener exists solely to stop
    // Node from treating a client-abort-triggered error as an unhandled
    // exception that crashes the whole server.
  });
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

/**
 * Parses a single `Range: bytes=start-end` header into a clamped
 * {start, end} pair. Returns null for missing/unparseable/multi-range
 * headers (falls back to a full response), matching common server
 * behavior — video players never send multi-range requests.
 */
function parseRangeHeader(
  rangeHeader: string | undefined,
  totalSize: number
): { start: number; end: number } | null {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=") || rangeHeader.includes(",")) {
    return null;
  }

  const [startStr, endStr] = rangeHeader.slice("bytes=".length).split("-");
  let start = startStr ? parseInt(startStr, 10) : NaN;
  let end = endStr ? parseInt(endStr, 10) : NaN;

  if (Number.isNaN(start) && !Number.isNaN(end)) {
    start = totalSize - end;
    end = totalSize - 1;
  } else if (!Number.isNaN(start) && Number.isNaN(end)) {
    end = totalSize - 1;
  }

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end >= totalSize || start > end) {
    return null;
  }

  return { start, end };
}

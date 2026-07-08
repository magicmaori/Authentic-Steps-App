/**
 * On-device cache for the streamed ritual videos (see `videoSource.ts`).
 *
 * Videos stream from Object Storage rather than being bundled into the app,
 * but re-downloading the same clip every time a user reopens it wastes data
 * and adds a delay on every replay. This module caches each video the first
 * time it's watched (in the background, after playback has already started
 * from the network) so subsequent opens can play straight from disk.
 *
 * Caching is best-effort: any failure here (disk full, offline, etc.) is
 * swallowed so it never disrupts playback, which always falls back to
 * streaming the original remote URL.
 */
import { Directory, File, Paths } from "expo-file-system";

const CACHE_SUBDIR = "ritual-videos";

/**
 * The app only has a handful of short ritual/onboarding videos, so this cap
 * is generous headroom rather than a tight budget — it exists purely to
 * guard against unbounded growth (e.g. if video filenames ever change and
 * old ones are orphaned) rather than to constrain normal usage.
 */
const MAX_CACHE_BYTES = 150 * 1024 * 1024;

function getCacheDirectory(): Directory {
  const dir = new Directory(Paths.cache, CACHE_SUBDIR);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function cacheFilename(remoteUrl: string): string {
  const last = remoteUrl.split("/").pop() ?? "video.mp4";
  return last.split("?")[0] || "video.mp4";
}

/**
 * Returns a local `file://` URI for `remoteUrl` if it's already cached on
 * disk, or null if it hasn't been cached yet (caller should fall back to
 * streaming `remoteUrl` directly).
 */
export function getCachedVideoUri(remoteUrl: string): string | null {
  try {
    const file = new File(getCacheDirectory(), cacheFilename(remoteUrl));
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

function evictLeastRecentlyUsed(targetBytes: number): void {
  const dir = getCacheDirectory();
  const files = dir.list().filter((entry): entry is File => entry instanceof File);

  const withInfo = files.map((file) => {
    const info = file.info();
    return { file, size: info.size ?? 0, modificationTime: info.modificationTime ?? 0 };
  });

  let totalSize = withInfo.reduce((sum, entry) => sum + entry.size, 0);
  if (totalSize <= targetBytes) return;

  withInfo.sort((a, b) => a.modificationTime - b.modificationTime);

  for (const entry of withInfo) {
    if (totalSize <= targetBytes) break;
    try {
      entry.file.delete();
      totalSize -= entry.size;
    } catch {
      // Best-effort eviction — skip files we can't delete and keep going.
    }
  }
}

/**
 * Downloads `remoteUrl` into the on-device cache if it isn't already there,
 * then enforces the cache size limit. Safe to call every time a video is
 * opened — it's a no-op once the file is cached. Never throws.
 */
export async function cacheVideoInBackground(remoteUrl: string): Promise<void> {
  try {
    const destination = new File(getCacheDirectory(), cacheFilename(remoteUrl));
    if (destination.exists) return;

    await File.downloadFileAsync(remoteUrl, destination, { idempotent: true });
    evictLeastRecentlyUsed(MAX_CACHE_BYTES);
  } catch {
    // Caching is a nice-to-have; playback already streams from `remoteUrl`
    // regardless of whether this succeeds.
  }
}

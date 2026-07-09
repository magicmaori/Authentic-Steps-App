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
import * as Network from "expo-network";

const CACHE_SUBDIR = "ritual-videos";

/**
 * The app only has a handful of short ritual/onboarding videos, so this cap
 * is generous headroom rather than a tight budget — it exists purely to
 * guard against unbounded growth (e.g. if video filenames ever change and
 * old ones are orphaned) rather than to constrain normal usage.
 */
const MAX_CACHE_BYTES = 150 * 1024 * 1024;

/**
 * Returns the cache directory, creating it if needed.
 * Made async so `dir.create()` is properly awaited — on Android a fresh
 * install may not have the cache subdirectory yet, and the synchronous
 * `dir.exists` check + unawaited `dir.create()` race could allow subsequent
 * file operations to run before the directory actually exists.
 */
async function getCacheDirectory(): Promise<Directory> {
  const dir = new Directory(Paths.cache, CACHE_SUBDIR);
  if (!dir.exists) {
    await dir.create({ intermediates: true, idempotent: true });
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
 *
 * Made async because `getCacheDirectory()` is now async (it awaits
 * directory creation), and the entire body is wrapped in try/catch so a
 * Directory/File constructor throw on Android never propagates to the caller.
 */
export async function getCachedVideoUri(remoteUrl: string): Promise<string | null> {
  try {
    const dir = await getCacheDirectory();
    const file = new File(dir, cacheFilename(remoteUrl));
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

async function evictLeastRecentlyUsed(targetBytes: number): Promise<void> {
  try {
    const dir = await getCacheDirectory();
    const entries = await dir.list();
    const files = entries.filter((entry): entry is File => entry instanceof File);

    const withInfo = await Promise.all(
      files.map(async (file) => {
        try {
          const info = await file.info();
          return { file, size: info.size ?? 0, modificationTime: info.modificationTime ?? 0 };
        } catch {
          return { file, size: 0, modificationTime: 0 };
        }
      })
    );

    let totalSize = withInfo.reduce((sum, entry) => sum + entry.size, 0);
    if (totalSize <= targetBytes) return;

    withInfo.sort((a, b) => a.modificationTime - b.modificationTime);

    for (const entry of withInfo) {
      if (totalSize <= targetBytes) break;
      try {
        await entry.file.delete();
        totalSize -= entry.size;
      } catch {
        // Best-effort eviction — skip files we can't delete and keep going.
      }
    }
  } catch {
    // If eviction itself fails for any reason, swallow — it's not critical.
  }
}

/**
 * Downloads `remoteUrl` into the on-device cache if it isn't already there,
 * then enforces the cache size limit. Safe to call every time a video is
 * opened — it's a no-op once the file is cached. Never throws.
 */
export async function cacheVideoInBackground(remoteUrl: string): Promise<void> {
  try {
    const dir = await getCacheDirectory();
    const destination = new File(dir, cacheFilename(remoteUrl));
    if (destination.exists) return;

    await File.downloadFileAsync(remoteUrl, destination, { idempotent: true });
    await evictLeastRecentlyUsed(MAX_CACHE_BYTES);
  } catch {
    // Caching is a nice-to-have; playback already streams from `remoteUrl`
    // regardless of whether this succeeds.
  }
}

/**
 * Opportunistically pre-downloads every video in `remoteUrls` so the very
 * first watch is instant too, not just replays. Intended to be fired (and
 * forgotten) once on app launch — it never throws, never blocks the caller,
 * and only proceeds on Wi-Fi to avoid burning cellular data. Videos are
 * downloaded one at a time (rather than in parallel) to avoid saturating a
 * weak Wi-Fi connection right at app startup; already-cached videos are
 * skipped instantly by `cacheVideoInBackground`.
 */
export async function precacheVideosOnWifi(remoteUrls: string[]): Promise<void> {
  try {
    const network = await Network.getNetworkStateAsync();
    if (network.type !== Network.NetworkStateType.WIFI) return;
    if (network.isInternetReachable === false) return;

    for (const url of remoteUrls) {
      await cacheVideoInBackground(url);
    }
  } catch {
    // Best-effort — if the network check itself fails, just skip
    // pre-caching this launch. Videos still stream fine on demand.
  }
}

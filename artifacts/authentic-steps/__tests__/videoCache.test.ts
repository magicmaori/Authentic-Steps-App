/**
 * Unit tests for the on-device video cache. `expo-file-system` is replaced
 * with the manual mock in `test-helpers/expoFileSystemMock.ts` (a tiny
 * in-memory filesystem) so these tests exercise the caching + eviction
 * logic without touching disk.
 */
jest.mock('expo-file-system', () => require('../test-helpers/expoFileSystemMock'));

import { __mockClock, __mockFiles } from '../test-helpers/expoFileSystemMock';
import { cacheVideoInBackground, getCachedVideoUri } from '../lib/videoCache';

describe('videoCache', () => {
  beforeEach(() => {
    __mockFiles.clear();
    __mockClock.now = 1_000;
  });

  it('reports no cached URI before a video has been downloaded', () => {
    expect(getCachedVideoUri('https://example.com/videos/welcome-intro.mp4')).toBeNull();
  });

  it('caches a video and then reports its local URI', async () => {
    const url = 'https://example.com/videos/welcome-intro.mp4';
    await cacheVideoInBackground(url);
    const cachedUri = getCachedVideoUri(url);
    expect(cachedUri).not.toBeNull();
    expect(cachedUri).toContain('welcome-intro.mp4');
  });

  it('is a no-op if the video is already cached', async () => {
    const url = 'https://example.com/videos/welcome-intro.mp4';
    await cacheVideoInBackground(url);
    const uriAfterFirstCache = getCachedVideoUri(url);
    expect(uriAfterFirstCache).not.toBeNull();
    await cacheVideoInBackground(url);
    expect(getCachedVideoUri(url)).toBe(uriAfterFirstCache);
  });

  it('evicts the least-recently cached video once the size limit is exceeded', async () => {
    const urls = Array.from(
      { length: 16 },
      (_, i) => `https://example.com/videos/video-${i}.mp4`,
    );

    for (const url of urls) {
      await cacheVideoInBackground(url);
    }

    // Each fake download is 10MB; 16 of them (160MB) exceeds the 150MB cap,
    // so the oldest (first cached) entry should have been evicted.
    expect(getCachedVideoUri(urls[0])).toBeNull();
    expect(getCachedVideoUri(urls[urls.length - 1])).not.toBeNull();
  });
});

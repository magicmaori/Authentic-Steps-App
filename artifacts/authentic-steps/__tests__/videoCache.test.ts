/**
 * Unit tests for the on-device video cache. `expo-file-system` is replaced
 * with the manual mock in `test-helpers/expoFileSystemMock.ts` (a tiny
 * in-memory filesystem) so these tests exercise the caching + eviction
 * logic without touching disk.
 */
jest.mock('expo-file-system', () => require('../test-helpers/expoFileSystemMock'));

jest.mock('expo-network', () => {
  const actual = jest.requireActual('expo-network');
  return {
    ...actual,
    getNetworkStateAsync: jest.fn(),
  };
});

import * as Network from 'expo-network';

import { __mockClock, __mockFiles } from '../test-helpers/expoFileSystemMock';
import { cacheVideoInBackground, getCachedVideoUri, precacheVideosOnWifi } from '../lib/videoCache';

const mockedGetNetworkStateAsync = Network.getNetworkStateAsync as jest.Mock;

describe('videoCache', () => {
  beforeEach(() => {
    __mockFiles.clear();
    __mockClock.now = 1_000;
    mockedGetNetworkStateAsync.mockReset();
  });

  it('reports no cached URI before a video has been downloaded', async () => {
    expect(await getCachedVideoUri('https://example.com/videos/welcome-intro.mp4')).toBeNull();
  });

  it('caches a video and then reports its local URI', async () => {
    const url = 'https://example.com/videos/welcome-intro.mp4';
    await cacheVideoInBackground(url);
    const cachedUri = await getCachedVideoUri(url);
    expect(cachedUri).not.toBeNull();
    expect(cachedUri).toContain('welcome-intro.mp4');
  });

  it('is a no-op if the video is already cached', async () => {
    const url = 'https://example.com/videos/welcome-intro.mp4';
    await cacheVideoInBackground(url);
    const uriAfterFirstCache = await getCachedVideoUri(url);
    expect(uriAfterFirstCache).not.toBeNull();
    await cacheVideoInBackground(url);
    expect(await getCachedVideoUri(url)).toBe(uriAfterFirstCache);
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
    expect(await getCachedVideoUri(urls[0])).toBeNull();
    expect(await getCachedVideoUri(urls[urls.length - 1])).not.toBeNull();
  });

  describe('precacheVideosOnWifi', () => {
    const urls = [
      'https://example.com/videos/welcome-intro.mp4',
      'https://example.com/videos/message-for-you.mp4',
    ];

    it('downloads every video when on Wi-Fi', async () => {
      mockedGetNetworkStateAsync.mockResolvedValue({
        type: Network.NetworkStateType.WIFI,
        isConnected: true,
        isInternetReachable: true,
      });

      await precacheVideosOnWifi(urls);

      for (const url of urls) {
        expect(await getCachedVideoUri(url)).not.toBeNull();
      }
    });

    it('does not download anything on cellular', async () => {
      mockedGetNetworkStateAsync.mockResolvedValue({
        type: Network.NetworkStateType.CELLULAR,
        isConnected: true,
        isInternetReachable: true,
      });

      await precacheVideosOnWifi(urls);

      for (const url of urls) {
        expect(await getCachedVideoUri(url)).toBeNull();
      }
    });

    it('does not download anything when offline', async () => {
      mockedGetNetworkStateAsync.mockResolvedValue({
        type: Network.NetworkStateType.WIFI,
        isConnected: false,
        isInternetReachable: false,
      });

      await precacheVideosOnWifi(urls);

      for (const url of urls) {
        expect(await getCachedVideoUri(url)).toBeNull();
      }
    });

    it('resolves without throwing if the network check itself fails', async () => {
      mockedGetNetworkStateAsync.mockRejectedValue(new Error('boom'));

      await expect(precacheVideosOnWifi(urls)).resolves.toBeUndefined();
    });

    it('skips videos that are already cached', async () => {
      await cacheVideoInBackground(urls[0]);
      const cachedUriBefore = await getCachedVideoUri(urls[0]);

      mockedGetNetworkStateAsync.mockResolvedValue({
        type: Network.NetworkStateType.WIFI,
        isConnected: true,
        isInternetReachable: true,
      });

      await precacheVideosOnWifi(urls);

      expect(await getCachedVideoUri(urls[0])).toBe(cachedUriBefore);
      expect(await getCachedVideoUri(urls[1])).not.toBeNull();
    });
  });
});

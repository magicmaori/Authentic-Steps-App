/**
 * Tests for VideoPlaceholder's network-resilience behavior:
 *   1. Tapping the card while offline shows the "no internet" message
 *      instead of attempting to open a player against expo-av.
 *   2. While the offline message is showing, the component polls
 *      connectivity in the background and automatically resumes playback
 *      once the connection returns (no user action required).
 *   3. A playback error while online (e.g. a bad stream) shows the generic
 *      error message with a "Try again" retry button.
 *   4. A playback error that turns out to be a dropped connection is
 *      reclassified as the offline message.
 *
 * NOTE: jest.mock() is hoisted before variable declarations, so factory
 * functions must be fully self-contained — no outer variable references.
 */

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-av', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ResizeMode: { CONTAIN: 'contain' },
    Video: React.forwardRef((props: any, ref: any) =>
      React.createElement(View, { testID: 'mock-video', ref, ...props })
    ),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import * as Network from 'expo-network';
import { VideoPlaceholder } from '../components/VideoPlaceholder';

const mockedGetNetworkStateAsync = Network.getNetworkStateAsync as jest.Mock;

// Matched by presence of the identifying prop rather than element type,
// since RN primitives (Pressable/Text) can appear multiple times in the
// fiber tree (host + composite wrappers) with distinct type identities.
function findByTestId(root: ReactTestRenderer, testID: string) {
  return root.root.findAll((node) => node.props?.testID === testID && typeof node.type !== 'string');
}

function findText(root: ReactTestRenderer, match: string | RegExp) {
  const matches = root.root.findAll(
    (node) =>
      typeof node.props?.children === 'string' &&
      (typeof match === 'string' ? node.props.children.includes(match) : match.test(node.props.children))
  );
  // De-duplicate: the same text string appears once per wrapper level.
  const seen = new Set<string>();
  return matches.filter((node) => {
    if (seen.has(node.props.children)) return false;
    seen.add(node.props.children);
    return true;
  });
}

function findByAccessibilityLabel(root: ReactTestRenderer, label: string) {
  const matches = root.root.findAll(
    (node) => node.props?.accessibilityLabel === label && typeof node.props.onPress === 'function'
  );
  return matches[0];
}

async function tapPlayCard(root: ReactTestRenderer) {
  const pressable = findByAccessibilityLabel(root, 'Play video: Test video');
  await act(async () => {
    pressable.props.onPress();
    await Promise.resolve();
  });
}

describe('VideoPlaceholder network resilience', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedGetNetworkStateAsync.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the offline message when the device has no connection', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });

    let root!: ReactTestRenderer;
    await act(async () => {
      root = create(<VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />);
    });

    await tapPlayCard(root);

    expect(findText(root, 'No internet connection')).toHaveLength(1);
    expect(findByTestId(root, 'mock-video')).toHaveLength(0);
  });

  it('automatically resumes playback once connectivity returns', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });

    let root!: ReactTestRenderer;
    await act(async () => {
      root = create(<VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />);
    });

    await tapPlayCard(root);
    expect(findText(root, 'No internet connection')).toHaveLength(1);

    mockedGetNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });

    await act(async () => {
      jest.advanceTimersByTime(3100);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(findText(root, 'No internet connection')).toHaveLength(0);
    expect(findByTestId(root, 'mock-video')).toHaveLength(1);
  });

  it('shows a retry button on a genuine (online) playback error', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });

    let root!: ReactTestRenderer;
    await act(async () => {
      root = create(<VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />);
    });

    await tapPlayCard(root);
    expect(findByTestId(root, 'mock-video')).toHaveLength(1);

    const video = findByTestId(root, 'mock-video')[0];
    await act(async () => {
      video.props.onError();
      await Promise.resolve();
    });
    // The error handler retries the connectivity check a few times
    // (spaced 250ms apart) before concluding it's a genuine error.
    for (let i = 0; i < 2; i++) {
      await act(async () => {
        jest.advanceTimersByTime(250);
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(findText(root, "couldn't be played")).toHaveLength(1);
    const retryButton = findByAccessibilityLabel(root, 'Retry video');
    expect(retryButton).toBeDefined();

    await act(async () => {
      retryButton.props.onPress();
      await Promise.resolve();
    });
    expect(findByTestId(root, 'mock-video')).toHaveLength(1);
  });

  it('reclassifies a mid-playback error as offline when connectivity dropped', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });

    let root!: ReactTestRenderer;
    await act(async () => {
      root = create(<VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />);
    });

    await tapPlayCard(root);
    const video = findByTestId(root, 'mock-video')[0];

    mockedGetNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    await act(async () => {
      video.props.onError();
      await Promise.resolve();
    });

    expect(findText(root, 'No internet connection')).toHaveLength(1);
  });
});

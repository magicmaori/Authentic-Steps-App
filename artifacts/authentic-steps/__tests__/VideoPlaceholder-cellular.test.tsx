import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Network from 'expo-network';
import React from 'react';

import { VideoPlaceholder } from '../components/VideoPlaceholder';

// ─── Module mocks (must be fully self-contained — no outer variable refs) ────

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __store: store,
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
  };
});

jest.mock('expo-network', () => {
  const actual = jest.requireActual('expo-network');
  return {
    ...actual,
    getNetworkStateAsync: jest.fn(),
  };
});

jest.mock('expo-av', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    ResizeMode: { CONTAIN: 'contain' },
    Video: (props: any) => ReactActual.createElement(View, { testID: 'video', ...props }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

const mockedGetNetworkStateAsync = Network.getNetworkStateAsync as jest.Mock;

describe('VideoPlaceholder cellular warning', () => {
  beforeEach(async () => {
    mockedGetNetworkStateAsync.mockReset();
    (AsyncStorage as any).getItem.mockClear();
    (AsyncStorage as any).setItem.mockClear();
    const store = (AsyncStorage as any).__store as Record<string, string>;
    Object.keys(store).forEach(key => delete store[key]);
  });

  it('shows a cellular warning instead of playing immediately on mobile data', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.CELLULAR,
      isConnected: true,
      isInternetReachable: true,
    });

    const { getByLabelText, queryByTestId, findByText } = render(
      <VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />,
    );

    fireEvent.press(getByLabelText('Play video: Test video'));

    await findByText(/you're on mobile data/i);
    expect(queryByTestId('video')).toBeNull();
  });

  it('never mounts the video while the network check is still in flight on cellular', async () => {
    let resolveNetworkCheck: (value: {
      type: Network.NetworkStateType;
      isConnected: boolean;
      isInternetReachable: boolean;
    }) => void = () => {};
    mockedGetNetworkStateAsync.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveNetworkCheck = resolve;
        }),
    );

    const { getByLabelText, queryByTestId, findByTestId } = render(
      <VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />,
    );

    fireEvent.press(getByLabelText('Play video: Test video'));

    // While the (still-pending) network check hasn't resolved yet, playback
    // must not have started — this is the exact race the cellular warning
    // depends on not losing.
    expect(queryByTestId('video')).toBeNull();

    resolveNetworkCheck({
      type: Network.NetworkStateType.WIFI,
      isConnected: true,
      isInternetReachable: true,
    });

    await findByTestId('video');
  });

  it('plays the video normally on wifi with no warning', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.WIFI,
      isConnected: true,
      isInternetReachable: true,
    });

    const { getByLabelText, findByTestId } = render(
      <VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />,
    );

    fireEvent.press(getByLabelText('Play video: Test video'));

    await findByTestId('video');
  });

  it('plays after tapping "Play anyway" on the cellular warning', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.CELLULAR,
      isConnected: true,
      isInternetReachable: true,
    });

    const { getByLabelText, findByLabelText, findByTestId } = render(
      <VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />,
    );

    fireEvent.press(getByLabelText('Play video: Test video'));
    fireEvent.press(await findByLabelText('Play video using mobile data'));

    await findByTestId('video');
  });

  it('persists "always allow" so future videos skip the warning', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.CELLULAR,
      isConnected: true,
      isInternetReachable: true,
    });

    const { getByLabelText, findByLabelText, findByTestId, unmount } = render(
      <VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />,
    );

    fireEvent.press(getByLabelText('Play video: Test video'));
    fireEvent.press(await findByLabelText('Always allow videos to play on mobile data'));

    await findByTestId('video');

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('@authentic_steps_allow_cellular_video')).toBe('true');
    });

    unmount();

    // A fresh instance (e.g. a different video card) should now skip the
    // warning entirely, since the preference is persisted.
    const { getByLabelText: getByLabelText2, findByTestId: findByTestId2 } = render(
      <VideoPlaceholder label="Another video" source="https://example.com/video2.mp4" />,
    );

    fireEvent.press(getByLabelText2('Play video: Another video'));

    await findByTestId2('video');
  });

  it('shows offline message when there is no connection at all', async () => {
    mockedGetNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.NONE,
      isConnected: false,
      isInternetReachable: false,
    });

    const { getByLabelText, findByText } = render(
      <VideoPlaceholder label="Test video" source="https://example.com/video.mp4" />,
    );

    fireEvent.press(getByLabelText('Play video: Test video'));

    await findByText(/no internet connection/i);
  });
});

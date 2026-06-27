/**
 * Tests for the useBreathingSound hook's AppState integration.
 *
 * Verifies that:
 *   1. Moving to "background" calls stopAsync() on every loaded sound.
 *   2. Moving to "inactive" also calls stopAsync() on every loaded sound.
 *   3. The AppState listener is removed when the hook unmounts (no leak).
 *   4. Sounds are NOT stopped when the app returns to "active".
 */

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { act, create } from 'react-test-renderer';
import { AppState, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useBreathingSound } from '../hooks/useBreathingSound';

// ─── Minimal host component for driving the hook ──────────────────────────────

function HookHost({ enabled }: { enabled: boolean }) {
  useBreathingSound(enabled);
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockCreateAsync = Audio.Sound.createAsync as jest.Mock;

function makeMockSound() {
  return {
    stopAsync: jest.fn().mockResolvedValue(undefined),
    unloadAsync: jest.fn().mockResolvedValue(undefined),
    setPositionAsync: jest.fn().mockResolvedValue(undefined),
    playAsync: jest.fn().mockResolvedValue(undefined),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useBreathingSound – AppState integration', () => {
  let appStateListener: ((nextState: string) => void) | null;
  let mockSubscriptionRemove: jest.Mock;
  let addEventListenerSpy: jest.SpyInstance;
  let mockSounds: ReturnType<typeof makeMockSound>[];
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateListener = null;
    mockSubscriptionRemove = jest.fn();
    mockSounds = [];
    root = undefined;

    addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, cb) => {
        appStateListener = cb as (nextState: string) => void;
        return { remove: mockSubscriptionRemove };
      });

    mockCreateAsync.mockImplementation(async () => {
      const sound = makeMockSound();
      mockSounds.push(sound);
      return { sound };
    });
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    addEventListenerSpy.mockRestore();
  });

  function fireAppState(nextState: string) {
    if (!appStateListener) throw new Error('AppState listener was never registered');
    act(() => { appStateListener!(nextState); });
  }

  it('registers an AppState "change" listener on mount', async () => {
    await act(async () => {
      root = create(<HookHost enabled={true} />);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('calls stopAsync on all 4 sounds when the app moves to "background"', async () => {
    await act(async () => {
      root = create(<HookHost enabled={true} />);
    });

    expect(mockSounds).toHaveLength(4);

    fireAppState('background');

    for (const sound of mockSounds) {
      expect(sound.stopAsync).toHaveBeenCalledTimes(1);
    }
  });

  it('calls stopAsync on all 4 sounds when the app moves to "inactive"', async () => {
    await act(async () => {
      root = create(<HookHost enabled={true} />);
    });

    expect(mockSounds).toHaveLength(4);

    fireAppState('inactive');

    for (const sound of mockSounds) {
      expect(sound.stopAsync).toHaveBeenCalledTimes(1);
    }
  });

  it('does NOT call stopAsync when the app returns to "active"', async () => {
    await act(async () => {
      root = create(<HookHost enabled={true} />);
    });

    fireAppState('active');

    for (const sound of mockSounds) {
      expect(sound.stopAsync).not.toHaveBeenCalled();
    }
  });

  it('removes the AppState listener when the hook unmounts (no listener leak)', async () => {
    await act(async () => {
      root = create(<HookHost enabled={true} />);
    });

    expect(mockSubscriptionRemove).not.toHaveBeenCalled();

    act(() => { root!.unmount(); });
    root = undefined;

    expect(mockSubscriptionRemove).toHaveBeenCalledTimes(1);
  });

  it('does not register an AppState listener when Platform.OS is "web"', async () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';
    addEventListenerSpy.mockClear();

    try {
      await act(async () => {
        root = create(<HookHost enabled={true} />);
      });

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    } finally {
      (Platform as any).OS = originalOS;
    }
  });
});

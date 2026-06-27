/**
 * Render tests for BreathingTimer's chime toggle.
 *
 * These tests verify that pressing the chime toggle button (both in idle and
 * running states) calls `setChimeEnabled` with the correctly toggled value.
 * They fill the gap left by the AppContext chime-persistence tests, which only
 * exercise AsyncStorage read/write — not the UI callback.
 */

// ─── Module mocks (self-contained — no outer variable refs) ──────────────────

jest.mock('@/context/AppContext', () => ({
  useApp: jest.fn(),
  useAppOptional: jest.fn().mockReturnValue(null),
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: jest.fn().mockReturnValue({
    card: '#ffffff',
    border: '#e5e7eb',
    foreground: '#111827',
    mutedForeground: '#6b7280',
  }),
}));

jest.mock('@/hooks/useBreathingSound', () => ({
  useBreathingSound: jest.fn().mockReturnValue({ playChime: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Medium: 'Medium', Light: 'Light' },
  NotificationFeedbackType: { Success: 'Success' },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, { testID: `icon-${name}` }, name),
  };
});

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { act, create } from 'react-test-renderer';

import { useApp } from '../context/AppContext';
import BreathingTimer from '../components/BreathingTimer';

// ─── Typed mock reference ─────────────────────────────────────────────────────

const mockUseApp = useApp as jest.Mock;

// ─── Shared test props ────────────────────────────────────────────────────────

const TEST_PHASES = [
  { label: 'Breathe In', counts: 4, instruction: 'Inhale slowly', targetScale: 1 },
  { label: 'Hold', counts: 4, instruction: 'Hold gently', targetScale: 1 },
  { label: 'Breathe Out', counts: 4, instruction: 'Exhale fully', targetScale: 0.55 },
];

const DEFAULT_PROPS = {
  title: 'Box Breathing',
  description: 'A calming technique',
  phases: TEST_PHASES,
  totalRounds: 2,
  accentColor: '#6366f1',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find all nodes whose accessibilityLabel matches. */
function findByA11yLabel(root: ReturnType<typeof create>, label: string) {
  return root.root.findAll(
    node => node.props.accessibilityLabel === label,
    { deep: true },
  );
}

/**
 * Find pressable nodes (anything with onPress) that contain a Text descendant
 * whose children prop equals the given string.
 */
function findPressableByChildText(root: ReturnType<typeof create>, text: string) {
  const pressables = root.root.findAll(
    node => typeof node.props.onPress === 'function',
    { deep: true },
  );
  return pressables.filter(node => {
    try {
      return node.findAll(
        (child: any) => child.props.children === text,
        { deep: true },
      ).length > 0;
    } catch {
      return false;
    }
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BreathingTimer – chime toggle', () => {
  let mockSetChimeEnabled: jest.Mock;
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSetChimeEnabled = jest.fn().mockResolvedValue(undefined);
    root = undefined;
  });

  afterEach(() => {
    // Unmount to clear the countdown interval before restoring real timers
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.useRealTimers();
  });

  describe('idle state', () => {
    it('calls setChimeEnabled(false) when chimes are on and the toggle is pressed', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: true },
        setChimeEnabled: mockSetChimeEnabled,
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // With chimeEnabled=true the accessible label is "Mute chimes"
      const toggleNodes = findByA11yLabel(root!, 'Mute chimes');
      expect(toggleNodes.length).toBeGreaterThan(0);

      await act(async () => {
        toggleNodes[0].props.onPress();
      });

      expect(mockSetChimeEnabled).toHaveBeenCalledTimes(1);
      expect(mockSetChimeEnabled).toHaveBeenCalledWith(false);
    });

    it('calls setChimeEnabled(true) when chimes are off and the toggle is pressed', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: mockSetChimeEnabled,
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // With chimeEnabled=false the accessible label is "Enable chimes"
      const toggleNodes = findByA11yLabel(root!, 'Enable chimes');
      expect(toggleNodes.length).toBeGreaterThan(0);

      await act(async () => {
        toggleNodes[0].props.onPress();
      });

      expect(mockSetChimeEnabled).toHaveBeenCalledTimes(1);
      expect(mockSetChimeEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('running state', () => {
    it('calls setChimeEnabled(false) when chimes are on and the sound pill is pressed during a session', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: true },
        setChimeEnabled: mockSetChimeEnabled,
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // Start the exercise to enter running state
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);

      await act(async () => {
        startNodes[0].props.onPress();
      });

      // Now in running state — find the sound pill by accessibilityLabel
      const pillNodes = findByA11yLabel(root!, 'Mute chimes');
      expect(pillNodes.length).toBeGreaterThan(0);

      await act(async () => {
        pillNodes[0].props.onPress();
      });

      expect(mockSetChimeEnabled).toHaveBeenCalledWith(false);
    });

    it('calls setChimeEnabled(true) when chimes are off and the sound pill is pressed during a session', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: mockSetChimeEnabled,
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // Start the exercise
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);

      await act(async () => {
        startNodes[0].props.onPress();
      });

      // Pill label when chimes are off
      const pillNodes = findByA11yLabel(root!, 'Enable chimes');
      expect(pillNodes.length).toBeGreaterThan(0);

      await act(async () => {
        pillNodes[0].props.onPress();
      });

      expect(mockSetChimeEnabled).toHaveBeenCalledWith(true);
    });
  });
});

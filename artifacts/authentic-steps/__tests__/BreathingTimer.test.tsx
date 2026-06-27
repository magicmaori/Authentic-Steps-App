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
import { AppState } from 'react-native';

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

  describe('Stop button', () => {
    it('returns to idle state when Stop is pressed during a session', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: true },
        setChimeEnabled: mockSetChimeEnabled,
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // Start the exercise — running UI should appear
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);

      await act(async () => {
        startNodes[0].props.onPress();
      });

      // Verify we are in running state (Stop button is present)
      const stopNodes = findPressableByChildText(root!, 'Stop');
      expect(stopNodes.length).toBeGreaterThan(0);

      // Press Stop
      await act(async () => {
        stopNodes[0].props.onPress();
      });

      // Component must be back in idle state: "Start Breathing" reappears …
      const idleStartNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(idleStartNodes.length).toBeGreaterThan(0);

      // … and the running UI (Stop button) is gone
      const stopNodesAfter = findPressableByChildText(root!, 'Stop');
      expect(stopNodesAfter.length).toBe(0);
    });
  });

  describe('completion – done screen', () => {
    it('"Go Again" resets phaseIndex, round, and count and enters running state', async () => {
      /**
       * Setup: 2 phases × 2 rounds so the terminal state is meaningfully different
       * from the reset state, making every assertion discriminating.
       *
       * Phase 0 — "Breathe In": counts=4  (the phase that should be active after reset)
       * Phase 1 — "Hold":       counts=2  (the phase that is active when 'done' fires)
       *
       * Timer arithmetic per round:
       *   Phase 0: ticks 1-3 decrement count (4→3→2→1), tick 4 exhausts → advance phase
       *   Phase 1: tick 5 decrements (2→1), tick 6 exhausts → advance round (or done)
       *
       * Round 1: 6 ticks → phaseIndex resets to 0, round becomes 2
       * Round 2: 6 ticks → tick 12 fires done
       *
       * Terminal useState values just before 'done' fires:
       *   phaseIndex = 1 (Hold), count = 1, round = 2
       *
       * Expected values after "Go Again" (startExercise resets all):
       *   phaseIndex = 0 (Breathe In), count = 4, round = 1
       */
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const MULTI_PHASE_PROPS = {
        title: 'Test Breathing',
        description: 'Test',
        phases: [
          { label: 'Breathe In', counts: 4, instruction: 'Inhale', targetScale: 1 },
          { label: 'Hold',        counts: 2, instruction: 'Hold',   targetScale: 1 },
        ],
        totalRounds: 2,
        accentColor: '#6366f1',
      };

      await act(async () => {
        root = create(<BreathingTimer {...MULTI_PHASE_PROPS} />);
      });

      // ── Press Start Breathing ────────────────────────────────────────────────
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);

      await act(async () => {
        startNodes[0].props.onPress();
      });

      // ── Advance through all 12 ticks (2 rounds × 6 ticks) ───────────────────
      // Advance in two 6-second batches to keep the steps readable
      await act(async () => {
        jest.advanceTimersByTime(6000); // round 1 completes
      });

      await act(async () => {
        jest.advanceTimersByTime(6000); // round 2 completes → done
      });

      // ── Verify terminal state before "Go Again" ──────────────────────────────
      // Done screen visible
      const doneNodes = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodes.length).toBeGreaterThan(0);

      // Terminal round was 2 (not yet reset)
      const terminalRoundNodes = root!.root.findAll(
        (node: any) =>
          Array.isArray(node.props.children) &&
          node.props.children[0] === 'Round ' &&
          node.props.children[1] === 2,
        { deep: true },
      );
      // Done screen replaces the running area, so round text is hidden — just
      // check the done screen is showing (already confirmed above).
      // (round text is only rendered in status==='running')

      // ── Press "Go Again" ─────────────────────────────────────────────────────
      const goAgainNodes = findPressableByChildText(root!, 'Go Again');
      expect(goAgainNodes.length).toBeGreaterThan(0);

      await act(async () => {
        goAgainNodes[0].props.onPress();
      });

      // ── Running UI is back ────────────────────────────────────────────────────
      const stopNodes = findPressableByChildText(root!, 'Stop');
      expect(stopNodes.length).toBeGreaterThan(0);

      // Done screen is gone
      const doneNodesAfter = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodesAfter.length).toBe(0);

      // ── round reset to 1 (was 2 at completion) ───────────────────────────────
      const roundOneNodes = root!.root.findAll(
        (node: any) =>
          Array.isArray(node.props.children) &&
          node.props.children[0] === 'Round ' &&
          node.props.children[1] === 1,
        { deep: true },
      );
      expect(roundOneNodes.length).toBeGreaterThan(0);

      // Round 2 must not be shown
      const roundTwoNodes = root!.root.findAll(
        (node: any) =>
          Array.isArray(node.props.children) &&
          node.props.children[0] === 'Round ' &&
          node.props.children[1] === 2,
        { deep: true },
      );
      expect(roundTwoNodes.length).toBe(0);

      // ── phaseIndex reset to 0 — "Breathe In" visible, "Hold" absent ──────────
      const breatheInNodes = root!.root.findAll(
        (node: any) => node.props.children === 'Breathe In',
        { deep: true },
      );
      expect(breatheInNodes.length).toBeGreaterThan(0);

      const holdNodes = root!.root.findAll(
        (node: any) => node.props.children === 'Hold',
        { deep: true },
      );
      expect(holdNodes.length).toBe(0);

      // ── count reset to phases[0].counts = 4 (was 1 at completion) ────────────
      // The count is rendered as a bare number inside the circle center Text node.
      // children === 4 (number) matches only that element; the round-text children
      // is an array so it won't match here.
      const countFourNodes = root!.root.findAll(
        (node: any) => node.props.children === 4,
        { deep: true },
      );
      expect(countFourNodes.length).toBeGreaterThan(0);

      // Terminal count (1) must not appear as a standalone bare number
      const countOneNodes = root!.root.findAll(
        (node: any) => node.props.children === 1,
        { deep: true },
      );
      expect(countOneNodes.length).toBe(0);
    });

    it('shows "Well done!" and calls onComplete after all rounds complete', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const ONE_ROUND_PROPS = {
        title: 'Test Breathing',
        description: 'Test',
        phases: [{ label: 'Breathe In', counts: 1, instruction: 'Inhale', targetScale: 1 }],
        totalRounds: 1,
        accentColor: '#6366f1',
        onComplete: mockOnComplete,
      };

      await act(async () => {
        root = create(<BreathingTimer {...ONE_ROUND_PROPS} />);
      });

      // Start the exercise
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);

      await act(async () => {
        startNodes[0].props.onPress();
      });

      // Fast-forward one second: the single countdown tick fires and exhausts
      // the only phase in the only round, triggering the 'done' state
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // "Well done!" text must be present
      const doneNodes = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodes.length).toBeGreaterThan(0);

      // onComplete callback must have been called exactly once
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('AppState – background / foreground', () => {
    let appStateListeners: Array<(state: string) => void>;

    beforeEach(() => {
      appStateListeners = [];
      jest.spyOn(AppState, 'addEventListener').mockImplementation(
        (event: string, handler: (state: string) => void) => {
          if (event === 'change') appStateListeners.push(handler);
          return {
            remove: () => {
              const idx = appStateListeners.indexOf(handler);
              if (idx !== -1) appStateListeners.splice(idx, 1);
            },
          };
        },
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('stops the countdown interval when the app goes to the background', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // Start the session
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);
      await act(async () => { startNodes[0].props.onPress(); });

      // Confirm the timer is ticking: advance 1 s and count should drop from 4 → 3
      await act(async () => { jest.advanceTimersByTime(1000); });
      const countAfterOneTick = root!.root.findAll(
        (node: any) => node.props.children === 3,
        { deep: true },
      );
      expect(countAfterOneTick.length).toBeGreaterThan(0);

      // Simulate the app going to the background
      expect(appStateListeners.length).toBeGreaterThan(0);
      await act(async () => {
        appStateListeners.forEach(l => l('background'));
      });

      // Advance another 2 s — the interval must NOT fire because it was cleared
      const countBeforePause = root!.root.findAll(
        (node: any) => node.props.children === 3,
        { deep: true },
      );
      await act(async () => { jest.advanceTimersByTime(2000); });
      const countAfterPause = root!.root.findAll(
        (node: any) => node.props.children === 3,
        { deep: true },
      );

      // Count must still be 3 — no ticks while backgrounded
      expect(countBeforePause.length).toBe(countAfterPause.length);
    });

    it('resumes the countdown when the app returns to the foreground', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // Start the session
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      await act(async () => { startNodes[0].props.onPress(); });

      // Advance 1 s to tick: 4 → 3
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Background the app
      await act(async () => {
        appStateListeners.forEach(l => l('background'));
      });

      // Advance 5 s while backgrounded — count must not change
      await act(async () => { jest.advanceTimersByTime(5000); });

      // Foreground the app
      await act(async () => {
        appStateListeners.forEach(l => l('active'));
      });

      // Advance 1 s — countdown should resume from where it left off (3 → 2)
      await act(async () => { jest.advanceTimersByTime(1000); });

      // The running UI must still be visible (not done, not idle)
      const stopNodesAfterResume = findPressableByChildText(root!, 'Stop');
      expect(stopNodesAfterResume.length).toBeGreaterThan(0);

      // Count should now read 2 (advanced by exactly 1 tick after resume)
      const countAfterResume = root!.root.findAll(
        (node: any) => node.props.children === 2,
        { deep: true },
      );
      expect(countAfterResume.length).toBeGreaterThan(0);
    });

    it('keeps state coherent (running UI intact) immediately after foregrounding before any new ticks', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      await act(async () => { startNodes[0].props.onPress(); });

      // Background then immediately foreground without advancing time
      await act(async () => { appStateListeners.forEach(l => l('background')); });
      await act(async () => { appStateListeners.forEach(l => l('active')); });

      // Running UI must still be present — no accidental reset or completion
      const stopNodes = findPressableByChildText(root!, 'Stop');
      expect(stopNodes.length).toBeGreaterThan(0);

      const idleNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(idleNodes.length).toBe(0);
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

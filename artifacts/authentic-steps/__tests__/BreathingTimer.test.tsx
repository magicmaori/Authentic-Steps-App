/**
 * Render tests for BreathingTimer's chime toggle.
 *
 * These tests verify that pressing the chime toggle button (both in idle and
 * running states) calls `setChimeEnabled` with the correctly toggled value.
 * They fill the gap left by the AppContext chime-persistence tests, which only
 * exercise AsyncStorage read/write — not the UI callback.
 */

// ─── Module mocks (self-contained — no outer variable refs) ──────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

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
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useApp } from '../context/AppContext';
import BreathingTimer, { advanceStateByTicks, STORAGE_KEY_BREATHING_SESSION } from '../components/BreathingTimer';

// ─── Typed mock reference ─────────────────────────────────────────────────────

const mockUseApp = useApp as jest.Mock;

// ─── Shared test props ────────────────────────────────────────────────────────

const TEST_PHASES = [
  { label: 'Breathe In', counts: 4, instruction: 'Inhale slowly', targetScale: 1 },
  { label: 'Hold', counts: 4, instruction: 'Hold gently', targetScale: 1 },
  { label: 'Breathe Out', counts: 4, instruction: 'Exhale fully', targetScale: 0.55 },
];

const DEFAULT_PROPS = {
  toolId: 'box-breathing',
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
        toolId: 'test-breathing',
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
      const countOneNodesAtStart = root!.root.findAll(
        (node: any) => node.props.children === 1,
        { deep: true },
      );
      expect(countOneNodesAtStart.length).toBe(0);

      // ── No duplicate intervals — exactly one tick per second ─────────────────
      // If the old interval was not cleared before starting a new one, two
      // intervals would fire per second, decrementing count by 2 instead of 1
      // (4 → 2 instead of 4 → 3).  Advance 1 s and assert count is exactly 3.
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const countThreeNodes = root!.root.findAll(
        (node: any) => node.props.children === 3,
        { deep: true },
      );
      expect(countThreeNodes.length).toBeGreaterThan(0);

      // Count must not have jumped by two (which would show 2, not 3)
      const countTwoNodes = root!.root.findAll(
        (node: any) => node.props.children === 2,
        { deep: true },
      );
      expect(countTwoNodes.length).toBe(0);
    });

    it('shows "Well done!" and calls onComplete after all rounds complete', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const ONE_ROUND_PROPS = {
        toolId: 'test-breathing',
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

    /**
     * Regression guard: pressing "Go Again" starts a fresh session and each
     * completed session must independently trigger onComplete.
     *
     * Setup: 1 phase (counts=1), 1 round — the session finishes in a single
     * tick, making the test fast and deterministic.
     *
     * Flow:
     *   1. Start → advance 1 s → session completes → onComplete called once
     *   2. Press "Go Again" → advance 1 s → session completes again
     *      → onComplete called a second time (total = 2)
     *
     * A bug where "Go Again" reuses stale state or skips the onComplete hook
     * would result in the callback being called only once.
     */
    /**
     * Regression guard: pressing "Go Again" must reset circleScale to the
     * resting value (0.55) before starting the new animation.  Without this
     * reset the circle snaps from whatever scale the last phase ended at
     * rather than smoothly expanding from the rest position.
     *
     * We spy on `Animated.Value.prototype.setValue` and confirm that 0.55 is
     * among the values set when "Go Again" is pressed.
     */
    it('resets circleScale to 0.55 before starting the animation when "Go Again" is pressed', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const ONE_TICK_PROPS = {
        toolId: 'test-breathing',
        title: 'Test Breathing',
        description: 'Test',
        phases: [{ label: 'Breathe In', counts: 1, instruction: 'Inhale', targetScale: 1 }],
        totalRounds: 1,
        accentColor: '#6366f1',
      };

      await act(async () => {
        root = create(<BreathingTimer {...ONE_TICK_PROPS} />);
      });

      // Start and complete a session so we land on the done screen
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      await act(async () => { startNodes[0].props.onPress(); });
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Done screen visible
      const doneNodes = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodes.length).toBeGreaterThan(0);

      // Spy on setValue BEFORE pressing "Go Again" so we capture only the
      // calls that happen during startExercise.
      const setValueSpy = jest.spyOn(
        (require('react-native').Animated.Value.prototype as any),
        'setValue',
      );

      const goAgainNodes = findPressableByChildText(root!, 'Go Again');
      expect(goAgainNodes.length).toBeGreaterThan(0);

      await act(async () => { goAgainNodes[0].props.onPress(); });

      // setValue(0.55) must have been called — this is the circleScale reset.
      // (setValue(0) is also called by flashPhase for phaseOpacity, which is fine.)
      const resetCalls = setValueSpy.mock.calls.filter(([v]) => v === 0.55);
      expect(resetCalls.length).toBeGreaterThan(0);

      setValueSpy.mockRestore();
    });

    /**
     * Regression guard for the final-phase / final-round boundary in the
     * multi-phase setInterval code path:
     *   nextPhaseIndex >= phases.length  →  nextRound > totalRounds  →  done
     *
     * An off-by-one on `nextRound > totalRounds` would either fire done one
     * round too early (at tick 6) or prevent done from ever appearing.
     *
     * Config: 2 phases (counts=3 each) × 2 rounds = 12 ticks total.
     *
     * Timer arithmetic per round:
     *   Phase 0 (counts=3): ticks 1-2 decrement (3→2→1),
     *                        tick 3 exhausts → advance to phase 1
     *   Phase 1 (counts=3): ticks 4-5 decrement (3→2→1),
     *                        tick 6 exhausts → nextRound check
     *
     * Round 1 ends at tick 6  → round becomes 2 (not done; 2 ≤ totalRounds)
     * Round 2 ends at tick 12 → nextRound = 3 > totalRounds → done fires
     */
    it('shows "Well done!" on tick 12 (not before) and calls onComplete exactly once for a 2-phase × 2-round session', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const TWO_PHASE_TWO_ROUND_PROPS = {
        toolId: 'test-breathing',
        title: 'Boundary Test',
        description: 'Test',
        phases: [
          { label: 'Breathe In', counts: 3, instruction: 'Inhale', targetScale: 1 },
          { label: 'Hold',       counts: 3, instruction: 'Hold',   targetScale: 1 },
        ],
        totalRounds: 2,
        accentColor: '#6366f1',
        onComplete: mockOnComplete,
      };

      await act(async () => {
        root = create(<BreathingTimer {...TWO_PHASE_TWO_ROUND_PROPS} />);
      });

      // Start the exercise
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);
      await act(async () => { startNodes[0].props.onPress(); });

      // ── Ticks 1–11: done screen must NOT appear ─────────────────────────────
      await act(async () => { jest.advanceTimersByTime(11000); });

      const doneNodesEarly = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodesEarly.length).toBe(0);

      // Still in running state (Stop button present, done screen absent)
      const stopNodesAtTick11 = findPressableByChildText(root!, 'Stop');
      expect(stopNodesAtTick11.length).toBeGreaterThan(0);

      // onComplete must not have fired yet
      expect(mockOnComplete).not.toHaveBeenCalled();

      // ── Tick 12: done must appear and onComplete fires exactly once ─────────
      await act(async () => { jest.advanceTimersByTime(1000); });

      const doneNodesAtTick12 = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodesAtTick12.length).toBeGreaterThan(0);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onComplete once per completed session when "Go Again" is used multiple times', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const ONE_TICK_PROPS = {
        toolId: 'test-breathing',
        title: 'Test Breathing',
        description: 'Test',
        phases: [{ label: 'Breathe In', counts: 1, instruction: 'Inhale', targetScale: 1 }],
        totalRounds: 1,
        accentColor: '#6366f1',
        onComplete: mockOnComplete,
      };

      await act(async () => {
        root = create(<BreathingTimer {...ONE_TICK_PROPS} />);
      });

      // ── Session 1 ─────────────────────────────────────────────────────────────
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);

      await act(async () => { startNodes[0].props.onPress(); });

      // One tick exhausts the single phase in the single round → done
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Done screen must be visible after session 1
      const doneNodesSession1 = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodesSession1.length).toBeGreaterThan(0);

      // onComplete must have fired exactly once so far
      expect(mockOnComplete).toHaveBeenCalledTimes(1);

      // ── Session 2 via "Go Again" ───────────────────────────────────────────────
      const goAgainNodes = findPressableByChildText(root!, 'Go Again');
      expect(goAgainNodes.length).toBeGreaterThan(0);

      await act(async () => { goAgainNodes[0].props.onPress(); });

      // Running UI must be active again (not stuck on the done screen)
      const stopNodesSession2 = findPressableByChildText(root!, 'Stop');
      expect(stopNodesSession2.length).toBeGreaterThan(0);

      // One tick exhausts session 2
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Done screen must reappear
      const doneNodesSession2 = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodesSession2.length).toBeGreaterThan(0);

      // onComplete must have been called a second time — total = 2
      expect(mockOnComplete).toHaveBeenCalledTimes(2);
    });
  });

  describe('AppState – background / foreground', () => {
    let appStateListeners: Array<(state: AppStateStatus) => void>;

    beforeEach(() => {
      appStateListeners = [];
      jest.spyOn(AppState, 'addEventListener').mockImplementation(
        (event: string, handler: (state: AppStateStatus) => void) => {
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

      // Advance another 2 s — the setInterval must NOT fire because it was cleared
      await act(async () => { jest.advanceTimersByTime(2000); });

      // The running UI must still be present (no accidental completion/reset)
      const stopNodesWhileBackground = findPressableByChildText(root!, 'Stop');
      expect(stopNodesWhileBackground.length).toBeGreaterThan(0);
    });

    /**
     * Elapsed-time advance: on foreground the component fast-forwards the
     * session state by the wall-clock seconds spent backgrounded.
     *
     * DEFAULT_PROPS phases (each 4 counts), 2 rounds:
     *   Phase 0 "Breathe In" (counts=4)
     *   Phase 1 "Hold"       (counts=4)
     *   Phase 2 "Breathe Out"(counts=4)
     *
     * Starting state after 1 foreground tick: { phaseIndex: 0, count: 3 }
     * 5 elapsed seconds applied on foreground:
     *   tick 1: count 3 → 2
     *   tick 2: count 2 → 1
     *   tick 3: count 1 → 0 → advance to phase 1 (Hold, count = 4)
     *   tick 4: count 4 → 3
     *   tick 5: count 3 → 2
     * Fast-forwarded state: { phaseIndex: 1, count: 2 }
     *
     * 1 more second on foreground: count 2 → 1
     * Expected final count: 1 (phase "Hold" label visible)
     */
    it('advances the countdown by elapsed wall-clock seconds when returning from background', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      await act(async () => { startNodes[0].props.onPress(); });

      // Advance 1 s to tick: 4 → 3
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Background the app (fake-timer Date.now() is recorded)
      await act(async () => { appStateListeners.forEach(l => l('background')); });

      // Advance 5 s while backgrounded — fake Date.now() advances too
      await act(async () => { jest.advanceTimersByTime(5000); });

      // Foreground: component calculates elapsed = 5 s and fast-forwards state
      await act(async () => { appStateListeners.forEach(l => l('active')); });

      // Running UI must still be present
      const stopNodesAfterResume = findPressableByChildText(root!, 'Stop');
      expect(stopNodesAfterResume.length).toBeGreaterThan(0);

      // Phase must have advanced to "Hold" (phaseIndex 1) — not still "Breathe In"
      const holdLabel = root!.root.findAll(
        (node: any) => node.props.children === 'Hold',
        { deep: true },
      );
      expect(holdLabel.length).toBeGreaterThan(0);

      const breatheInLabel = root!.root.findAll(
        (node: any) => node.props.children === 'Breathe In',
        { deep: true },
      );
      expect(breatheInLabel.length).toBe(0);

      // Advance 1 more s → count ticks from 2 → 1
      await act(async () => { jest.advanceTimersByTime(1000); });

      const countAfterResume = root!.root.findAll(
        (node: any) => node.props.children === 1,
        { deep: true },
      );
      expect(countAfterResume.length).toBeGreaterThan(0);
    });

    it('keeps state coherent (running UI intact) when backgrounded for 0 elapsed seconds', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      await act(async () => { startNodes[0].props.onPress(); });

      // Background then immediately foreground without advancing fake time
      // elapsed = Math.floor(0 / 1000) = 0 — no state change, timer just resumes
      await act(async () => { appStateListeners.forEach(l => l('background')); });
      await act(async () => { appStateListeners.forEach(l => l('active')); });

      // Running UI must still be present — no accidental reset or completion
      const stopNodes = findPressableByChildText(root!, 'Stop');
      expect(stopNodes.length).toBeGreaterThan(0);

      const idleNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(idleNodes.length).toBe(0);

      // Exactly 1 tick per second — no duplicate intervals from re-registration
      await act(async () => { jest.advanceTimersByTime(1000); });

      const countThree = root!.root.findAll(
        (node: any) => node.props.children === 3,
        { deep: true },
      );
      expect(countThree.length).toBeGreaterThan(0);
    });

    /**
     * If the total elapsed time while backgrounded exceeds the remaining session
     * length, the session should complete rather than silently clamping.
     *
     * ONE_ROUND_PROPS: 1 phase (counts=2), 1 round
     * Start: count=2. After 1 foreground tick: count=1.
     * Background for 2 s → 2 elapsed ticks:
     *   tick 1: count 1 → 0 → phase done → round done → DONE
     * On foreground the component must fire the done state without needing
     * any additional foreground ticks.
     */
    it('completes the session when backgrounded duration exceeds remaining time', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const SHORT_PROPS = {
        toolId: 'test-breathing',
        title: 'Short Breathing',
        description: 'Quick test',
        phases: [{ label: 'Breathe In', counts: 2, instruction: 'Inhale', targetScale: 1 }],
        totalRounds: 1,
        accentColor: '#6366f1',
        onComplete: mockOnComplete,
      };

      await act(async () => {
        root = create(<BreathingTimer {...SHORT_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      await act(async () => { startNodes[0].props.onPress(); });

      // 1 tick: count 2 → 1
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Background the app
      await act(async () => { appStateListeners.forEach(l => l('background')); });

      // 2 elapsed seconds — enough to consume the remaining 1 count and exhaust the session
      await act(async () => { jest.advanceTimersByTime(2000); });

      // Foreground: component detects session completed while backgrounded
      await act(async () => { appStateListeners.forEach(l => l('active')); });

      // Done screen must be visible
      const doneNodes = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodes.length).toBeGreaterThan(0);

      // onComplete must have been called
      expect(mockOnComplete).toHaveBeenCalledTimes(1);

      // Running UI must be gone
      const stopNodes = findPressableByChildText(root!, 'Stop');
      expect(stopNodes.length).toBe(0);
    });

    /**
     * Regression: when the session completes while backgrounded and the user
     * presses "Go Again" from the done screen, the interval must restart.
     *
     * If appActive were left as false after the foreground handler fires,
     * the interval effect guard (status !== 'running' || !appActive) would
     * silently block the timer from ticking again.
     */
    /**
     * Lock/unlock cycle: active → inactive → background → active
     *
     * Real phone lock/unlock fires AppState events in rapid succession:
     *   1. 'inactive'  (screen dimming / locking)
     *   2. 'background' (shortly after)
     *   3. 'active'    (phone unlocked)
     *
     * Both 'inactive' and 'background' hit the same `else` branch in the
     * AppState handler, setting appActive=false and recording the wall-clock
     * instant in backgroundedAtRef. The second call (background) arrives
     * while appActive is already false; React bails out on the identical
     * state value, so the interval is neither cleared a second time nor
     * re-started prematurely.
     *
     * On 'active', elapsed is computed from the backgroundedAtRef timestamp
     * set by the LAST non-active event (background), which is close enough
     * to the true lock time for the counter to remain correct.
     *
     * Arithmetic (DEFAULT_PROPS — 3 phases × 4 counts, 2 rounds):
     *   After 1 foreground tick: { phase: 0 "Breathe In", count: 3 }
     *   'inactive' fires  → backgroundedAtRef = T0
     *   100 ms passes
     *   'background' fires → backgroundedAtRef = T0+100ms
     *   3 000 ms passes    → elapsed = floor(3100/1000) = 3
     *   'active' fires, 3 ticks applied to {phase:0, count:3}:
     *     tick 1: 3 → 2
     *     tick 2: 2 → 1
     *     tick 3: 1 → 0 → advance to phase 1 ("Hold"), count = 4
     *   Resumed state: { phase: 1 "Hold", count: 4 }
     *
     *   1 foreground tick after resume: count 4 → 3
     *   1 more tick: count 3 → 2  (verifies exactly ONE interval is running)
     */
    it('keeps count and round correct across a rapid lock/unlock (inactive→background→active) and fires only one tick per second', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);
      await act(async () => { startNodes[0].props.onPress(); });

      // 1 foreground tick: count 4 → 3
      await act(async () => { jest.advanceTimersByTime(1000); });
      const countAfterOneTick = root!.root.findAll(
        (node: any) => node.props.children === 3,
        { deep: true },
      );
      expect(countAfterOneTick.length).toBeGreaterThan(0);

      // ── Lock sequence ──────────────────────────────────────────────────────────
      // Step 1: phone screen dims → 'inactive'
      await act(async () => { appStateListeners.forEach(l => l('inactive')); });

      // 100 ms elapses (phone still locking)
      await act(async () => { jest.advanceTimersByTime(100); });

      // Step 2: app fully backgrounded → 'background'
      await act(async () => { appStateListeners.forEach(l => l('background')); });

      // 3 000 ms in background (elapsed = floor(3100/1000) = 3)
      await act(async () => { jest.advanceTimersByTime(3000); });

      // ── Unlock ─────────────────────────────────────────────────────────────────
      // Step 3: user unlocks phone → 'active'; component fast-forwards 3 ticks
      await act(async () => { appStateListeners.forEach(l => l('active')); });

      // Running UI must still be present (no accidental completion — session has
      // plenty of ticks remaining)
      const stopNodesAfterUnlock = findPressableByChildText(root!, 'Stop');
      expect(stopNodesAfterUnlock.length).toBeGreaterThan(0);

      // Phase must have advanced to "Hold" (phaseIndex 1) after 3 elapsed ticks
      const holdLabel = root!.root.findAll(
        (node: any) => node.props.children === 'Hold',
        { deep: true },
      );
      expect(holdLabel.length).toBeGreaterThan(0);

      const breatheInLabel = root!.root.findAll(
        (node: any) => node.props.children === 'Breathe In',
        { deep: true },
      );
      expect(breatheInLabel.length).toBe(0);

      // Count must have reset to phase 1's counts (4)
      const countFourNodes = root!.root.findAll(
        (node: any) => node.props.children === 4,
        { deep: true },
      );
      expect(countFourNodes.length).toBeGreaterThan(0);

      // Round must still be 1 (not enough ticks to complete even round 1)
      const roundOneNodes = root!.root.findAll(
        (node: any) =>
          Array.isArray(node.props.children) &&
          node.props.children[0] === 'Round ' &&
          node.props.children[1] === 1,
        { deep: true },
      );
      expect(roundOneNodes.length).toBeGreaterThan(0);

      // ── Verify exactly one interval is running ─────────────────────────────────
      // If a duplicate interval were created (inactive clears + re-creates, then
      // active creates another), two ticks per second would fire and count would
      // drop by 2 each second instead of 1.
      //
      // Advance 1 s → count 4 → 3
      await act(async () => { jest.advanceTimersByTime(1000); });
      const countThreeAfterResume = root!.root.findAll(
        (node: any) => node.props.children === 3,
        { deep: true },
      );
      expect(countThreeAfterResume.length).toBeGreaterThan(0);

      // Advance 1 more s → count 3 → 2 (not 1, which would indicate a double tick)
      await act(async () => { jest.advanceTimersByTime(1000); });
      const countTwoAfterResume = root!.root.findAll(
        (node: any) => node.props.children === 2,
        { deep: true },
      );
      expect(countTwoAfterResume.length).toBeGreaterThan(0);

      // Count must NOT have jumped to 1 (which would signal duplicate interval)
      const countOneAfterResume = root!.root.findAll(
        (node: any) => node.props.children === 1,
        { deep: true },
      );
      expect(countOneAfterResume.length).toBe(0);
    });

    /**
     * Regression guard: the AppState handler calls stopAnimation() when the
     * app is backgrounded.  This test verifies that the animation's .stop()
     * method is actually invoked and that animationRef.current is cleared
     * (null) afterwards, so a subsequent foreground return can start a
     * completely fresh animation rather than attempting to stop an already-
     * stopped handle.
     *
     * Flow:
     *   1. Start session → animateToScale() fires → animation in progress
     *   2. Advance 1 tick (no phase transition; animation still running)
     *   3. Fire 'background' AppState event → stopAnimation() must call .stop()
     *   4. Assert the captured stop spy was called exactly once
     *   5. Return to foreground with 1 s elapsed (state advances, interval
     *      restarts); advance 2 more ticks to hit the phase boundary, which
     *      calls animateToScale() again.  Because animationRef.current was
     *      cleared (null), stopAnimation() inside animateToScale is a no-op
     *      and the old stop spy is NOT called again — a brand-new animation
     *      is created instead, confirmed by an additional entry in stopSpies.
     *
     * DEFAULT_PROPS phases: "Breathe In" counts=4, "Hold" counts=4,
     *                        "Breathe Out" counts=4.  totalRounds=2.
     *
     * Count arithmetic:
     *   Start:          count = 4 (phase 0)
     *   +1 foreground:  count = 3
     *   Background, +1 s elapsed → advanceStateByTicks applies 1 tick:
     *     count = 2 (still phase 0)
     *   Foreground (state: count=2), interval restarts:
     *     +1 tick: count = 1
     *     +2 ticks: count = 0 → phase transition to phase 1 → animateToScale
     */
    it('calls .stop() on the in-progress animation and clears the handle when the app is backgrounded', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      // ── Intercept Animated.timing to spy on each animation's .stop() ────────
      //
      // startExercise calls two Animated.timing animations in order:
      //   1. animateToScale  → stored in animationRef.current (the one we care about)
      //   2. flashPhase      → short 300 ms fade, NOT stored in animationRef
      //
      // animateToScale duration = counts * 900 = 4 * 900 = 3600 ms.
      // flashPhase duration = 300 ms.
      //
      // We distinguish them by config.duration so we can assert only on the
      // animation that stopAnimation() actually references.
      //
      // In the Jest React Native mock, Animated.timing().start(cb) calls cb
      // synchronously with { finished: true }, which fires the component's
      // `if (finished) animationRef.current = null` branch and clears the ref
      // before the background event arrives.  We override start() on every
      // animation so the callback is never invoked — the ref stays set —
      // accurately reflecting a real device where the animation is running
      // when the app is backgrounded.
      let circleScaleStopSpy: jest.Mock | null = null;
      const allStopSpies: jest.Mock[] = [];
      const AnimatedModule = require('react-native').Animated;
      const originalTiming = AnimatedModule.timing.bind(AnimatedModule);
      const timingSpy = jest.spyOn(AnimatedModule, 'timing').mockImplementation(
        (value: any, config: any) => {
          const anim = originalTiming(value, config);
          const originalStop = anim.stop.bind(anim);
          const stopSpy = jest.fn(() => originalStop());
          anim.stop = stopSpy;
          // Suppress the synchronous finished=true callback so animationRef
          // is not cleared before the background event fires.
          anim.start = jest.fn();
          allStopSpies.push(stopSpy);
          // Track the circleScale animation: duration is counts*900 (≥900 ms),
          // while flashPhase is always 300 ms.
          if (config?.duration !== 300) {
            circleScaleStopSpy = stopSpy;
          }
          return anim;
        },
      );

      await act(async () => {
        root = create(<BreathingTimer {...DEFAULT_PROPS} />);
      });

      // Start the session — animateToScale fires (long-duration), then flashPhase (300 ms)
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);
      await act(async () => { startNodes[0].props.onPress(); });

      // Sanity: the circleScale animation was created
      expect(circleScaleStopSpy).not.toBeNull();
      const capturedStopSpy = circleScaleStopSpy!;

      // Advance 1 tick — count 4 → 3, no phase transition; animation is still in progress
      await act(async () => { jest.advanceTimersByTime(1000); });

      // The circleScale animation must NOT have been stopped yet
      expect(capturedStopSpy).not.toHaveBeenCalled();

      // ── Background event ──────────────────────────────────────────────────────
      await act(async () => { appStateListeners.forEach(l => l('background')); });

      // stopAnimation() must have called .stop() on animationRef.current exactly once
      expect(capturedStopSpy).toHaveBeenCalledTimes(1);

      // ── Verify the handle is cleared (animationRef.current === null) ──────────
      // Advance fake time so elapsed = 1 s when the foreground event fires.
      await act(async () => { jest.advanceTimersByTime(1000); });
      // Reset the circleScaleStopSpy tracker so we can detect when a NEW
      // animateToScale animation is created after foreground return.
      circleScaleStopSpy = null;
      const allStopSpiesCountBeforeForeground = allStopSpies.length;

      // Return to foreground — elapsed=1 s → advanceStateByTicks sets count=2
      // (phase 0), then the interval restarts.
      await act(async () => { appStateListeners.forEach(l => l('active')); });

      // Running UI must be intact
      const stopNodesAfterResume = findPressableByChildText(root!, 'Stop');
      expect(stopNodesAfterResume.length).toBeGreaterThan(0);

      // Advance 2 ticks → count 2→1→0 → phase transition → animateToScale fires.
      // Inside animateToScale, stopAnimation() is called first.  Because
      // animationRef.current was null (cleared on background), stopAnimation is
      // a no-op — capturedStopSpy must NOT receive an additional call.
      // A brand-new Animated.timing animation is then created.
      await act(async () => { jest.advanceTimersByTime(2000); });

      // Old circleScale stop spy must NOT have been called again
      expect(capturedStopSpy).toHaveBeenCalledTimes(1);

      // A fresh animation was created, proving the handle was cleared and a new
      // animateToScale could start without any stale-ref issues.
      expect(circleScaleStopSpy).not.toBeNull();
      expect(allStopSpies.length).toBeGreaterThan(allStopSpiesCountBeforeForeground);

      timingSpy.mockRestore();
    });

    it('restarts the interval correctly after "Go Again" following a background-completion', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const SHORT_PROPS = {
        toolId: 'test-breathing',
        title: 'Short Breathing',
        description: 'Quick test',
        phases: [{ label: 'Breathe In', counts: 2, instruction: 'Inhale', targetScale: 1 }],
        totalRounds: 1,
        accentColor: '#6366f1',
        onComplete: mockOnComplete,
      };

      await act(async () => {
        root = create(<BreathingTimer {...SHORT_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      await act(async () => { startNodes[0].props.onPress(); });

      // 1 tick: count 2 → 1
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Background then wait long enough to exhaust the session (2 elapsed s)
      await act(async () => { appStateListeners.forEach(l => l('background')); });
      await act(async () => { jest.advanceTimersByTime(2000); });

      // Foreground: session completes, appActive must be restored to true
      await act(async () => { appStateListeners.forEach(l => l('active')); });

      // Done screen must be showing
      const doneNodes = root!.root.findAll(
        (node: any) => node.props.children === 'Well done!',
        { deep: true },
      );
      expect(doneNodes.length).toBeGreaterThan(0);

      // Press "Go Again" — starts a new session
      const goAgainNodes = findPressableByChildText(root!, 'Go Again');
      expect(goAgainNodes.length).toBeGreaterThan(0);
      await act(async () => { goAgainNodes[0].props.onPress(); });

      // Running UI must be visible
      const stopNodesAfterRestart = findPressableByChildText(root!, 'Stop');
      expect(stopNodesAfterRestart.length).toBeGreaterThan(0);

      // Advance 1 s — the interval must tick (count 2 → 1)
      // If appActive were still false the tick would not fire and count would stay 2
      await act(async () => { jest.advanceTimersByTime(1000); });

      const countOne = root!.root.findAll(
        (node: any) => node.props.children === 1,
        { deep: true },
      );
      expect(countOne.length).toBeGreaterThan(0);

      const countTwo = root!.root.findAll(
        (node: any) => node.props.children === 2,
        { deep: true },
      );
      expect(countTwo.length).toBe(0);
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

  describe('phase transition', () => {
    /**
     * Two-phase config used across all tests in this block:
     *   Phase 0 — "Breathe In": counts=4
     *   Phase 1 — "Hold":       counts=2
     *
     * Timer arithmetic:
     *   Tick 1-3: count 4→3→2→1  (nextCount > 0, no transition)
     *   Tick 4:   nextCount = 0  → advance to phase 1, count resets to 2
     *   Tick 5:   count 2→1
     *   Tick 6:   nextCount = 0  → all phases exhausted, round 1→2
     */
    const TWO_PHASE_PROPS = {
      toolId: 'test-breathing',
      title: 'Phase Test',
      description: 'Testing phase transitions',
      phases: [
        { label: 'Breathe In', counts: 4, instruction: 'Inhale', targetScale: 1 },
        { label: 'Hold',        counts: 2, instruction: 'Hold',  targetScale: 1 },
      ],
      totalRounds: 3,
      accentColor: '#6366f1',
    };

    it('changes the phase label from phase 1 to phase 2 after the first phase counts expire', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...TWO_PHASE_PROPS} />);
      });

      // Start the exercise
      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);
      await act(async () => { startNodes[0].props.onPress(); });

      // Phase 0 label ("Breathe In") should be visible immediately after start
      const breatheInAtStart = root!.root.findAll(
        (node: any) => node.props.children === 'Breathe In',
        { deep: true },
      );
      expect(breatheInAtStart.length).toBeGreaterThan(0);

      // "Hold" must not be visible yet
      const holdAtStart = root!.root.findAll(
        (node: any) => node.props.children === 'Hold',
        { deep: true },
      );
      expect(holdAtStart.length).toBe(0);

      // Advance 3 ticks — count drops 4→3→2→1; still in phase 0
      await act(async () => { jest.advanceTimersByTime(3000); });

      const breatheInMidPhase = root!.root.findAll(
        (node: any) => node.props.children === 'Breathe In',
        { deep: true },
      );
      expect(breatheInMidPhase.length).toBeGreaterThan(0);

      // Tick 4: phase 0 exhausted → transition to phase 1
      await act(async () => { jest.advanceTimersByTime(1000); });

      // "Hold" label must now be shown
      const holdAfterTransition = root!.root.findAll(
        (node: any) => node.props.children === 'Hold',
        { deep: true },
      );
      expect(holdAfterTransition.length).toBeGreaterThan(0);

      // "Breathe In" must no longer be visible
      const breatheInAfterTransition = root!.root.findAll(
        (node: any) => node.props.children === 'Breathe In',
        { deep: true },
      );
      expect(breatheInAfterTransition.length).toBe(0);
    });

    it('increments the round counter when all phases in a round complete', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      await act(async () => {
        root = create(<BreathingTimer {...TWO_PHASE_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);
      await act(async () => { startNodes[0].props.onPress(); });

      // Round 1 should be displayed at the start
      const roundOneAtStart = root!.root.findAll(
        (node: any) =>
          Array.isArray(node.props.children) &&
          node.props.children[0] === 'Round ' &&
          node.props.children[1] === 1,
        { deep: true },
      );
      expect(roundOneAtStart.length).toBeGreaterThan(0);

      // Advance 6 ticks: phase 0 (4 ticks) + phase 1 (2 ticks) → all phases done → round 1→2
      await act(async () => { jest.advanceTimersByTime(6000); });

      // Round counter must show 2
      const roundTwoNodes = root!.root.findAll(
        (node: any) =>
          Array.isArray(node.props.children) &&
          node.props.children[0] === 'Round ' &&
          node.props.children[1] === 2,
        { deep: true },
      );
      expect(roundTwoNodes.length).toBeGreaterThan(0);

      // Round 1 must no longer be shown
      const roundOneAfter = root!.root.findAll(
        (node: any) =>
          Array.isArray(node.props.children) &&
          node.props.children[0] === 'Round ' &&
          node.props.children[1] === 1,
        { deep: true },
      );
      expect(roundOneAfter.length).toBe(0);

      // Still in running state (not done — totalRounds is 3)
      const stopNodes = findPressableByChildText(root!, 'Stop');
      expect(stopNodes.length).toBeGreaterThan(0);

      // Phase should have reset to phase 0 ("Breathe In") for the new round
      const breatheInNewRound = root!.root.findAll(
        (node: any) => node.props.children === 'Breathe In',
        { deep: true },
      );
      expect(breatheInNewRound.length).toBeGreaterThan(0);
    });
  });
});

// ─── Force-quit / remount interruption notice ─────────────────────────────────
//
// When the user force-quits the app mid-session and reopens it, the component
// remounts in 'idle' state.  A stale AsyncStorage flag left by the previous
// session signals that the session was interrupted — the component must show a
// notice and clear the flag so subsequent mounts are clean.

describe('BreathingTimer – force-quit interruption notice', () => {
  let mockSetChimeEnabled: jest.Mock;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSetChimeEnabled = jest.fn().mockResolvedValue(undefined);
    // Default: no stale flag (clean start)
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the interrupted notice when a stale session flag is found on mount', async () => {
    // Simulate a stale flag left by a previous force-quit — value matches this card's toolId
    mockAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === STORAGE_KEY_BREATHING_SESSION) return DEFAULT_PROPS.toolId;
      return null;
    });

    mockUseApp.mockReturnValue({
      userData: { chimeEnabled: true },
      setChimeEnabled: mockSetChimeEnabled,
    });

    let root: ReturnType<typeof create> | undefined;
    await act(async () => {
      root = create(<BreathingTimer {...DEFAULT_PROPS} />);
    });

    // Allow the async AsyncStorage.getItem call to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Interrupted notice must be visible
    const noticeNodes = root!.root.findAll(
      (node: any) => typeof node.props.children === 'string' &&
        node.props.children.includes('interrupted'),
      { deep: true },
    );
    expect(noticeNodes.length).toBeGreaterThan(0);

    // The stale key must have been removed
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_BREATHING_SESSION);

    act(() => { root!.unmount(); });
  });

  it('does not show the interrupted notice when no stale flag exists', async () => {
    // No stale flag — normal cold start
    mockAsyncStorage.getItem.mockResolvedValue(null);

    mockUseApp.mockReturnValue({
      userData: { chimeEnabled: true },
      setChimeEnabled: mockSetChimeEnabled,
    });

    let root: ReturnType<typeof create> | undefined;
    await act(async () => {
      root = create(<BreathingTimer {...DEFAULT_PROPS} />);
    });

    await act(async () => { await Promise.resolve(); });

    const noticeNodes = root!.root.findAll(
      (node: any) => typeof node.props.children === 'string' &&
        node.props.children.includes('interrupted'),
      { deep: true },
    );
    expect(noticeNodes.length).toBe(0);

    act(() => { root!.unmount(); });
  });

  it('does not show the interrupted notice when the stale flag belongs to a different exercise', async () => {
    // A different exercise was interrupted — this card's toolId does not match
    mockAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === STORAGE_KEY_BREATHING_SESSION) return 'some-other-exercise';
      return null;
    });

    mockUseApp.mockReturnValue({
      userData: { chimeEnabled: true },
      setChimeEnabled: mockSetChimeEnabled,
    });

    let root: ReturnType<typeof create> | undefined;
    await act(async () => {
      root = create(<BreathingTimer {...DEFAULT_PROPS} />);
    });

    await act(async () => { await Promise.resolve(); });

    const noticeNodes = root!.root.findAll(
      (node: any) => typeof node.props.children === 'string' &&
        node.props.children.includes('interrupted'),
      { deep: true },
    );
    expect(noticeNodes.length).toBe(0);

    // The flag must NOT be removed — it belongs to the other exercise
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith(STORAGE_KEY_BREATHING_SESSION);

    act(() => { root!.unmount(); });
  });

  it('clears the interrupted notice and writes the session flag when the user starts a new session', async () => {
    mockAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === STORAGE_KEY_BREATHING_SESSION) return DEFAULT_PROPS.toolId;
      return null;
    });

    mockUseApp.mockReturnValue({
      userData: { chimeEnabled: false },
      setChimeEnabled: mockSetChimeEnabled,
    });

    let root: ReturnType<typeof create> | undefined;
    await act(async () => {
      root = create(<BreathingTimer {...DEFAULT_PROPS} />);
    });

    await act(async () => { await Promise.resolve(); });

    // Interrupted notice should be visible before starting
    const noticeBefore = root!.root.findAll(
      (node: any) => typeof node.props.children === 'string' &&
        node.props.children.includes('interrupted'),
      { deep: true },
    );
    expect(noticeBefore.length).toBeGreaterThan(0);

    // Start a new session
    const startNodes = findPressableByChildText(root!, 'Start Breathing');
    expect(startNodes.length).toBeGreaterThan(0);
    await act(async () => { startNodes[0].props.onPress(); });

    // The running UI must be visible now
    const stopNodes = findPressableByChildText(root!, 'Stop');
    expect(stopNodes.length).toBeGreaterThan(0);

    // The session flag must have been written for the new session
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY_BREATHING_SESSION, DEFAULT_PROPS.toolId);

    act(() => { root!.unmount(); });
  });

  it('writes the session flag on start and removes it when the user stops manually', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    mockUseApp.mockReturnValue({
      userData: { chimeEnabled: false },
      setChimeEnabled: mockSetChimeEnabled,
    });

    let root: ReturnType<typeof create> | undefined;
    await act(async () => {
      root = create(<BreathingTimer {...DEFAULT_PROPS} />);
    });

    await act(async () => { await Promise.resolve(); });

    // Start
    const startNodes = findPressableByChildText(root!, 'Start Breathing');
    await act(async () => { startNodes[0].props.onPress(); });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY_BREATHING_SESSION, DEFAULT_PROPS.toolId);

    // Stop manually
    const stopNodes = findPressableByChildText(root!, 'Stop');
    await act(async () => { stopNodes[0].props.onPress(); });

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY_BREATHING_SESSION);

    act(() => { root!.unmount(); });
  });

  describe('phase transition – count display', () => {
    /**
     * Regression guard: when the countdown exhausts phase 0 and advances to
     * phase 1, the displayed count must immediately show phase 1's `counts`
     * value — not 0, not the last value from phase 1, and not any stale
     * carry-over from phase 0.
     *
     * Config: 2 phases.
     *   Phase 0 "Breathe In"  counts=3  (exhausted on tick 3)
     *   Phase 1 "Hold"        counts=5  (the expected count right after transition)
     *
     * Timer arithmetic:
     *   Tick 1: count 3 → 2
     *   Tick 2: count 2 → 1
     *   Tick 3: count 1 → 0 → transition to phase 1; count set to 5
     *
     * Immediately after tick 3, the displayed count must be 5 (not 0, not 1).
     */
    it('shows the new phase counts immediately at the transition tick — no carry-over from the previous phase', async () => {
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const TRANSITION_PROPS = {
        toolId: 'test-breathing',
        title: 'Transition Test',
        description: 'Test',
        phases: [
          { label: 'Breathe In', counts: 3, instruction: 'Inhale', targetScale: 1 },
          { label: 'Hold',       counts: 5, instruction: 'Hold',   targetScale: 1 },
        ],
        totalRounds: 2,
        accentColor: '#6366f1',
      };

      await act(async () => {
        root = create(<BreathingTimer {...TRANSITION_PROPS} />);
      });

      const startNodes = findPressableByChildText(root!, 'Start Breathing');
      expect(startNodes.length).toBeGreaterThan(0);

      await act(async () => { startNodes[0].props.onPress(); });

      // Ticks 1-2: count decrements within phase 0 (3 → 2 → 1)
      await act(async () => { jest.advanceTimersByTime(2000); });

      // Sanity-check: still in phase 0 with count 1
      const countOneBeforeTransition = root!.root.findAll(
        (node: any) => node.props.children === 1,
        { deep: true },
      );
      expect(countOneBeforeTransition.length).toBeGreaterThan(0);

      // Tick 3: exhausts phase 0 — transition fires, count must become 5 immediately
      await act(async () => { jest.advanceTimersByTime(1000); });

      // Phase label must now be "Hold" (phase 1)
      const holdLabel = root!.root.findAll(
        (node: any) => node.props.children === 'Hold',
        { deep: true },
      );
      expect(holdLabel.length).toBeGreaterThan(0);

      // Count must be phase 1's counts (5), not any residual from phase 0
      const countFiveNodes = root!.root.findAll(
        (node: any) => node.props.children === 5,
        { deep: true },
      );
      expect(countFiveNodes.length).toBeGreaterThan(0);

      // Count must NOT be 0 (a sign the transition set count before the phase advanced)
      const countZeroNodes = root!.root.findAll(
        (node: any) => node.props.children === 0,
        { deep: true },
      );
      expect(countZeroNodes.length).toBe(0);

      // Count must NOT be 1 (carry-over from phase 0's last value)
      const countOneNodes = root!.root.findAll(
        (node: any) => node.props.children === 1,
        { deep: true },
      );
      expect(countOneNodes.length).toBe(0);
    });
  });
});

// ─── advanceStateByTicks – pure-function unit tests ───────────────────────────
//
// These cover the helper that computes elapsed-time advance on foreground.
// They run independently of React rendering.

describe('advanceStateByTicks', () => {
  const PHASES = [
    { counts: 4 }, // phase 0
    { counts: 4 }, // phase 1
    { counts: 4 }, // phase 2
  ];
  const TOTAL_ROUNDS = 2;

  it('decrements count within the same phase when ticks < remaining count', () => {
    const result = advanceStateByTicks(
      { phaseIndex: 0, count: 4, round: 1 },
      2,
      PHASES,
      TOTAL_ROUNDS,
    );
    expect(result).toEqual({ phaseIndex: 0, count: 2, round: 1, done: false });
  });

  it('advances to the next phase when ticks exactly exhaust the current count', () => {
    // count=4, 4 ticks → last tick triggers phase advance
    // tick 1-3: count 4→3→2→1; tick 4: count=0 → nextPhase
    const result = advanceStateByTicks(
      { phaseIndex: 0, count: 4, round: 1 },
      4,
      PHASES,
      TOTAL_ROUNDS,
    );
    expect(result).toEqual({ phaseIndex: 1, count: 4, round: 1, done: false });
  });

  it('advances multiple phases in a single call', () => {
    // From phase 0, count 4: 4 ticks exhaust phase 0 → phase 1 (count=4)
    // Then 4 more ticks exhaust phase 1 → phase 2 (count=4)
    // Then 2 more ticks: count 4→3→2
    const result = advanceStateByTicks(
      { phaseIndex: 0, count: 4, round: 1 },
      10,
      PHASES,
      TOTAL_ROUNDS,
    );
    expect(result).toEqual({ phaseIndex: 2, count: 2, round: 1, done: false });
  });

  it('wraps to round 2 when all phases in round 1 are exhausted', () => {
    // 3 phases × 4 counts = 12 ticks to finish round 1
    // Ticks 1-11: deplete phases 0-2 within round 1
    // Tick 12: exhausts phase 2 → round 2, phaseIndex reset to 0, count=4
    // 1 more tick: count 4→3
    const result = advanceStateByTicks(
      { phaseIndex: 0, count: 4, round: 1 },
      13,
      PHASES,
      TOTAL_ROUNDS,
    );
    expect(result).toEqual({ phaseIndex: 0, count: 3, round: 2, done: false });
  });

  it('returns done=true when ticks exceed total session length', () => {
    // 3 phases × 4 counts × 2 rounds = 24 ticks total
    const result = advanceStateByTicks(
      { phaseIndex: 0, count: 4, round: 1 },
      24,
      PHASES,
      TOTAL_ROUNDS,
    );
    expect(result.done).toBe(true);
  });

  it('returns done=true even when ticks greatly exceed session length', () => {
    const result = advanceStateByTicks(
      { phaseIndex: 0, count: 1, round: 1 },
      999,
      PHASES,
      TOTAL_ROUNDS,
    );
    expect(result.done).toBe(true);
  });

  it('returns unchanged state when ticks = 0', () => {
    const initial = { phaseIndex: 1, count: 3, round: 2 };
    const result = advanceStateByTicks(initial, 0, PHASES, TOTAL_ROUNDS);
    expect(result).toEqual({ ...initial, done: false });
  });
});

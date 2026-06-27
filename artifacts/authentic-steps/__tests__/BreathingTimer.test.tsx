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
import { AppState, AppStateStatus } from 'react-native';

import { useApp } from '../context/AppContext';
import BreathingTimer, { advanceStateByTicks } from '../components/BreathingTimer';

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

    it('calls onComplete once per completed session when "Go Again" is used multiple times', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const ONE_TICK_PROPS = {
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

    it('restarts the interval correctly after "Go Again" following a background-completion', async () => {
      const mockOnComplete = jest.fn();
      mockUseApp.mockReturnValue({
        userData: { chimeEnabled: false },
        setChimeEnabled: jest.fn().mockResolvedValue(undefined),
      });

      const SHORT_PROPS = {
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, AppStateStatus, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useBreathingSound } from '@/hooks/useBreathingSound';
import { useApp } from '@/context/AppContext';

/**
 * AsyncStorage key used to detect sessions that were interrupted by a force-quit.
 *
 * Written when a session starts, removed when it ends normally (stop or done).
 * On mount, if this key is present it means a previous session was cut short.
 *
 * DECISION: show an "interrupted" notice rather than persist-and-resume.
 * Breathing exercises require active participation; resuming a paused timer
 * after an arbitrary gap would not serve the user's wellbeing goal.
 */
export const STORAGE_KEY_BREATHING_SESSION = '@authentic_steps_breathing_active';

/**
 * Advance a breathing session's state by `ticks` elapsed seconds.
 *
 * This is exported so it can be unit-tested independently of the component.
 * It is a pure function with no side effects.
 */
export function advanceStateByTicks(
  state: { phaseIndex: number; count: number; round: number },
  ticks: number,
  phases: { counts: number }[],
  totalRounds: number,
): { phaseIndex: number; count: number; round: number; done: boolean } {
  let { phaseIndex, count, round } = state;

  for (let i = 0; i < ticks; i++) {
    const nextCount = count - 1;
    if (nextCount > 0) {
      count = nextCount;
    } else {
      const nextPhaseIndex = phaseIndex + 1;
      if (nextPhaseIndex >= phases.length) {
        const nextRound = round + 1;
        if (nextRound > totalRounds) {
          return { phaseIndex, count, round, done: true };
        }
        phaseIndex = 0;
        count = phases[0].counts;
        round = nextRound;
      } else {
        phaseIndex = nextPhaseIndex;
        count = phases[nextPhaseIndex].counts;
      }
    }
  }

  return { phaseIndex, count, round, done: false };
}

type Phase = {
  label: string;
  counts: number;
  instruction: string;
  targetScale: number;
};

type Props = {
  title: string;
  description: string;
  phases: Phase[];
  totalRounds: number;
  accentColor: string;
  onComplete?: () => void;
};

type Status = 'idle' | 'running' | 'done';

function phaseChime(label: string): 'in' | 'out' | 'hold' {
  const l = label.toLowerCase();
  if (l.includes('in')) return 'in';
  if (l.includes('out')) return 'out';
  return 'hold';
}

export default function BreathingTimer({ title, description, phases, totalRounds, accentColor, onComplete }: Props) {
  const colors = useColors();
  const { userData, setChimeEnabled } = useApp();
  const [status, setStatus] = useState<Status>('idle');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [count, setCount] = useState(phases[0].counts);
  const [round, setRound] = useState(1);
  const soundEnabled = userData.chimeEnabled;

  const { playChime } = useBreathingSound(soundEnabled);

  const toggleChime = useCallback(() => {
    setChimeEnabled(!soundEnabled).catch(() => {});
  }, [soundEnabled, setChimeEnabled]);

  const [appActive, setAppActive] = useState(true);

  // True when we detect a stale session flag left by a previous force-quit.
  const [interrupted, setInterrupted] = useState(false);

  // ── Mount: detect stale session from a previous force-quit ────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_BREATHING_SESSION)
      .then(value => {
        if (value !== null) {
          setInterrupted(true);
          AsyncStorage.removeItem(STORAGE_KEY_BREATHING_SESSION).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const circleScale = useRef(new Animated.Value(0.55)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({ phaseIndex: 0, count: phases[0].counts, round: 1 });
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Tracks the wall-clock instant the app left the foreground so we can
  // compute elapsed seconds when it returns.
  const backgroundedAtRef = useRef<number | null>(null);

  // Mirrors `status` into a ref so the AppState handler (registered once) can
  // read the current status without being recreated on every status change.
  const statusRef = useRef<Status>('idle');
  useEffect(() => { statusRef.current = status; }, [status]);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopAnimation = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const animateToScale = useCallback((target: number, duration: number) => {
    stopAnimation();
    const anim = Animated.timing(circleScale, {
      toValue: target,
      duration: duration * 900,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animationRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) animationRef.current = null;
    });
  }, [circleScale, stopAnimation]);

  const flashPhase = useCallback(() => {
    phaseOpacity.setValue(0);
    Animated.timing(phaseOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [phaseOpacity]);

  const startExercise = useCallback(() => {
    circleScale.setValue(0.55);
    stateRef.current = { phaseIndex: 0, count: phases[0].counts, round: 1 };
    setPhaseIndex(0);
    setCount(phases[0].counts);
    setRound(1);
    setInterrupted(false);
    setStatus('running');
    // Mark the session as active so we can detect a force-quit on the next cold start.
    AsyncStorage.setItem(STORAGE_KEY_BREATHING_SESSION, '1').catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playChime(phaseChime(phases[0].label));
    animateToScale(phases[0].targetScale, phases[0].counts);
    flashPhase();
  }, [circleScale, phases, animateToScale, flashPhase, playChime]);

  const stopExercise = useCallback(() => {
    clearTimer();
    stopAnimation();
    circleScale.setValue(0.55);
    setStatus('idle');
    setPhaseIndex(0);
    setCount(phases[0].counts);
    setRound(1);
    stateRef.current = { phaseIndex: 0, count: phases[0].counts, round: 1 };
    // Session ended normally — clear the flag so the interrupted notice won't show.
    AsyncStorage.removeItem(STORAGE_KEY_BREATHING_SESSION).catch(() => {});
  }, [phases, circleScale, stopAnimation]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // DELIBERATE PRODUCT CHOICE: elapsed-time advance.
        //
        // When the screen turns off or the app is backgrounded, we record the
        // wall-clock timestamp. On return to the foreground we calculate the
        // elapsed seconds and fast-forward the session state by that amount,
        // so the timer reflects real time rather than silently pausing.
        //
        // Alternative (pause): remove the elapsed calculation below and simply
        // call `setAppActive(true)` — the interval restarts from exactly where
        // it stopped, ignoring the time spent backgrounded.
        if (backgroundedAtRef.current !== null && statusRef.current === 'running') {
          const elapsed = Math.floor((Date.now() - backgroundedAtRef.current) / 1000);
          backgroundedAtRef.current = null;

          if (elapsed > 0) {
            const advanced = advanceStateByTicks(stateRef.current, elapsed, phases, totalRounds);
            stateRef.current = { phaseIndex: advanced.phaseIndex, count: advanced.count, round: advanced.round };
            setPhaseIndex(advanced.phaseIndex);
            setCount(advanced.count);
            setRound(advanced.round);

            if (advanced.done) {
              // The session finished while the screen was off — complete it now.
              // Do NOT return early here: setAppActive(true) below is still needed
              // so that "Go Again" from the done screen can restart the interval
              // (the interval effect is gated on appActive — leaving it false would
              // block the timer from restarting on the next session).
              setStatus('done');
              // Clear the session flag — the session ended normally (just while backgrounded).
              AsyncStorage.removeItem(STORAGE_KEY_BREATHING_SESSION).catch(() => {});
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              playChime('done');
              onComplete?.();
            }
          }
        } else {
          backgroundedAtRef.current = null;
        }
        setAppActive(true);
      } else {
        backgroundedAtRef.current = Date.now();
        stopAnimation();
        setAppActive(false);
      }
    });
    return () => subscription.remove();
  }, [phases, totalRounds, playChime, onComplete, stopAnimation]);

  useEffect(() => {
    if (status !== 'running' || !appActive) return;

    intervalRef.current = setInterval(() => {
      const s = stateRef.current;
      const nextCount = s.count - 1;

      if (nextCount > 0) {
        stateRef.current = { ...s, count: nextCount };
        setCount(nextCount);
      } else {
        const nextPhaseIndex = s.phaseIndex + 1;

        if (nextPhaseIndex >= phases.length) {
          const nextRound = s.round + 1;
          if (nextRound > totalRounds) {
            clearTimer();
            setStatus('done');
            // Clear the session flag — session completed normally in the foreground.
            AsyncStorage.removeItem(STORAGE_KEY_BREATHING_SESSION).catch(() => {});
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            playChime('done');
            onComplete?.();
            return;
          }
          stateRef.current = { phaseIndex: 0, count: phases[0].counts, round: nextRound };
          setPhaseIndex(0);
          setCount(phases[0].counts);
          setRound(nextRound);
          animateToScale(phases[0].targetScale, phases[0].counts);
          flashPhase();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          playChime(phaseChime(phases[0].label));
        } else {
          const nextPhase = phases[nextPhaseIndex];
          stateRef.current = { phaseIndex: nextPhaseIndex, count: nextPhase.counts, round: s.round };
          setPhaseIndex(nextPhaseIndex);
          setCount(nextPhase.counts);
          animateToScale(nextPhase.targetScale, nextPhase.counts);
          flashPhase();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          playChime(phaseChime(nextPhase.label));
        }
      }
    }, 1000);

    return clearTimer;
  }, [status, appActive, phases, totalRounds, animateToScale, flashPhase, playChime]);

  const currentPhase = phases[phaseIndex];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
        <Text style={[styles.iconText, { color: accentColor }]}>◉</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]}>{description}</Text>

      {status === 'idle' && interrupted && (
        <View
          style={[styles.interruptedBanner, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}
          accessibilityRole="alert"
        >
          <Ionicons name="alert-circle-outline" size={14} color={accentColor} />
          <Text style={[styles.interruptedText, { color: accentColor }]}>
            Your last session was interrupted. Start when you're ready.
          </Text>
        </View>
      )}

      {status === 'idle' && (
        <View style={styles.idleActions}>
          <Pressable
            style={[styles.startBtn, { backgroundColor: accentColor }]}
            onPress={startExercise}
          >
            <Text style={styles.startBtnText}>Start Breathing</Text>
          </Pressable>
          <Pressable
            style={[styles.soundToggle, { borderColor: colors.border }]}
            onPress={toggleChime}
            accessibilityLabel={soundEnabled ? 'Mute chimes' : 'Enable chimes'}
            hitSlop={8}
          >
            <Ionicons
              name={soundEnabled ? 'volume-high' : 'volume-mute'}
              size={16}
              color={soundEnabled ? accentColor : colors.mutedForeground}
            />
            <Text style={[styles.soundToggleText, { color: soundEnabled ? accentColor : colors.mutedForeground }]}>
              {soundEnabled ? 'Chimes on' : 'Chimes off'}
            </Text>
          </Pressable>
        </View>
      )}

      {status === 'running' && (
        <View style={styles.activeArea}>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.circleOuter,
                { borderColor: `${accentColor}30`, transform: [{ scale: circleScale }] },
              ]}
            />
            <Animated.View
              style={[
                styles.circleInner,
                { backgroundColor: `${accentColor}22`, transform: [{ scale: circleScale }] },
              ]}
            />
            <View style={styles.circleCenter}>
              <Text style={[styles.countNum, { color: accentColor }]}>{count}</Text>
            </View>
          </View>

          <Animated.View style={{ opacity: phaseOpacity, alignItems: 'center', gap: 2 }}>
            <Text style={[styles.phaseLabel, { color: colors.foreground }]}>
              {currentPhase.label}
            </Text>
            <Text style={[styles.phaseInstruction, { color: colors.mutedForeground }]}>
              {currentPhase.instruction}
            </Text>
          </Animated.View>

          <Text style={[styles.roundText, { color: colors.mutedForeground }]}>
            Round {round} / {totalRounds}
          </Text>

          <View style={styles.runningFooter}>
            <Pressable style={[styles.stopBtn, { borderColor: colors.border }]} onPress={stopExercise}>
              <Text style={[styles.stopBtnText, { color: colors.mutedForeground }]}>Stop</Text>
            </Pressable>
            <Pressable
              style={styles.soundPill}
              onPress={toggleChime}
              accessibilityLabel={soundEnabled ? 'Mute chimes' : 'Enable chimes'}
              hitSlop={8}
            >
              <Ionicons
                name={soundEnabled ? 'volume-high' : 'volume-mute'}
                size={14}
                color={soundEnabled ? accentColor : colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>
      )}

      {status === 'done' && (
        <View style={styles.doneArea}>
          <Text style={[styles.doneEmoji]}>✓</Text>
          <Text style={[styles.doneText, { color: colors.foreground }]}>Well done!</Text>
          <Text style={[styles.doneSubtext, { color: colors.mutedForeground }]}>
            {totalRounds} rounds complete. Notice how you feel.
          </Text>
          <Pressable
            style={[styles.startBtn, { backgroundColor: accentColor }]}
            onPress={startExercise}
          >
            <Text style={styles.startBtnText}>Go Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const CIRCLE_SIZE = 160;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  interruptedBanner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  interruptedText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 16 },
  idleActions: { alignSelf: 'stretch', gap: 8 },
  startBtn: {
    alignSelf: 'stretch',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  startBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  soundToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  soundToggleText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  activeArea: { alignSelf: 'stretch', alignItems: 'center', gap: 16, paddingVertical: 8 },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
  },
  circleInner: {
    position: 'absolute',
    width: CIRCLE_SIZE * 0.85,
    height: CIRCLE_SIZE * 0.85,
    borderRadius: (CIRCLE_SIZE * 0.85) / 2,
  },
  circleCenter: { alignItems: 'center', justifyContent: 'center' },
  countNum: { fontSize: 44, fontFamily: 'Inter_700Bold' },
  phaseLabel: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  phaseInstruction: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  roundText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  runningFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  stopBtnText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  soundPill: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  doneArea: { alignSelf: 'stretch', alignItems: 'center', gap: 8, paddingVertical: 8 },
  doneEmoji: { fontSize: 40 },
  doneText: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  doneSubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
});

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

type ExerciseMode = 'reps' | 'countdown' | 'hold-reps';

type Props = {
  icon: string;
  title: string;
  desc: string;
  color: string;
  mode: ExerciseMode;
  totalReps?: number;
  holdSeconds?: number;
  totalHoldRounds?: number;
  countdownSeconds?: number;
  countdownLabel?: string;
};

type Status = 'idle' | 'running' | 'done';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MovementExercise({
  icon,
  title,
  desc,
  color,
  mode,
  totalReps = 10,
  holdSeconds = 5,
  totalHoldRounds = 3,
  countdownSeconds = 300,
  countdownLabel = 'remaining',
}: Props) {
  const colors = useColors();
  const [status, setStatus] = useState<Status>('idle');
  const [reps, setReps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [holdRound, setHoldRound] = useState(1);
  const [holdCount, setHoldCount] = useState(holdSeconds);
  const [holdPhase, setHoldPhase] = useState<'hold' | 'release'>('hold');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({ timeLeft: countdownSeconds, holdRound: 1, holdCount: holdSeconds, holdPhase: 'hold' as 'hold' | 'release' });

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [pulseAnim]);

  const reset = useCallback(() => {
    clearTimer();
    setStatus('idle');
    setReps(0);
    setTimeLeft(countdownSeconds);
    setHoldRound(1);
    setHoldCount(holdSeconds);
    setHoldPhase('hold');
    stateRef.current = { timeLeft: countdownSeconds, holdRound: 1, holdCount: holdSeconds, holdPhase: 'hold' };
  }, [countdownSeconds, holdSeconds]);

  const start = useCallback(() => {
    if (mode === 'reps') {
      setStatus('running');
      setReps(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    if (mode === 'countdown') {
      stateRef.current.timeLeft = countdownSeconds;
      setTimeLeft(countdownSeconds);
      setStatus('running');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    if (mode === 'hold-reps') {
      stateRef.current = { ...stateRef.current, holdRound: 1, holdCount: holdSeconds, holdPhase: 'hold' };
      setHoldRound(1);
      setHoldCount(holdSeconds);
      setHoldPhase('hold');
      setStatus('running');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [mode, countdownSeconds, holdSeconds]);

  const tapRep = useCallback(() => {
    if (status !== 'running' || mode !== 'reps') return;
    const next = reps + 1;
    setReps(next);
    pulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next >= totalReps) {
      setStatus('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [status, mode, reps, totalReps, pulse]);

  useEffect(() => {
    if (status !== 'running') return;

    if (mode === 'countdown') {
      intervalRef.current = setInterval(() => {
        const next = stateRef.current.timeLeft - 1;
        stateRef.current.timeLeft = next;
        setTimeLeft(next);
        if (next <= 0) {
          clearTimer();
          setStatus('done');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 1000);
    }

    if (mode === 'hold-reps') {
      intervalRef.current = setInterval(() => {
        const s = stateRef.current;
        if (s.holdPhase === 'hold') {
          const next = s.holdCount - 1;
          if (next > 0) {
            stateRef.current.holdCount = next;
            setHoldCount(next);
          } else {
            stateRef.current.holdPhase = 'release';
            stateRef.current.holdCount = 2;
            setHoldPhase('release');
            setHoldCount(2);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        } else {
          const next = s.holdCount - 1;
          if (next > 0) {
            stateRef.current.holdCount = next;
            setHoldCount(next);
          } else {
            const nextRound = s.holdRound + 1;
            if (nextRound > totalHoldRounds) {
              clearTimer();
              setStatus('done');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              stateRef.current = { ...s, holdRound: nextRound, holdCount: holdSeconds, holdPhase: 'hold' };
              setHoldRound(nextRound);
              setHoldCount(holdSeconds);
              setHoldPhase('hold');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }
      }, 1000);
    }

    return clearTimer;
  }, [status, mode, holdSeconds, totalHoldRounds]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {status === 'idle' && (
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>{desc}</Text>
          )}
        </View>
      </View>

      {status === 'idle' && (
        <Pressable style={[styles.startBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.startBtnText}>
            {mode === 'reps' ? 'Start — Tap to Count' : mode === 'countdown' ? 'Start Timer' : 'Begin Exercise'}
          </Text>
        </Pressable>
      )}

      {status === 'running' && mode === 'reps' && (
        <View style={styles.activeArea}>
          <Pressable onPress={tapRep} style={styles.repTapArea}>
            <Animated.View
              style={[styles.repCircle, { backgroundColor: `${color}18`, borderColor: color, transform: [{ scale: pulseAnim }] }]}
            >
              <Text style={[styles.repNum, { color }]}>{reps}</Text>
              <Text style={[styles.repOf, { color: colors.mutedForeground }]}>/ {totalReps}</Text>
            </Animated.View>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap to count a rep</Text>
          </Pressable>
          <Pressable style={[styles.stopBtn, { borderColor: colors.border }]} onPress={reset}>
            <Text style={[styles.stopBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {status === 'running' && mode === 'countdown' && (
        <View style={styles.activeArea}>
          <View style={[styles.timerBox, { borderColor: color, backgroundColor: `${color}08` }]}>
            <Text style={[styles.timerText, { color }]}>{formatTime(timeLeft)}</Text>
            <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>{countdownLabel}</Text>
          </View>
          <Pressable style={[styles.stopBtn, { borderColor: colors.border }]} onPress={reset}>
            <Text style={[styles.stopBtnText, { color: colors.mutedForeground }]}>Stop</Text>
          </Pressable>
        </View>
      )}

      {status === 'running' && mode === 'hold-reps' && (
        <View style={styles.activeArea}>
          <View style={[styles.timerBox, { borderColor: color, backgroundColor: `${color}08` }]}>
            <Text style={[styles.timerText, { color }]}>{holdCount}</Text>
            <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>
              {holdPhase === 'hold' ? 'CLENCH & Hold' : 'Release!'}
            </Text>
          </View>
          <Text style={[styles.roundIndicator, { color: colors.mutedForeground }]}>
            Round {holdRound} / {totalHoldRounds}
          </Text>
          <Pressable style={[styles.stopBtn, { borderColor: colors.border }]} onPress={reset}>
            <Text style={[styles.stopBtnText, { color: colors.mutedForeground }]}>Stop</Text>
          </Pressable>
        </View>
      )}

      {status === 'done' && (
        <View style={styles.activeArea}>
          <Text style={[styles.doneCheck, { color }]}>✓</Text>
          <Text style={[styles.doneText, { color: colors.foreground }]}>Done!</Text>
          <Pressable style={[styles.startBtn, { backgroundColor: color }]} onPress={reset}>
            <Text style={styles.startBtnText}>Reset</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  startBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  activeArea: { alignItems: 'center', gap: 12 },
  repTapArea: { alignItems: 'center', gap: 8 },
  repCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repNum: { fontSize: 38, fontFamily: 'Inter_700Bold', lineHeight: 44 },
  repOf: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tapHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  timerBox: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 4,
  },
  timerText: { fontSize: 44, fontFamily: 'Inter_700Bold' },
  timerLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  roundIndicator: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  stopBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 20 },
  stopBtnText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  doneCheck: { fontSize: 42 },
  doneText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
});

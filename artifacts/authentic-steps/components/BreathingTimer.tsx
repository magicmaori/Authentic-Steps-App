import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useBreathingSound } from '@/hooks/useBreathingSound';

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
  const [status, setStatus] = useState<Status>('idle');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [count, setCount] = useState(phases[0].counts);
  const [round, setRound] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const { playChime } = useBreathingSound(soundEnabled);

  const circleScale = useRef(new Animated.Value(0.55)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({ phaseIndex: 0, count: phases[0].counts, round: 1 });

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const animateToScale = useCallback((target: number, duration: number) => {
    Animated.timing(circleScale, {
      toValue: target,
      duration: duration * 900,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [circleScale]);

  const flashPhase = useCallback(() => {
    phaseOpacity.setValue(0);
    Animated.timing(phaseOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [phaseOpacity]);

  const startExercise = useCallback(() => {
    stateRef.current = { phaseIndex: 0, count: phases[0].counts, round: 1 };
    setPhaseIndex(0);
    setCount(phases[0].counts);
    setRound(1);
    setStatus('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playChime(phaseChime(phases[0].label));
    animateToScale(phases[0].targetScale, phases[0].counts);
    flashPhase();
  }, [phases, animateToScale, flashPhase, playChime]);

  const stopExercise = useCallback(() => {
    clearTimer();
    circleScale.setValue(0.55);
    setStatus('idle');
    setPhaseIndex(0);
    setCount(phases[0].counts);
    setRound(1);
    stateRef.current = { phaseIndex: 0, count: phases[0].counts, round: 1 };
  }, [phases, circleScale]);

  useEffect(() => {
    if (status !== 'running') return;

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
  }, [status, phases, totalRounds, animateToScale, flashPhase, playChime]);

  const currentPhase = phases[phaseIndex];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
        <Text style={[styles.iconText, { color: accentColor }]}>◉</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]}>{description}</Text>

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
            onPress={() => setSoundEnabled(v => !v)}
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
              onPress={() => setSoundEnabled(v => !v)}
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

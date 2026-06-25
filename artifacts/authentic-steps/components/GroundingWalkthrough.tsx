import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

type Step = {
  n: string;
  sense: string;
  icon: string;
  prompt: string;
};

const STEPS: Step[] = [
  { n: '5', sense: 'things you can SEE', icon: 'eye', prompt: 'Look around. Name 5 things you can see right now.' },
  { n: '4', sense: 'things you can TOUCH', icon: 'hand-right', prompt: 'Feel your surroundings. Name 4 things you can physically touch.' },
  { n: '3', sense: 'things you can HEAR', icon: 'ear', prompt: 'Listen carefully. Name 3 sounds you can hear right now.' },
  { n: '2', sense: 'things you can SMELL', icon: 'flower', prompt: 'Notice any scents around you. Name 2 things you can smell.' },
  { n: '1', sense: 'thing you can TASTE', icon: 'restaurant', prompt: 'Focus on your mouth. Name 1 thing you can taste.' },
];

type Status = 'idle' | 'running' | 'done';

type Props = {
  onComplete?: () => void;
};

export default function GroundingWalkthrough({ onComplete }: Props = {}) {
  const colors = useColors();
  const [status, setStatus] = useState<Status>('idle');
  const [stepIndex, setStepIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      callback();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const start = () => {
    setStepIndex(0);
    setStatus('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const next = () => {
    if (stepIndex < STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateTransition(() => setStepIndex(i => i + 1));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateTransition(() => {
        setStatus('done');
        onComplete?.();
      });
    }
  };

  const reset = () => {
    setStepIndex(0);
    setStatus('idle');
  };

  const step = STEPS[stepIndex];
  const accentColor = '#03989e';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.titleRow}>
        <View style={[styles.badge, { backgroundColor: accentColor }]}>
          <Ionicons name="leaf" size={16} color="#fff" />
        </View>
        <Text style={[styles.heading, { color: colors.foreground }]}>5-4-3-2-1 Grounding</Text>
      </View>

      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        Brings you back to the present moment when overwhelmed. Work through each sense, one at a time.
      </Text>

      {status === 'idle' && (
        <>
          <View style={styles.previewSteps}>
            {STEPS.map((s, i) => (
              <View key={s.n} style={styles.previewRow}>
                <View style={[styles.previewBadge, { backgroundColor: `${accentColor}20` }]}>
                  <Text style={[styles.previewNum, { color: accentColor }]}>{s.n}</Text>
                </View>
                <Text style={[styles.previewSense, { color: colors.foreground }]}>{s.sense}</Text>
                <Ionicons name={s.icon as any} size={15} color={colors.mutedForeground} />
              </View>
            ))}
          </View>
          <Pressable style={[styles.startBtn, { backgroundColor: accentColor }]} onPress={start}>
            <Text style={styles.startBtnText}>Begin Grounding</Text>
          </Pressable>
        </>
      )}

      {status === 'running' && (
        <>
          <View style={styles.progressRow}>
            {STEPS.map((s, i) => (
              <View
                key={s.n}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i <= stepIndex ? accentColor : `${accentColor}25`,
                    width: i === stepIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <Animated.View
            style={[
              styles.stepCard,
              { backgroundColor: `${accentColor}0D`, borderColor: `${accentColor}30`, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.stepNumRow}>
              <View style={[styles.stepBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.stepNum}>{step.n}</Text>
              </View>
              <Ionicons name={step.icon as any} size={22} color={accentColor} />
            </View>
            <Text style={[styles.stepSense, { color: colors.foreground }]}>{step.sense}</Text>
            <Text style={[styles.stepPrompt, { color: colors.mutedForeground }]}>{step.prompt}</Text>
          </Animated.View>

          <Text style={[styles.stepCounter, { color: colors.mutedForeground }]}>
            Step {stepIndex + 1} of {STEPS.length}
          </Text>

          <View style={styles.btnRow}>
            <Pressable style={[styles.stopBtn, { borderColor: colors.border }]} onPress={reset}>
              <Text style={[styles.stopBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.nextBtn, { backgroundColor: accentColor, flex: 1 }]} onPress={next}>
              <Text style={styles.nextBtnText}>
                {stepIndex < STEPS.length - 1 ? 'Next →' : 'Finish ✓'}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {status === 'done' && (
        <View style={styles.doneArea}>
          <Text style={[styles.doneEmoji, { color: accentColor }]}>✓</Text>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Grounding complete</Text>
          <Text style={[styles.doneText, { color: colors.mutedForeground }]}>
            All 5 senses checked. Take a breath and notice how present you feel right now.
          </Text>
          <Pressable style={[styles.startBtn, { backgroundColor: accentColor }]} onPress={reset}>
            <Text style={styles.startBtnText}>Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  intro: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -6 },

  previewSteps: { gap: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  previewNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  previewSense: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { height: 8, borderRadius: 4 },

  stepCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  stepNumRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  stepSense: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 24 },
  stepPrompt: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  stepCounter: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  btnRow: { flexDirection: 'row', gap: 10 },
  stopBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  stopBtnText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  nextBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  startBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  doneArea: { alignItems: 'center', gap: 10 },
  doneEmoji: { fontSize: 44 },
  doneTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  doneText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
});

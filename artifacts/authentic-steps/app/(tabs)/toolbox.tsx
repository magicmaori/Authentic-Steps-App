import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BreathingTimer from '@/components/BreathingTimer';
import GroundingWalkthrough from '@/components/GroundingWalkthrough';
import MovementExercise from '@/components/MovementExercise';
import { useColors } from '@/hooks/useColors';

const TIPS = [
  { icon: 'walk', title: 'Move your body', desc: 'Even 10 minutes outside can shift how you feel.' },
  { icon: 'call', title: 'Reach out', desc: 'Text one person you trust — not asking for help, just connecting.' },
  { icon: 'water', title: 'Ground yourself', desc: 'Name 5 things you can see. Slow your breathing.' },
  { icon: 'moon', title: 'Rest without guilt', desc: 'Rest is productive. Your body is working when you sleep.' },
];

const BOX_BREATHING_PHASES = [
  { label: 'Breathe IN', instruction: 'Inhale slowly through your nose', counts: 4, targetScale: 1.15 },
  { label: 'HOLD', instruction: 'Keep air in, stay still', counts: 4, targetScale: 1.15 },
  { label: 'Breathe OUT', instruction: 'Exhale fully through your mouth', counts: 4, targetScale: 0.55 },
  { label: 'HOLD', instruction: 'Empty lungs, stay still', counts: 4, targetScale: 0.55 },
];

const CALM_DOWN_PHASES = [
  { label: 'Breathe IN', instruction: 'Inhale through your nose', counts: 4, targetScale: 1.15 },
  { label: 'HOLD', instruction: 'Hold your breath gently', counts: 7, targetScale: 1.15 },
  { label: 'Breathe OUT', instruction: 'Exhale fully through your mouth', counts: 8, targetScale: 0.55 },
];

export default function ToolboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Resilience Toolbox</Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
          Practical tools to help you reset, ground, and recover.
        </Text>

        <View style={[styles.tipsSection]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resilience Toolkit</Text>
          <View style={styles.tipsGrid}>
            {TIPS.map(tip => (
              <View
                key={tip.title}
                style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name={tip.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
                <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>{tip.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.breathingSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Breathing Exercises</Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Slow breathing signals safety to your nervous system. Tap to start a guided timer.
          </Text>

          <BreathingTimer
            title="Box Breathing"
            description="Used by athletes and first responders to reset fast."
            phases={BOX_BREATHING_PHASES}
            totalRounds={4}
            accentColor="#03989e"
          />

          <BreathingTimer
            title="4-7-8 Calm Down"
            description="Great for anxiety, panic, or when you can't sleep."
            phases={CALM_DOWN_PHASES}
            totalRounds={4}
            accentColor="#193b83"
          />
        </View>

        <View style={styles.exerciseSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Move to Reset</Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Physical movement burns off stress hormones and shifts your mood fast. Tap to start.
          </Text>

          <MovementExercise
            icon="body"
            title="10 Star Jumps"
            desc="Gets blood moving and releases tension held in the body. Do them big — arms and legs fully extended."
            color="#2D6A4F"
            mode="reps"
            totalReps={10}
          />

          <MovementExercise
            icon="walk"
            title="Walk & Count"
            desc="Go for a 5-minute walk and silently count your steps. Counting keeps your mind present."
            color="#193b83"
            mode="countdown"
            countdownSeconds={300}
            countdownLabel="remaining"
          />

          <MovementExercise
            icon="hand-left"
            title="Progressive Muscle Release"
            desc="Clench every muscle tight for 5 seconds — fists, arms, shoulders, legs — then release all at once."
            color="#03989e"
            mode="hold-reps"
            holdSeconds={5}
            totalHoldRounds={3}
          />

          <MovementExercise
            icon="water"
            title="Cold Water Reset"
            desc="Splash cold water on your face or hold ice cubes. Activates the dive reflex and slows your heart rate."
            color="#1D4ED8"
            mode="countdown"
            countdownSeconds={30}
            countdownLabel="hold or splash"
          />
        </View>

        <GroundingWalkthrough />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  screenTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  screenSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 4 },

  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  sectionHint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -4 },

  tipsSection: { gap: 8 },
  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    width: '47%',
  },
  tipIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tipDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },

  breathingSection: { gap: 12 },
  exerciseSection: { gap: 10 },
});

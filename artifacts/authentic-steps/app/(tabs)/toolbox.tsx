import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BreathingTimer from '@/components/BreathingTimer';
import GroundingWalkthrough from '@/components/GroundingWalkthrough';
import MovementExercise from '@/components/MovementExercise';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const TIPS = [
  { id: 'tip-move', icon: 'walk', title: 'Move your body', desc: 'Even 10 minutes outside can shift how you feel.' },
  { id: 'tip-reach', icon: 'call', title: 'Reach out', desc: 'Text one person you trust — not asking for help, just connecting.' },
  { id: 'tip-ground', icon: 'water', title: 'Ground yourself', desc: 'Name 5 things you can see. Slow your breathing.' },
  { id: 'tip-rest', icon: 'moon', title: 'Rest without guilt', desc: 'Rest is productive. Your body is working when you sleep.' },
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

function HeartButton({ toolId }: { toolId: string }) {
  const { userData, toggleFavouriteTool } = useApp();
  const colors = useColors();
  const isFav = (userData.favouriteTools ?? []).includes(toolId);

  return (
    <Pressable
      style={styles.heartBtn}
      onPress={() => toggleFavouriteTool(toolId)}
      hitSlop={10}
      accessibilityLabel={isFav ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Ionicons
        name={isFav ? 'heart' : 'heart-outline'}
        size={18}
        color={isFav ? '#e53e3e' : colors.mutedForeground}
      />
    </Pressable>
  );
}

function DoneBadge() {
  return (
    <View style={styles.doneBadge}>
      <Ionicons name="checkmark-circle" size={14} color="#fff" />
      <Text style={styles.doneBadgeText}>Done today</Text>
    </View>
  );
}

function ToolCard({ toolId, children, style, isDone }: { toolId: string; children: React.ReactNode; style?: ViewStyle; isDone?: boolean }) {
  return (
    <View style={[styles.toolWrapper, style]}>
      {children}
      <HeartButton toolId={toolId} />
      {isDone && <DoneBadge />}
    </View>
  );
}

function TipCard({ tip, fullWidth }: { tip: typeof TIPS[0]; fullWidth?: boolean }) {
  const colors = useColors();
  return (
    <ToolCard toolId={tip.id} style={fullWidth ? undefined : { width: '47%' }}>
      <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.tipIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name={tip.icon as any} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
        <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>{tip.desc}</Text>
      </View>
    </ToolCard>
  );
}

function GoToSection() {
  const { userData, isExerciseDoneToday, markExerciseDone } = useApp();
  const colors = useColors();
  const favs = userData.favouriteTools ?? [];
  if (favs.length === 0) return null;

  const favTips = TIPS.filter(t => favs.includes(t.id));
  const hasBoxBreathing = favs.includes('breathing-box');
  const has478 = favs.includes('breathing-478');
  const hasStarJumps = favs.includes('movement-star-jumps');
  const hasWalk = favs.includes('movement-walk');
  const hasMuscle = favs.includes('movement-muscle');
  const hasColdWater = favs.includes('movement-cold-water');
  const hasGrounding = favs.includes('grounding-54321');

  return (
    <View style={[styles.goToSection, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
      <View style={styles.goToHeader}>
        <Ionicons name="heart" size={16} color="#e53e3e" />
        <Text style={[styles.goToTitle, { color: colors.foreground }]}>Your go-tos</Text>
      </View>
      <View style={styles.goToList}>
        {favTips.map(tip => (
          <TipCard key={tip.id} tip={tip} fullWidth />
        ))}
        {hasBoxBreathing && (
          <ToolCard toolId="breathing-box" isDone={isExerciseDoneToday('breathing-box')}>
            <BreathingTimer
              title="Box Breathing"
              description="Used by athletes and first responders to reset fast."
              phases={BOX_BREATHING_PHASES}
              totalRounds={4}
              accentColor="#03989e"
              onComplete={() => markExerciseDone('breathing-box')}
            />
          </ToolCard>
        )}
        {has478 && (
          <ToolCard toolId="breathing-478" isDone={isExerciseDoneToday('breathing-478')}>
            <BreathingTimer
              title="4-7-8 Calm Down"
              description="Great for anxiety, panic, or when you can't sleep."
              phases={CALM_DOWN_PHASES}
              totalRounds={4}
              accentColor="#193b83"
              onComplete={() => markExerciseDone('breathing-478')}
            />
          </ToolCard>
        )}
        {hasStarJumps && (
          <ToolCard toolId="movement-star-jumps" isDone={isExerciseDoneToday('movement-star-jumps')}>
            <MovementExercise
              icon="body"
              title="10 Star Jumps"
              desc="Gets blood moving and releases tension held in the body. Do them big — arms and legs fully extended."
              color="#2D6A4F"
              mode="reps"
              totalReps={10}
              onComplete={() => markExerciseDone('movement-star-jumps')}
            />
          </ToolCard>
        )}
        {hasWalk && (
          <ToolCard toolId="movement-walk" isDone={isExerciseDoneToday('movement-walk')}>
            <MovementExercise
              icon="walk"
              title="Walk & Count"
              desc="Go for a 5-minute walk and silently count your steps. Counting keeps your mind present."
              color="#193b83"
              mode="countdown"
              countdownSeconds={300}
              countdownLabel="remaining"
              onComplete={() => markExerciseDone('movement-walk')}
            />
          </ToolCard>
        )}
        {hasMuscle && (
          <ToolCard toolId="movement-muscle" isDone={isExerciseDoneToday('movement-muscle')}>
            <MovementExercise
              icon="hand-left"
              title="Progressive Muscle Release"
              desc="Clench every muscle tight for 5 seconds — fists, arms, shoulders, legs — then release all at once."
              color="#03989e"
              mode="hold-reps"
              holdSeconds={5}
              totalHoldRounds={3}
              onComplete={() => markExerciseDone('movement-muscle')}
            />
          </ToolCard>
        )}
        {hasColdWater && (
          <ToolCard toolId="movement-cold-water" isDone={isExerciseDoneToday('movement-cold-water')}>
            <MovementExercise
              icon="water"
              title="Cold Water Reset"
              desc="Splash cold water on your face or hold ice cubes. Activates the dive reflex and slows your heart rate."
              color="#1D4ED8"
              mode="countdown"
              countdownSeconds={30}
              countdownLabel="hold or splash"
              onComplete={() => markExerciseDone('movement-cold-water')}
            />
          </ToolCard>
        )}
        {hasGrounding && (
          <ToolCard toolId="grounding-54321" isDone={isExerciseDoneToday('grounding-54321')}>
            <GroundingWalkthrough onComplete={() => markExerciseDone('grounding-54321')} />
          </ToolCard>
        )}
      </View>
    </View>
  );
}

export default function ToolboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isExerciseDoneToday, markExerciseDone } = useApp();

  const breathingIds = ['breathing-box', 'breathing-478'];
  const movementIds = ['movement-star-jumps', 'movement-walk', 'movement-muscle', 'movement-cold-water'];
  const breathingDone = breathingIds.filter(id => isExerciseDoneToday(id)).length;
  const movementDone = movementIds.filter(id => isExerciseDoneToday(id)).length;
  const groundingDone = isExerciseDoneToday('grounding-54321');

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Resilience Toolbox</Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
          Tap the heart on any tool to pin it to the top.
        </Text>

        <GoToSection />

        <View style={[styles.tipsSection]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resilience Toolkit</Text>
          <View style={styles.tipsGrid}>
            {TIPS.map(tip => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </View>
        </View>

        <View style={styles.breathingSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Breathing Exercises</Text>
            {breathingDone > 0 && (
              <View style={styles.sectionCount}>
                <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                <Text style={[styles.sectionCountText, { color: '#22c55e' }]}>{breathingDone}/{breathingIds.length} done</Text>
              </View>
            )}
          </View>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Slow breathing signals safety to your nervous system. Tap to start a guided timer.
          </Text>

          <ToolCard toolId="breathing-box" isDone={isExerciseDoneToday('breathing-box')}>
            <BreathingTimer
              title="Box Breathing"
              description="Used by athletes and first responders to reset fast."
              phases={BOX_BREATHING_PHASES}
              totalRounds={4}
              accentColor="#03989e"
              onComplete={() => markExerciseDone('breathing-box')}
            />
          </ToolCard>

          <ToolCard toolId="breathing-478" isDone={isExerciseDoneToday('breathing-478')}>
            <BreathingTimer
              title="4-7-8 Calm Down"
              description="Great for anxiety, panic, or when you can't sleep."
              phases={CALM_DOWN_PHASES}
              totalRounds={4}
              accentColor="#193b83"
              onComplete={() => markExerciseDone('breathing-478')}
            />
          </ToolCard>
        </View>

        <View style={styles.exerciseSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Move to Reset</Text>
            {movementDone > 0 && (
              <View style={styles.sectionCount}>
                <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                <Text style={[styles.sectionCountText, { color: '#22c55e' }]}>{movementDone}/{movementIds.length} done</Text>
              </View>
            )}
          </View>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Physical movement burns off stress hormones and shifts your mood fast. Tap to start.
          </Text>

          <ToolCard toolId="movement-star-jumps" isDone={isExerciseDoneToday('movement-star-jumps')}>
            <MovementExercise
              icon="body"
              title="10 Star Jumps"
              desc="Gets blood moving and releases tension held in the body. Do them big — arms and legs fully extended."
              color="#2D6A4F"
              mode="reps"
              totalReps={10}
              onComplete={() => markExerciseDone('movement-star-jumps')}
            />
          </ToolCard>

          <ToolCard toolId="movement-walk" isDone={isExerciseDoneToday('movement-walk')}>
            <MovementExercise
              icon="walk"
              title="Walk & Count"
              desc="Go for a 5-minute walk and silently count your steps. Counting keeps your mind present."
              color="#193b83"
              mode="countdown"
              countdownSeconds={300}
              countdownLabel="remaining"
              onComplete={() => markExerciseDone('movement-walk')}
            />
          </ToolCard>

          <ToolCard toolId="movement-muscle" isDone={isExerciseDoneToday('movement-muscle')}>
            <MovementExercise
              icon="hand-left"
              title="Progressive Muscle Release"
              desc="Clench every muscle tight for 5 seconds — fists, arms, shoulders, legs — then release all at once."
              color="#03989e"
              mode="hold-reps"
              holdSeconds={5}
              totalHoldRounds={3}
              onComplete={() => markExerciseDone('movement-muscle')}
            />
          </ToolCard>

          <ToolCard toolId="movement-cold-water" isDone={isExerciseDoneToday('movement-cold-water')}>
            <MovementExercise
              icon="water"
              title="Cold Water Reset"
              desc="Splash cold water on your face or hold ice cubes. Activates the dive reflex and slows your heart rate."
              color="#1D4ED8"
              mode="countdown"
              countdownSeconds={30}
              countdownLabel="hold or splash"
              onComplete={() => markExerciseDone('movement-cold-water')}
            />
          </ToolCard>
        </View>

        <ToolCard toolId="grounding-54321" isDone={groundingDone}>
          <GroundingWalkthrough onComplete={() => markExerciseDone('grounding-54321')} />
        </ToolCard>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  tipIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tipDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },

  breathingSection: { gap: 12 },
  exerciseSection: { gap: 10 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22c55e18',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionCountText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },

  toolWrapper: {
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  doneBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  doneBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },

  goToSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  goToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goToTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  goToList: {
    gap: 10,
  },
});

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOSButton } from '@/components/SOSButton';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface RitualStep {
  id: 'gratitude' | 'intention' | 'iAm';
  label: string;
  subtitle: string;
  icon: string;
  route: string;
  completedLabel: string;
}

const STEPS: RitualStep[] = [
  {
    id: 'gratitude',
    label: 'Gratitude',
    subtitle: 'Name 3 things you are grateful for today',
    icon: 'leaf',
    route: '/ritual/gratitude',
    completedLabel: 'Gratitudes added',
  },
  {
    id: 'intention',
    label: 'Intention',
    subtitle: 'One action inside your control for today',
    icon: 'radio-button-on',
    route: '/ritual/intention',
    completedLabel: 'Intention set',
  },
  {
    id: 'iAm',
    label: 'I Am',
    subtitle: 'Choose your affirmation for today',
    icon: 'star',
    route: '/ritual/iamstatement',
    completedLabel: 'I Am chosen',
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function DailyRitualScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userData, isStepDone, todayEntry } = useApp();

  const completedCount = STEPS.filter(s => isStepDone(s.id)).length;
  const allDone = completedCount === 3;

  async function handleStepPress(step: RitualStep) {
    await Haptics.selectionAsync();
    router.push(step.route as any);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: Platform.OS === 'web' ? 160 : 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {getGreeting()}, {userData.anonymousName}
            </Text>
            <Text style={[styles.dateText, { color: colors.foreground }]}>{formatDate()}</Text>
          </View>
          {userData.currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: `${colors.accent}18` }]}>
              <Ionicons name="flame" size={16} color={colors.accent} />
              <Text style={[styles.streakBadgeText, { color: colors.accent }]}>
                {userData.currentStreak}
              </Text>
            </View>
          )}
        </View>

        {todayEntry?.iAmStatement ? (
          <LinearGradient
            colors={[`${colors.accent}20`, `${colors.accent}08`]}
            style={[styles.iAmBanner, { borderColor: `${colors.accent}30` }]}
          >
            <Text style={[styles.iAmBannerLabel, { color: colors.accent }]}>Today you are...</Text>
            <Text style={[styles.iAmBannerText, { color: colors.foreground }]}>
              {todayEntry.iAmStatement}
            </Text>
          </LinearGradient>
        ) : null}

        {allDone ? (
          <LinearGradient
            colors={[colors.primary, '#193b83']}
            style={styles.allDoneCard}
          >
            <View style={styles.allDoneCheck}>
              <Ionicons name="checkmark" size={28} color={colors.primary} />
            </View>
            <Text style={styles.allDoneTitle}>Ritual complete!</Text>
            <Text style={styles.allDoneSubtitle}>
              You showed up for yourself today. That is everything.
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.foreground }]}>Daily Ritual</Text>
              <Text style={[styles.progressCount, { color: colors.mutedForeground }]}>
                {completedCount}/3 steps
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${(completedCount / 3) * 100}%` as any,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.stepsSection}>
          {STEPS.map((step, index) => {
            const done = isStepDone(step.id);
            return (
              <Pressable
                key={step.id}
                onPress={() => handleStepPress(step)}
                style={({ pressed }) => [
                  styles.stepCard,
                  done
                    ? { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.stepLeft}>
                  <View
                    style={[
                      styles.stepNum,
                      done
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.secondary },
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text style={[styles.stepNumText, { color: colors.primary }]}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.stepText}>
                    <Text
                      style={[
                        styles.stepLabel,
                        { color: done ? colors.primary : colors.foreground },
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                      {done ? step.completedLabel : step.subtitle}
                    </Text>
                  </View>
                </View>
                <View style={[styles.stepIcon, { backgroundColor: done ? `${colors.primary}15` : colors.secondary }]}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : (step.icon as any)}
                    size={20}
                    color={done ? colors.primary : colors.mutedForeground}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {!allDone && (
          <View style={[styles.tipCard, { backgroundColor: colors.secondary }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
              Takes 3–5 minutes. Complete steps in any order, at your own pace.
            </Text>
          </View>
        )}

        {userData.milestones.length > 0 && (
          <View style={[styles.milestoneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.milestoneHeader}>
              <Ionicons name="ribbon" size={16} color={colors.accent} />
              <Text style={[styles.milestoneTitle, { color: colors.foreground }]}>
                Latest milestone
              </Text>
            </View>
            <Text style={[styles.milestoneName, { color: colors.accent }]}>
              {userData.milestones[userData.milestones.length - 1].label}
            </Text>
            <Text style={[styles.milestoneDesc, { color: colors.mutedForeground }]}>
              {userData.milestones[userData.milestones.length - 1].description}
            </Text>
          </View>
        )}
      </ScrollView>

      <SOSButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flex: 1, gap: 2 },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  dateText: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakBadgeText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  iAmBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  iAmBannerLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.5, textTransform: 'uppercase' },
  iAmBannerText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', lineHeight: 26 },
  allDoneCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  allDoneCheck: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  allDoneTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  allDoneSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressSection: { gap: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  progressCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  stepsSection: { gap: 8 },
  stepCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  stepText: { flex: 1, gap: 2 },
  stepLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  stepSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  stepIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  tipText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
  milestoneCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 4 },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  milestoneTitle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  milestoneName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  milestoneDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  pressed: { opacity: 0.85 },
});

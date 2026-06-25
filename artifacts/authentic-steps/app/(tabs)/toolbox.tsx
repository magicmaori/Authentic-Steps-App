import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const TIPS = [
  { icon: 'walk', title: 'Move your body', desc: 'Even 10 minutes outside can shift how you feel.' },
  { icon: 'call', title: 'Reach out', desc: 'Text one person you trust — not asking for help, just connecting.' },
  { icon: 'water', title: 'Ground yourself', desc: 'Name 5 things you can see. Slow your breathing.' },
  { icon: 'moon', title: 'Rest without guilt', desc: 'Rest is productive. Your body is working when you sleep.' },
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
            Slow breathing signals safety to your nervous system. Try one now.
          </Text>

          <View style={[styles.breathCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.breathIconWrap, { backgroundColor: '#03989e18' }]}>
              <Ionicons name="pulse" size={22} color="#03989e" />
            </View>
            <Text style={[styles.breathTitle, { color: colors.foreground }]}>Box Breathing</Text>
            <Text style={[styles.breathDesc, { color: colors.mutedForeground }]}>
              Used by athletes and first responders to reset fast.
            </Text>
            <View style={styles.breathSteps}>
              {[
                { label: 'Breathe IN', count: '4 counts', color: '#03989e' },
                { label: 'HOLD', count: '4 counts', color: '#193b83' },
                { label: 'Breathe OUT', count: '4 counts', color: '#03989e' },
                { label: 'HOLD', count: '4 counts', color: '#193b83' },
              ].map((s, i) => (
                <View key={i} style={styles.breathStepRow}>
                  <View style={[styles.breathStepDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.breathStepLabel, { color: colors.foreground }]}>{s.label}</Text>
                  <Text style={[styles.breathStepCount, { color: colors.mutedForeground }]}>{s.count}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.breathRepeat, { color: colors.mutedForeground }]}>Repeat 4 times</Text>
          </View>

          <View style={[styles.breathCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.breathIconWrap, { backgroundColor: '#193b8318' }]}>
              <Ionicons name="moon" size={22} color="#193b83" />
            </View>
            <Text style={[styles.breathTitle, { color: colors.foreground }]}>4-7-8 Calm Down</Text>
            <Text style={[styles.breathDesc, { color: colors.mutedForeground }]}>
              Great for anxiety, panic, or when you can't sleep.
            </Text>
            <View style={styles.breathSteps}>
              {[
                { label: 'Breathe IN through nose', count: '4 counts', color: '#03989e' },
                { label: 'HOLD', count: '7 counts', color: '#193b83' },
                { label: 'Breathe OUT through mouth', count: '8 counts', color: '#03989e' },
              ].map((s, i) => (
                <View key={i} style={styles.breathStepRow}>
                  <View style={[styles.breathStepDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.breathStepLabel, { color: colors.foreground }]}>{s.label}</Text>
                  <Text style={[styles.breathStepCount, { color: colors.mutedForeground }]}>{s.count}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.breathRepeat, { color: colors.mutedForeground }]}>Repeat 3–4 times</Text>
          </View>
        </View>

        <View style={styles.exerciseSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Move to Reset</Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Physical movement burns off stress hormones and shifts your mood fast.
          </Text>
          {[
            {
              icon: 'body',
              title: '10 Star Jumps',
              desc: 'Gets blood moving and releases tension held in the body. Do them big — arms and legs fully extended.',
              color: '#2D6A4F',
            },
            {
              icon: 'walk',
              title: 'Walk & Count',
              desc: 'Go for a 5-minute walk and silently count your steps. Counting keeps your mind present.',
              color: '#193b83',
            },
            {
              icon: 'hand-left',
              title: 'Progressive Muscle Release',
              desc: 'Clench every muscle tight for 5 seconds — fists, arms, shoulders, legs — then release all at once. Repeat 3 times.',
              color: '#03989e',
            },
            {
              icon: 'water',
              title: 'Cold Water Reset',
              desc: 'Splash cold water on your face or hold ice cubes. Activates the dive reflex and slows your heart rate.',
              color: '#1D4ED8',
            },
          ].map(ex => (
            <View
              key={ex.title}
              style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: ex.color }]}
            >
              <View style={[styles.exerciseIconWrap, { backgroundColor: `${ex.color}15` }]}>
                <Ionicons name={ex.icon as any} size={20} color={ex.color} />
              </View>
              <View style={styles.exerciseText}>
                <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>{ex.title}</Text>
                <Text style={[styles.exerciseDesc, { color: colors.mutedForeground }]}>{ex.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.groundingSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groundingHeading, { color: colors.foreground }]}>5-4-3-2-1 Grounding</Text>
          <Text style={[styles.groundingIntro, { color: colors.mutedForeground }]}>
            Brings you back to the present moment when overwhelmed. Name out loud or in your head:
          </Text>
          {[
            { n: '5', sense: 'things you can SEE', icon: 'eye' },
            { n: '4', sense: 'things you can TOUCH', icon: 'hand-right' },
            { n: '3', sense: 'things you can HEAR', icon: 'ear' },
            { n: '2', sense: 'things you can SMELL', icon: 'flower' },
            { n: '1', sense: 'thing you can TASTE', icon: 'restaurant' },
          ].map(g => (
            <View key={g.n} style={styles.groundingRow}>
              <View style={[styles.groundingBadge, { backgroundColor: '#03989e' }]}>
                <Text style={styles.groundingNum}>{g.n}</Text>
              </View>
              <Text style={[styles.groundingSense, { color: colors.foreground }]}>{g.sense}</Text>
              <Ionicons name={g.icon as any} size={16} color={colors.mutedForeground} />
            </View>
          ))}
        </View>

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
  breathCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  breathIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  breathTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  breathDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  breathSteps: { gap: 8, marginTop: 4 },
  breathStepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breathStepDot: { width: 8, height: 8, borderRadius: 4 },
  breathStepLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  breathStepCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  breathRepeat: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'right' },

  exerciseSection: { gap: 10 },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 12,
  },
  exerciseIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  exerciseText: { flex: 1, gap: 4 },
  exerciseTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  exerciseDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  groundingSection: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  groundingHeading: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  groundingIntro: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -4 },
  groundingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groundingBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groundingNum: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  groundingSense: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});

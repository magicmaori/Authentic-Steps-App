import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreaksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userData, getStreakCalendar } = useApp();
  const calendar = getStreakCalendar();

  const todayStr = new Date().toISOString().split('T')[0];

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
        <LinearGradient
          colors={[colors.gradientStart, '#193b83']}
          style={styles.streakHero}
        >
          <Ionicons name="flame" size={48} color="#F4A261" />
          <Text style={styles.streakNumber}>{userData.currentStreak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
          <View style={styles.streakMeta}>
            <View style={styles.streakMetaItem}>
              <Text style={styles.streakMetaNum}>{userData.longestStreak}</Text>
              <Text style={styles.streakMetaLabel}>Best</Text>
            </View>
            <View style={[styles.streakMetaDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View style={styles.streakMetaItem}>
              <Text style={styles.streakMetaNum}>{userData.totalRituals}</Text>
              <Text style={styles.streakMetaLabel}>Total</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.powerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.powerRow}>
            <View style={styles.powerItem}>
              <View style={[styles.powerIcon, { backgroundColor: `${colors.accent}18` }]}>
                <Ionicons name="snow" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.powerNum, { color: colors.foreground }]}>{userData.streakFreezes}</Text>
              <Text style={[styles.powerLabel, { color: colors.mutedForeground }]}>Streak Freezes</Text>
            </View>
            <View style={[styles.powerDivider, { backgroundColor: colors.border }]} />
            <View style={styles.powerItem}>
              <View style={[styles.powerIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="shuffle" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.powerNum, { color: colors.foreground }]}>
                {userData.lastFlexWeek === getWeekKey() ? Math.max(0, 1 - userData.flexDaysUsedThisWeek) : 1}
              </Text>
              <Text style={[styles.powerLabel, { color: colors.mutedForeground }]}>Flex Days Left</Text>
            </View>
          </View>
          <Text style={[styles.powerHint, { color: colors.mutedForeground }]}>
            Flex days: complete 2 of 3 steps to keep your streak. 1 per week.
          </Text>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Last 30 Days</Text>
          <View style={styles.dayLabels}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={[styles.dayLabel, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {calendar.map((day) => {
              const isToday = day.date === todayStr;
              let bg = colors.muted;
              if (day.done) bg = colors.primary;
              else if (day.flex) bg = `${colors.accent}99`;
              return (
                <View
                  key={day.date}
                  style={[
                    styles.gridDot,
                    { backgroundColor: bg },
                    isToday && { borderWidth: 2, borderColor: colors.primary },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: `${colors.accent}99` }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Flex day</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Missed</Text>
            </View>
          </View>
        </View>

        {userData.milestones.length > 0 && (
          <View style={[styles.milestonesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Milestones</Text>
            {userData.milestones.map(m => (
              <View key={m.id} style={[styles.milestoneRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.mBadge, { backgroundColor: `${colors.accent}18` }]}>
                  <Ionicons name="ribbon" size={18} color={colors.accent} />
                </View>
                <View style={styles.mText}>
                  <Text style={[styles.mLabel, { color: colors.foreground }]}>{m.label}</Text>
                  <Text style={[styles.mDesc, { color: colors.mutedForeground }]}>{m.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {userData.milestones.length === 0 && (
          <View style={[styles.emptyMilestone, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="ribbon-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Milestones coming</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Complete your first daily ritual to earn your first badge.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getWeekKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  streakHero: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: { fontSize: 64, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 70 },
  streakLabel: { fontSize: 18, fontFamily: 'Inter_500Medium', color: '#fff' },
  streakMeta: { flexDirection: 'row', gap: 24, marginTop: 12 },
  streakMetaItem: { alignItems: 'center', gap: 2 },
  streakMetaNum: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  streakMetaLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#fff' },
  streakMetaDivider: { width: 1, height: 36 },
  powerCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  powerRow: { flexDirection: 'row', gap: 12 },
  powerItem: { flex: 1, alignItems: 'center', gap: 4 },
  powerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  powerNum: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  powerLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  powerDivider: { width: 1 },
  powerHint: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, textAlign: 'center' },
  calendarCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  dayLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dayLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', width: 32, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  gridDot: { width: 32, height: 32, borderRadius: 8 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  milestonesCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  mBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mText: { flex: 1, gap: 2 },
  mLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  mDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  emptyMilestone: { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
});

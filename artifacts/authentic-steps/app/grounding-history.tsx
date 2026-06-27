import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, type GroundingSession } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const ACCENT = '#03989e';

function formatDateLong(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

function isYesterday(dateStr: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr === d.toISOString().split('T')[0];
}

function groupSessionsByDate(sessions: GroundingSession[]): { date: string; sessions: GroundingSession[] }[] {
  const map: Record<string, GroundingSession[]> = {};
  for (const s of sessions) {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  }
  return Object.entries(map)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, sessions]) => ({ date, sessions }));
}

function dateSectionLabel(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  if (isYesterday(dateStr)) return 'Yesterday';
  return formatDateLong(dateStr);
}

function SessionCard({ session, colors }: { session: GroundingSession; colors: ReturnType<typeof useColors> }) {
  const isDark = colors.background === '#001f3d';
  const totalAnswers = session.senses.reduce((n, s) => n + s.answers.length, 0);

  return (
    <View style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sessionHeader, { backgroundColor: `${ACCENT}0D`, borderBottomColor: `${ACCENT}20` }]}>
        <View style={styles.sessionHeaderLeft}>
          <View style={[styles.leafBadge, { backgroundColor: ACCENT }]}>
            <Ionicons name="leaf" size={12} color="#fff" />
          </View>
          <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>
            {formatTime(session.timestamp)}
          </Text>
        </View>
        <View style={[styles.answerCountBadge, { backgroundColor: isDark ? '#0d2a3a' : `${ACCENT}15` }]}>
          <Text style={[styles.answerCountText, { color: ACCENT }]}>{totalAnswers} responses</Text>
        </View>
      </View>

      <View style={styles.sessionBody}>
        {session.senses.map((sense, si) => (
          <View key={si} style={styles.senseBlock}>
            <View style={styles.senseRow}>
              <Ionicons name={sense.icon as any} size={13} color={ACCENT} />
              <Text style={[styles.senseLabel, { color: colors.foreground }]}>{sense.sense}</Text>
            </View>
            <View style={styles.answersBlock}>
              {sense.answers.map((answer, ai) => (
                <Text key={ai} style={[styles.answerText, { color: colors.mutedForeground }]}>
                  • {answer}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function GroundingHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { groundingSessions } = useApp();

  const grouped = useMemo(() => groupSessionsByDate(groundingSessions), [groundingSessions]);
  const totalSessions = groundingSessions.length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 12 : insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Grounding History</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[ACCENT, '#037880']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="leaf" size={22} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>5-4-3-2-1 Grounding</Text>
          <Text style={styles.heroSubtitle}>
            {totalSessions === 0
              ? 'Complete your first session to start tracking.'
              : `${totalSessions} session${totalSessions !== 1 ? 's' : ''} saved`}
          </Text>
        </LinearGradient>

        {grouped.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No sessions yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Complete the 5-4-3-2-1 grounding exercise in the Toolbox to save your reflections here.
            </Text>
          </View>
        ) : (
          grouped.map(({ date, sessions }) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateSection}>
                <Text style={[styles.dateSectionLabel, { color: colors.foreground }]}>
                  {dateSectionLabel(date)}
                </Text>
                {sessions.length > 1 && (
                  <View style={[styles.sessionCountPill, { backgroundColor: `${ACCENT}18` }]}>
                    <Text style={[styles.sessionCountText, { color: ACCENT }]}>
                      {sessions.length}×
                    </Text>
                  </View>
                )}
              </View>
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} colors={colors} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },

  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },

  heroBanner: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  emptyState: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },

  dateGroup: { gap: 10 },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateSectionLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  sessionCountPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sessionCountText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  sessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leafBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTime: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  answerCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  answerCountText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  sessionBody: { padding: 14, gap: 12 },
  senseBlock: { gap: 5 },
  senseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senseLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  answersBlock: { gap: 3, paddingLeft: 4 },
  answerText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});

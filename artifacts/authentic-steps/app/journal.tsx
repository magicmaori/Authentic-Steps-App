import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

const CATEGORY_EMOJI: Record<string, string> = {
  people: '👥',
  experiences: '✨',
  things: '🌿',
  self: '💛',
  movement: '🏃',
  connection: '🤝',
  learning: '📚',
  rest: '🌙',
  creativity: '🎨',
  '': '🌟',
};

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

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function buildPdfHtml(
  sortedDates: string[],
  entries: Record<string, import('@/context/AppContext').RitualEntry>,
  groundingSessions: GroundingSession[],
): string {
  const cards = sortedDates
    .map((date) => {
      const e = entries[date];
      if (!e) return '';
      const gratitudeRows = e.gratitudes
        .filter((g) => g.text.trim())
        .map(
          (g, i) => `
          <div class="grat-row">
            <span class="grat-num">${i + 1}</span>
            <div class="grat-content">
              <span class="grat-tag">${CATEGORY_EMOJI[g.category] ?? '🌿'} ${g.category}</span>
              <p class="grat-text">I am grateful for ${g.text}</p>
            </div>
          </div>`
        )
        .join('');

      return `
        <div class="card">
          <div class="card-header">
            <div class="date-badge">${formatDateShort(date)}</div>
            <h2 class="date-full">${formatDateLong(date)}</h2>
          </div>
          <div class="card-body">
            <div class="section">
              <div class="section-label gratitude-label">
                <span class="section-icon">🌿</span> Gratitude
              </div>
              ${gratitudeRows || '<p class="empty-note">No gratitude entries recorded</p>'}
            </div>
            <div class="divider"></div>
            <div class="section">
              <div class="section-label intention-label">
                <span class="section-icon">🎯</span> Intention
              </div>
              <p class="section-body">
                ${e.intention ? `Today I will ${e.intention}` : '<span class="empty-note">No intention recorded</span>'}
              </p>
              ${e.intentionCategory ? `<span class="tag">${CATEGORY_EMOJI[e.intentionCategory] ?? ''} ${e.intentionCategory}</span>` : ''}
            </div>
            <div class="divider"></div>
            <div class="section">
              <div class="section-label iam-label">
                <span class="section-icon">⭐</span> I Am Statement
              </div>
              <p class="iam-text">${e.iAmStatement || '<span class="empty-note">No I Am statement recorded</span>'}</p>
            </div>
          </div>
        </div>`;
    })
    .join('');

  // Build grounding sessions PDF section
  const groundingSection = groundingSessions.length === 0 ? '' : (() => {
    const sessionCards = groundingSessions.map((s) => {
      const sensesHtml = s.senses.map((sense) => `
        <div class="gs-sense">
          <div class="gs-sense-label">${sense.sense}</div>
          ${sense.answers.map((a) => `<p class="gs-answer">• ${a}</p>`).join('')}
        </div>`).join('');
      return `
        <div class="gs-card">
          <div class="gs-card-header">
            <span class="gs-date">${formatDateShort(s.date)}</span>
            <span class="gs-time">${formatTime(s.timestamp)}</span>
          </div>
          <div class="gs-body">${sensesHtml}</div>
        </div>`;
    }).join('');

    return `
      <div class="section-divider"></div>
      <div class="gs-section">
        <div class="gs-section-title">
          <span>🍃</span> 5-4-3-2-1 Grounding Sessions
        </div>
        <p class="gs-count">${groundingSessions.length} session${groundingSessions.length !== 1 ? 's' : ''} recorded</p>
        ${sessionCards}
      </div>`;
  })();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Authentic Steps Journal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #fff7f0;
      color: #1a2a3a;
      padding: 32px 24px;
    }

    .cover {
      background: linear-gradient(135deg, #037880 0%, #193b83 100%);
      border-radius: 20px;
      padding: 48px 36px;
      margin-bottom: 36px;
      text-align: center;
      color: white;
      page-break-after: avoid;
    }
    .cover-title {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .cover-subtitle {
      font-size: 15px;
      font-weight: 500;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 24px;
    }
    .cover-count {
      display: inline-block;
      background: rgba(255,255,255,0.18);
      border-radius: 40px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
    }

    .card {
      background: #ffffff;
      border-radius: 18px;
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(3,152,158,0.10), 0 1px 4px rgba(25,59,131,0.06);
      page-break-inside: avoid;
    }

    .card-header {
      background: linear-gradient(135deg, #03989e 0%, #037880 100%);
      padding: 18px 22px 14px;
    }
    .date-badge {
      display: inline-block;
      background: rgba(255,255,255,0.22);
      border-radius: 20px;
      padding: 3px 12px;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .date-full {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.2px;
    }

    .card-body {
      padding: 20px 22px 22px;
    }

    .section {
      padding: 6px 0;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .gratitude-label { color: #03989e; }
    .intention-label { color: #193b83; }
    .iam-label { color: #6dbdf2; }

    .section-icon { font-size: 14px; }

    .grat-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .grat-num {
      width: 22px;
      height: 22px;
      background: #e6f7f8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #03989e;
      flex-shrink: 0;
      text-align: center;
      line-height: 22px;
    }
    .grat-content { flex: 1; }
    .grat-tag {
      font-size: 10px;
      font-weight: 600;
      color: #5a7a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 2px;
    }
    .grat-text {
      font-size: 14px;
      color: #1a2a3a;
      line-height: 1.5;
    }

    .section-body {
      font-size: 14px;
      color: #1a2a3a;
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .tag {
      display: inline-block;
      background: #e6f7f8;
      color: #03989e;
      border-radius: 12px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .iam-text {
      font-size: 18px;
      font-weight: 700;
      color: #193b83;
      line-height: 1.5;
      font-style: italic;
    }

    .divider {
      height: 1px;
      background: #c8e8ea;
      margin: 14px 0;
    }

    .empty-note {
      color: #8fc4d4;
      font-style: italic;
    }

    /* Grounding Sessions */
    .section-divider {
      height: 2px;
      background: linear-gradient(90deg, #03989e, #193b83);
      border-radius: 2px;
      margin: 36px 0 28px;
    }
    .gs-section { }
    .gs-section-title {
      font-size: 20px;
      font-weight: 700;
      color: #03989e;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .gs-count {
      font-size: 13px;
      color: #5a7a8a;
      margin-bottom: 20px;
    }
    .gs-card {
      background: #ffffff;
      border-radius: 14px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(3,152,158,0.08);
      page-break-inside: avoid;
    }
    .gs-card-header {
      background: linear-gradient(135deg, #03989e 0%, #037880 100%);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .gs-date {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    .gs-time {
      font-size: 11px;
      color: rgba(255,255,255,0.75);
    }
    .gs-body {
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .gs-sense { }
    .gs-sense-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #03989e;
      margin-bottom: 4px;
    }
    .gs-answer {
      font-size: 13px;
      color: #1a2a3a;
      line-height: 1.5;
      padding-left: 4px;
    }

    .footer {
      text-align: center;
      padding: 24px;
      color: #8fc4d4;
      font-size: 12px;
    }

    @media print {
      body { padding: 16px; background: #fff; }
      .card { box-shadow: none; border: 1px solid #c8e8ea; }
      .gs-card { box-shadow: none; border: 1px solid #c8e8ea; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <p class="cover-subtitle">Authentic Steps For Youth</p>
    <h1 class="cover-title">My Journal</h1>
    <div class="cover-count">${sortedDates.length} day${sortedDates.length !== 1 ? 's' : ''} of reflection</div>
  </div>
  ${cards}
  ${groundingSection}
  <div class="footer">
    Generated by Authentic Steps For Youth &middot; ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
</body>
</html>`;
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, groundingSessions, deleteGroundingSession } = useApp();
  const [isDownloading, setIsDownloading] = useState(false);
  const [groundingExpanded, setGroundingExpanded] = useState(true);

  const sortedDates = useMemo(() => {
    return Object.keys(entries ?? {})
      .filter((d) => {
        const e = (entries ?? {})[d];
        return e.isComplete || e.gratitudes.some((g) => g.text.trim()) || e.intention || e.iAmStatement;
      })
      .sort((a, b) => (a < b ? 1 : -1));
  }, [entries]);

  const totalDays = sortedDates.length;
  const has90Days = totalDays >= 90;

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const html = buildPdfHtml(sortedDates, entries, groundingSessions);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Your Journal',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Saved', `Your journal PDF has been saved to:\n${uri}`);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate your journal. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }

  function handleDeleteSession(session: GroundingSession) {
    Alert.alert(
      'Delete session?',
      `Remove the grounding session from ${formatDateShort(session.date)} at ${formatTime(session.timestamp)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGroundingSession(session.id),
        },
      ],
    );
  }

  const isDark = colors.background === '#001f3d';

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
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Journal</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.gradientStart, '#193b83']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <Text style={styles.heroEmoji}>📖</Text>
          <Text style={styles.heroTitle}>
            {totalDays === 0 ? 'Your Journey Begins' : `${totalDays} Day${totalDays !== 1 ? 's' : ''} of Reflection`}
          </Text>
          <Text style={styles.heroSubtitle}>
            {totalDays === 0
              ? 'Complete your first daily ritual to see it here.'
              : has90Days
              ? 'You\'ve reached an incredible milestone.'
              : `${90 - totalDays} more day${90 - totalDays !== 1 ? 's' : ''} until your 90-day download unlocks.`}
          </Text>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (totalDays / 90) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {Math.min(totalDays, 90)} / 90 days
          </Text>
        </LinearGradient>

        {has90Days && (
          <View style={[styles.milestoneCard, { backgroundColor: isDark ? colors.card : colors.secondary, borderColor: colors.primary }]}>
            <Text style={styles.milestoneEmoji}>🏆</Text>
            <View style={styles.milestoneText}>
              <Text style={[styles.milestoneTitle, { color: colors.primary }]}>90 Days of Growth</Text>
              <Text style={[styles.milestoneSub, { color: colors.mutedForeground }]}>
                You've shown up for yourself every single day. That's extraordinary.
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={has90Days ? handleDownload : undefined}
          style={({ pressed }) => [
            styles.downloadBtn,
            has90Days
              ? { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
              : { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
          ]}
          disabled={!has90Days || isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name={has90Days ? 'download-outline' : 'lock-closed-outline'}
                size={20}
                color={has90Days ? '#fff' : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.downloadBtnText,
                  { color: has90Days ? '#fff' : colors.mutedForeground },
                ]}
              >
                {has90Days ? 'Download Journal PDF' : `Unlocks at 90 days (${totalDays}/90)`}
              </Text>
            </>
          )}
        </Pressable>

        {/* Daily ritual journal entries */}
        {sortedDates.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="journal-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No entries yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Complete your daily ritual on the Daily tab to start building your journal.
            </Text>
          </View>
        ) : (
          sortedDates.map((date) => (
            <JournalCard key={date} date={date} entry={entries[date]} colors={colors} isDark={isDark} />
          ))
        )}

        {/* Grounding Sessions section */}
        <Pressable
          onPress={() => setGroundingExpanded((v) => !v)}
          style={[styles.groundingSectionHeader, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <View style={styles.groundingSectionLeft}>
            <View style={[styles.groundingIconBadge, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="leaf" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.groundingSectionTitle, { color: colors.foreground }]}>
              Grounding Sessions
            </Text>
            {(groundingSessions ?? []).length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.countBadgeText}>{(groundingSessions ?? []).length}</Text>
              </View>
            )}
          </View>
          <Ionicons
            name={groundingExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>

        {groundingExpanded && (
          (groundingSessions ?? []).length === 0 ? (
            <View style={[styles.groundingEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="leaf-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No sessions yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Complete the 5-4-3-2-1 grounding exercise in the Toolbox to save your reflections here.
              </Text>
            </View>
          ) : (
            (groundingSessions ?? []).map((session) => (
              <GroundingSessionCard
                key={session.id}
                session={session}
                colors={colors}
                isDark={isDark}
                onDelete={() => handleDeleteSession(session)}
              />
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

function GroundingSessionCard({
  session,
  colors,
  isDark,
  onDelete,
}: {
  session: GroundingSession;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  onDelete: () => void;
}) {
  const ACCENT = colors.primary;
  const totalAnswers = session.senses.reduce((n, s) => n + s.answers.length, 0);

  return (
    <View style={[styles.gsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.gsCardHeader, { backgroundColor: `${ACCENT}0D`, borderBottomColor: `${ACCENT}20` }]}>
        <View style={styles.gsCardHeaderLeft}>
          <View style={[styles.gsLeafBadge, { backgroundColor: ACCENT }]}>
            <Ionicons name="leaf" size={12} color="#fff" />
          </View>
          <View>
            <Text style={[styles.gsDate, { color: colors.foreground }]}>{formatDateShort(session.date)}</Text>
            <Text style={[styles.gsTime, { color: colors.mutedForeground }]}>{formatTime(session.timestamp)}</Text>
          </View>
          <View style={[styles.gsAnswerBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.gsAnswerBadgeText, { color: ACCENT }]}>{totalAnswers} responses</Text>
          </View>
        </View>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [styles.gsDeleteBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={17} color={colors.destructive} />
        </Pressable>
      </View>

      <View style={styles.gsBody}>
        {session.senses.map((sense, si) => (
          <View key={si} style={styles.gsSenseBlock}>
            <View style={styles.gsSenseRow}>
              <Ionicons name={sense.icon as any} size={13} color={ACCENT} />
              <Text style={[styles.gsSenseLabel, { color: colors.foreground }]}>{sense.sense}</Text>
            </View>
            {sense.answers.map((answer, ai) => (
              <Text key={ai} style={[styles.gsAnswer, { color: colors.mutedForeground }]}>
                • {answer}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function JournalCard({
  date,
  entry,
  colors,
  isDark,
}: {
  date: string;
  entry: import('@/context/AppContext').RitualEntry;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}) {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = d.toLocaleDateString('en-AU', { weekday: 'long' });
  const shortDate = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={[colors.gradientStart, '#193b83']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderInner}>
          <Text style={styles.cardWeekday}>{weekday}</Text>
          <Text style={styles.cardDate}>{shortDate}</Text>
        </View>
        {entry.isComplete && (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark" size={13} color={colors.primary} />
          </View>
        )}
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionEmoji}>🌿</Text>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>Gratitude</Text>
          </View>
          {entry.gratitudes.filter((g) => g.text.trim()).length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>No entries</Text>
          ) : (
            entry.gratitudes
              .filter((g) => g.text.trim())
              .map((g, i) => (
                <View key={i} style={styles.gratRow}>
                  <View style={[styles.gratNum, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.gratNumText, { color: colors.primary }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.gratContent}>
                    <Text style={[styles.gratCategory, { color: colors.mutedForeground }]}>
                      {CATEGORY_EMOJI[g.category] ?? '🌿'} {g.category}
                    </Text>
                    <Text style={[styles.gratText, { color: colors.foreground }]}>
                      <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>I am grateful for </Text>
                      {g.text}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionEmoji}>🎯</Text>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Intention</Text>
          </View>
          {entry.intention ? (
            <View>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Today I will </Text>
                {entry.intention}
              </Text>
              {entry.intentionCategory ? (
                <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {CATEGORY_EMOJI[entry.intentionCategory] ?? ''} {entry.intentionCategory}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>No entry</Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionEmoji}>⭐</Text>
            <Text style={[styles.sectionLabel, { color: colors.accent }]}>I Am Statement</Text>
          </View>
          {entry.iAmStatement ? (
            <Text style={[styles.iAmText, { color: colors.foreground }]}>
              "{entry.iAmStatement}"
            </Text>
          ) : (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>No entry</Text>
          )}
        </View>
      </View>
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
  content: { padding: 16, gap: 14 },

  heroBanner: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  heroEmoji: { fontSize: 36, marginBottom: 4 },
  heroTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'center' },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
  },
  milestoneEmoji: { fontSize: 32 },
  milestoneText: { flex: 1, gap: 4 },
  milestoneTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  milestoneSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  downloadBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  emptyState: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },

  // Grounding section header
  groundingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  groundingSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groundingIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundingSectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },

  groundingEmpty: {
    borderRadius: 14,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },

  // Grounding session cards
  gsCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  gsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  gsCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  gsLeafBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gsDate: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  gsTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  gsAnswerBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  gsAnswerBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  gsDeleteBtn: { padding: 4 },
  gsBody: { padding: 14, gap: 10 },
  gsSenseBlock: { gap: 3 },
  gsSenseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  gsSenseLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  gsAnswer: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, paddingLeft: 4 },

  // Journal cards
  card: { borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  cardHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderInner: { gap: 2 },
  cardWeekday: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardDate: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff' },
  completeBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { padding: 18, gap: 0 },
  section: { paddingVertical: 6, gap: 8 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionEmoji: { fontSize: 14 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8 },

  gratRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  gratNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  gratNumText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  gratContent: { flex: 1, gap: 2 },
  gratCategory: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  gratText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  divider: { height: 1, marginVertical: 4 },
  bodyText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 6 },

  tag: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10, marginTop: 2 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },

  iAmText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', lineHeight: 24, fontStyle: 'italic' },

  emptyNote: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
});

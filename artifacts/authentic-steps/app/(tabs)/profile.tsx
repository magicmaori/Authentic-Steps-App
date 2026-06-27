import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@clerk/expo';
import { ThemePreference, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import {
  getPermissionState,
  requestPermission as requestNotifPermission,
  scheduleEveningReminder,
  scheduleRitualReminder,
} from '@/utils/notifications';

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const todayStr = now.toDateString();
  if (date.toDateString() === todayStr) return `today at ${h12}:${m} ${ampm}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `yesterday at ${h12}:${m} ${ampm}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` at ${h12}:${m} ${ampm}`;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userData, entries, groundingSessions, lastSynced, setThemePreference, buildRecoveryPayload, resetAllData, setNotificationPref, setNotificationTime, disableAllNotificationPrefs } = useApp();
  const { isSignedIn } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setTick] = useState(0);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState<'ritual' | 'evening' | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeRefreshed, setCodeRefreshed] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedPayloadRef = useRef<string>('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userData.notifRitual && !userData.notifEvening && !userData.notifMilestone) return;
    getPermissionState().then(async (state) => {
      if (state === 'undetermined') {
        const granted = await requestNotifPermission();
        if (granted) {
          await scheduleRitualReminder(userData.notifRitual, userData.ritualHour ?? 9, userData.ritualMinute ?? 0).catch(() => {});
          await scheduleEveningReminder(userData.notifEvening, userData.eveningHour ?? 20, userData.eveningMinute ?? 0).catch(() => {});
        } else {
          await disableAllNotificationPrefs();
          setNotifBlocked(true);
        }
      } else if (state === 'denied') {
        await disableAllNotificationPrefs();
        setNotifBlocked(true);
      }
    }).catch(() => {});
  }, []);

  const refreshPayload = useCallback(() => {
    const payload = buildRecoveryPayload();
    cachedPayloadRef.current = payload;
    setLastRefreshed(new Date());
    return payload;
  }, [buildRecoveryPayload]);

  useFocusEffect(
    useCallback(() => {
      refreshPayload();
    }, [refreshPayload])
  );

  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => setTick(t => t + 1), 60_000);
      return () => clearInterval(id);
    }, [])
  );

  function showDeleteToast() {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      toastTimerRef.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 2500);
    });
  }

  function handleDeleteData() {
    if (isDeleting) return;
    Alert.alert(
      'Delete all your data?',
      'This will permanently erase your journal entries, streaks, milestones, and breathing records. A new anonymous name will be created. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete everything',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await resetAllData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              showDeleteToast();
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }

  function buildPdfHtml(): string {
    const exportedAt = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const entryList = Object.values(entries).sort((a, b) => a.date.localeCompare(b.date));
    const sortedGrounding = [...groundingSessions].sort((a, b) => a.timestamp - b.timestamp);

    const hasEntries = entryList.length > 0;
    const hasSessions = sortedGrounding.length > 0;

    const formatDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const milestoneRows = userData.milestones.length > 0
      ? userData.milestones.map(m =>
          `<tr><td>${m.label}</td><td>${m.description}</td><td>${formatDate(m.earnedAt)}</td></tr>`
        ).join('')
      : '<tr><td colspan="3" style="color:#888;font-style:italic;">No badges earned yet</td></tr>';

    const journalSection = hasEntries
      ? entryList.map(e => {
          const gratitudeItems = e.gratitudes.length > 0
            ? e.gratitudes.map(g => `<li>${escHtml(g.text)} <span class="tag">${g.category}</span></li>`).join('')
            : '<li style="color:#888;font-style:italic;">None recorded</li>';
          return `
            <div class="entry">
              <div class="entry-date">${formatDate(e.date)}${e.isComplete ? ' <span class="badge">✓ Complete</span>' : ''}</div>
              <div class="entry-section-label">Gratitudes</div>
              <ul>${gratitudeItems}</ul>
              ${e.intention ? `<div class="entry-section-label">Today's Intention</div><p>${escHtml(e.intention)}${e.intentionCategory ? ` <span class="tag">${e.intentionCategory}</span>` : ''}</p>` : ''}
              ${e.iAmStatement ? `<div class="entry-section-label">I Am Statement</div><p class="iam">"${escHtml(e.iAmStatement)}"</p>` : ''}
            </div>`;
        }).join('')
      : '<p class="empty-state">No journal entries yet. Start your first daily ritual to see it here.</p>';

    const groundingSection = hasSessions
      ? sortedGrounding.map(s => {
          const sensesHtml = s.senses.map(se =>
            `<div class="sense-block"><div class="sense-name">${escHtml(se.sense)}</div><ul>${se.answers.map(a => `<li>${escHtml(a)}</li>`).join('')}</ul></div>`
          ).join('');
          const sessionDate = new Date(s.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          return `<div class="entry"><div class="entry-date">${sessionDate}</div>${sensesHtml}</div>`;
        }).join('')
      : '<p class="empty-state">No grounding sessions yet.</p>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Authentic Steps — Journal Export</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; font-size: 14px; line-height: 1.6; padding: 40px 48px; }
  h1 { font-size: 26px; font-weight: 700; color: #16a34a; margin-bottom: 4px; }
  .subtitle { color: #555; font-size: 13px; margin-bottom: 32px; }
  h2 { font-size: 17px; font-weight: 700; color: #1a1a1a; margin: 32px 0 14px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  .stat-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 12px; text-align: center; background: #f9fafb; }
  .stat-value { font-size: 24px; font-weight: 700; color: #16a34a; }
  .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 10px; background: #f3f4f6; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
  td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .entry { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; margin-bottom: 16px; break-inside: avoid; }
  .entry-date { font-weight: 700; font-size: 15px; margin-bottom: 10px; color: #111827; }
  .entry-section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 10px 0 4px; }
  ul { padding-left: 18px; }
  li { margin-bottom: 3px; }
  .tag { display: inline-block; background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; text-transform: capitalize; margin-left: 4px; vertical-align: middle; }
  .badge { background: #bbf7d0; color: #065f46; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; margin-left: 6px; vertical-align: middle; }
  .iam { font-size: 15px; font-style: italic; color: #374151; padding: 4px 0; }
  .sense-block { margin-bottom: 10px; }
  .sense-name { font-weight: 600; font-size: 13px; color: #374151; margin-bottom: 3px; }
  .empty-state { color: #9ca3af; font-style: italic; padding: 12px 0; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <h1>Authentic Steps For Youth</h1>
  <div class="subtitle">Journal export for ${escHtml(userData.anonymousName)} &nbsp;·&nbsp; Generated ${exportedAt}</div>

  <h2>Your Stats</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${userData.currentStreak}</div><div class="stat-label">Current Streak</div></div>
    <div class="stat-card"><div class="stat-value">${userData.longestStreak}</div><div class="stat-label">Best Streak</div></div>
    <div class="stat-card"><div class="stat-value">${userData.totalRituals}</div><div class="stat-label">Rituals Done</div></div>
    <div class="stat-card"><div class="stat-value">${userData.milestones.length}</div><div class="stat-label">Badges Earned</div></div>
  </div>

  <h2>Badges</h2>
  <table>
    <thead><tr><th>Badge</th><th>Description</th><th>Earned</th></tr></thead>
    <tbody>${milestoneRows}</tbody>
  </table>

  <h2>Journal Entries (${entryList.length})</h2>
  ${journalSection}

  <h2>Grounding Sessions (${sortedGrounding.length})</h2>
  ${groundingSection}

  <div class="footer">Authentic Steps For Youth &nbsp;·&nbsp; Your data is private and never sold. Designed for young people, with care.</div>
</body>
</html>`;
  }

  async function handleExportPdf() {
    try {
      const html = buildPdfHtml();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save or share your journal PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF saved', 'Your journal has been saved as a PDF file.');
      }
    } catch {
      Alert.alert('Could not create PDF', 'Please try again.');
    }
  }

  async function handleExportJson() {
    const exportedAt = new Date().toISOString();
    const entryList = Object.values(entries).sort((a, b) => a.date.localeCompare(b.date));
    const exportData = {
      exportedAt,
      app: 'Authentic Steps For Youth',
      profile: {
        anonymousName: userData.anonymousName,
        currentStreak: userData.currentStreak,
        longestStreak: userData.longestStreak,
        totalRituals: userData.totalRituals,
        milestones: userData.milestones.map(m => ({
          label: m.label,
          description: m.description,
          earnedAt: m.earnedAt,
        })),
      },
      journalEntries: entryList.map(e => ({
        date: e.date,
        gratitudes: e.gratitudes.map(g => ({ text: g.text, category: g.category })),
        intention: e.intention,
        intentionCategory: e.intentionCategory,
        iAmStatement: e.iAmStatement,
        isComplete: e.isComplete,
      })),
      groundingSessions: groundingSessions.map(s => ({
        date: s.date,
        senses: s.senses.map(se => ({ sense: se.sense, answers: se.answers })),
      })),
    };
    const text = JSON.stringify(exportData, null, 2);
    try {
      await Share.share(
        { title: 'My Authentic Steps data', message: text },
        { dialogTitle: 'Save or share your data export' }
      );
    } catch {
      Alert.alert('Could not open share sheet', 'Please try again.');
    }
  }

  async function handleDownloadData() {
    Haptics.selectionAsync();
    Alert.alert(
      'Export your data',
      'Choose a format. PDF is easy to read and print. JSON is machine-readable for backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'JSON (backup)', onPress: handleExportJson },
        { text: 'PDF (readable)', onPress: handleExportPdf },
      ]
    );
  }

  async function handleCopyCode() {
    Haptics.selectionAsync();
    const payload = refreshPayload();
    await Clipboard.setStringAsync(payload);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  }

  async function handleRefreshCode() {
    Haptics.selectionAsync();
    const payload = refreshPayload();
    await Clipboard.setStringAsync(payload);
    setCodeRefreshed(true);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => setCodeRefreshed(false), 2500);
  }

  const initials = userData.anonymousName.substring(0, 2).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: colors.primary, bottom: insets.bottom + 100, opacity: toastOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.toastIcon}>🌱</Text>
        <Text style={[styles.toastText, { color: colors.primaryForeground }]}>
          All your data has been erased. Fresh start
        </Text>
      </Animated.View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 20,
            paddingBottom: 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: colors.foreground }]}>{userData.anonymousName}</Text>
            <Text style={[styles.anonNote, { color: colors.mutedForeground }]}>Anonymous name — only you see this</Text>
            {isSignedIn && (
              <View style={styles.syncRow}>
                <Ionicons
                  name="cloud-done-outline"
                  size={12}
                  color={lastSynced ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.syncText, { color: lastSynced ? colors.primary : colors.mutedForeground }]}>
                  {lastSynced
                    ? `Synced ${formatLastUpdated(lastSynced)}`
                    : 'Syncing…'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Streak', value: `${userData.currentStreak}d`, icon: 'flame', color: '#F4A261' },
            { label: 'Best', value: `${userData.longestStreak}d`, icon: 'trophy', color: colors.accent },
            { label: 'Total', value: `${userData.totalRituals}`, icon: 'checkmark-circle', color: colors.primary },
            { label: 'Badges', value: `${userData.milestones.length}`, icon: 'ribbon', color: '#7C3AED' },
          ].map(stat => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.recoveryHeader}>
            <Ionicons name="key-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, paddingTop: 0, paddingHorizontal: 0 }]}>
              Recovery Code
            </Text>
          </View>
          <Text style={[styles.recoveryExplain, { color: colors.mutedForeground }]}>
            If you reinstall or get a new phone, tap "Copy code" and paste it somewhere safe (Notes, Messages, a password manager). Copying is required — a screenshot alone won't restore your data.
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.foreground }]}>
              {userData.recoveryCode || '—'}
            </Text>
            <Text style={[styles.codeSubtext, { color: colors.mutedForeground }]}>
              Your identifier — the full restorable code is copied below
            </Text>
          </View>
          {lastRefreshed && (
            <View style={styles.lastUpdatedRow}>
              <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.lastUpdatedText, { color: colors.mutedForeground }]}>
                {`Last updated: ${formatLastUpdated(lastRefreshed)}`}
              </Text>
            </View>
          )}
          <View style={styles.codeActions}>
            <Pressable
              onPress={handleRefreshCode}
              style={({ pressed }) => [
                styles.refreshButton,
                { borderColor: colors.border, backgroundColor: colors.muted, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons
                name={codeRefreshed ? 'checkmark-outline' : 'refresh-outline'}
                size={16}
                color={codeRefreshed ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.refreshButtonText, { color: codeRefreshed ? colors.primary : colors.mutedForeground }]}>
                {codeRefreshed ? 'Updated!' : 'Refresh code'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleCopyCode}
              style={({ pressed }) => [
                styles.copyButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons
                name={codeCopied ? 'checkmark-outline' : 'copy-outline'}
                size={16}
                color={colors.primaryForeground}
              />
              <Text style={[styles.copyButtonText, { color: colors.primaryForeground }]}>
                {codeCopied ? 'Copied!' : 'Copy code'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appearance</Text>
          <View style={[styles.themeRow]}>
            {THEME_OPTIONS.map(option => {
              const active = userData.themePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setThemePreference(option.value);
                  }}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: active ? colors.primary : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: active ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notifications</Text>

          {([
            { label: 'Daily ritual reminder', key: 'notifRitual' as const, value: userData.notifRitual, timeKey: 'ritual' as const, hour: userData.ritualHour ?? 9, minute: userData.ritualMinute ?? 0 },
            { label: 'Evening intention check-in', key: 'notifEvening' as const, value: userData.notifEvening, timeKey: 'evening' as const, hour: userData.eveningHour ?? 20, minute: userData.eveningMinute ?? 0 },
          ]).map((item, i) => {
            const h12 = item.hour % 12 === 0 ? 12 : item.hour % 12;
            const ampm = item.hour >= 12 ? 'PM' : 'AM';
            const timeLabel = `${h12}:${String(item.minute).padStart(2, '0')} ${ampm}`;
            return (
              <View key={item.label} style={[styles.settingRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTimePickerOpen(item.timeKey);
                  }}
                  style={styles.notifLabelArea}
                >
                  <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <View style={styles.notifTimeRow}>
                    <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.notifTimeLabel, { color: colors.mutedForeground }]}>{timeLabel}</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    Haptics.selectionAsync();
                    const next = !item.value;
                    if (next) {
                      const granted = await requestNotifPermission();
                      if (!granted) {
                        await disableAllNotificationPrefs();
                        setNotifBlocked(true);
                        return;
                      }
                      setNotifBlocked(false);
                    }
                    setNotificationPref(item.key, next);
                  }}
                >
                  <View style={[styles.toggle, { backgroundColor: item.value ? colors.primary : colors.border }]}>
                    <View style={[styles.toggleThumb, item.value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
                  </View>
                </Pressable>
              </View>
            );
          })}

          <Pressable
            onPress={async () => {
              Haptics.selectionAsync();
              const next = !userData.notifMilestone;
              if (next) {
                const granted = await requestNotifPermission();
                if (!granted) {
                  await disableAllNotificationPrefs();
                  setNotifBlocked(true);
                  return;
                }
                setNotifBlocked(false);
              }
              setNotificationPref('notifMilestone', next);
            }}
            style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}
          >
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Milestone celebrations</Text>
            <View style={[styles.toggle, { backgroundColor: userData.notifMilestone ? colors.primary : colors.border }]}>
              <View style={[styles.toggleThumb, userData.notifMilestone ? styles.toggleThumbOn : styles.toggleThumbOff]} />
            </View>
          </Pressable>

          {notifBlocked && (
            <View style={[styles.notifBlockedNote, { backgroundColor: colors.muted }]}>
              <Ionicons name="notifications-off-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.notifBlockedText, { color: colors.mutedForeground }]}>
                Notifications are blocked. To enable, go to your device{'\u00a0'}Settings → Authentic Steps.
              </Text>
            </View>
          )}
        </View>

        {timePickerOpen !== null && Platform.OS === 'android' && (
          <DateTimePicker
            mode="time"
            value={(() => {
              const d = new Date();
              d.setHours(timePickerOpen === 'ritual' ? (userData.ritualHour ?? 9) : (userData.eveningHour ?? 20));
              d.setMinutes(timePickerOpen === 'ritual' ? (userData.ritualMinute ?? 0) : (userData.eveningMinute ?? 0));
              d.setSeconds(0);
              return d;
            })()}
            is24Hour={false}
            onChange={(_e: DateTimePickerEvent, date?: Date) => {
              const key = timePickerOpen;
              setTimePickerOpen(null);
              if (date && key) {
                Haptics.selectionAsync();
                setNotificationTime(key, date.getHours(), date.getMinutes());
              }
            }}
          />
        )}

        {timePickerOpen !== null && Platform.OS === 'ios' && (
          <Modal transparent animationType="fade" onRequestClose={() => setTimePickerOpen(null)}>
            <TouchableWithoutFeedback onPress={() => setTimePickerOpen(null)}>
              <View style={styles.pickerOverlay}>
                <TouchableWithoutFeedback>
                  <View style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
                    <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                      {timePickerOpen === 'ritual' ? 'Daily reminder time' : 'Evening check-in time'}
                    </Text>
                    <DateTimePicker
                      mode="time"
                      display="spinner"
                      value={(() => {
                        const d = new Date();
                        d.setHours(timePickerOpen === 'ritual' ? (userData.ritualHour ?? 9) : (userData.eveningHour ?? 20));
                        d.setMinutes(timePickerOpen === 'ritual' ? (userData.ritualMinute ?? 0) : (userData.eveningMinute ?? 0));
                        d.setSeconds(0);
                        return d;
                      })()}
                      onChange={(_e: DateTimePickerEvent, date?: Date) => {
                        if (date && timePickerOpen) {
                          setNotificationTime(timePickerOpen, date.getHours(), date.getMinutes());
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                    <Pressable
                      onPress={() => setTimePickerOpen(null)}
                      style={[styles.pickerDone, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.pickerDoneText, { color: colors.primaryForeground }]}>Done</Text>
                    </Pressable>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Privacy</Text>
          <Pressable
            onPress={handleDownloadData}
            style={[styles.settingRow]}
          >
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Download my data</Text>
            <Ionicons name="download-outline" size={18} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            onPress={handleDeleteData}
            disabled={isDeleting}
            style={[
              styles.settingRow,
              { borderTopWidth: 1, borderTopColor: colors.border },
              isDeleting && { opacity: 0.5 },
            ]}
          >
            <Text style={[styles.settingLabel, { color: colors.destructive }]}>
              {isDeleting ? 'Deleting…' : 'Delete all my data'}
            </Text>
            {isDeleting
              ? <ActivityIndicator size="small" color={colors.destructive} />
              : <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            }
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
          {[
            { label: 'Privacy Policy', icon: 'shield-outline', type: 'privacy' },
            { label: 'Terms of Service', icon: 'document-text-outline', type: 'terms' },
            { label: 'Safe Messaging Guidelines', icon: 'heart-outline', type: 'safe-messaging' },
          ].map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(`/legal?type=${item.type}` as any)}
              style={({ pressed }) => [
                styles.settingRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Ionicons name={item.icon as any} size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.brandNote, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.brandText, { color: colors.mutedForeground }]}>
            Authentic Steps For Youth — Version 1.0
          </Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>
            Your data is private and never sold. Designed for young people, with care.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  profileInfo: { flex: 1, gap: 3 },
  username: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  anonNote: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  recoveryExplain: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  codeBox: {
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 20,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  codeSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  lastUpdatedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  refreshButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  copyButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notifLabelArea: {
    flex: 1,
    gap: 3,
  },
  notifTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifTimeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    alignSelf: 'flex-start',
  },
  pickerDone: {
    alignSelf: 'stretch',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  pickerDoneText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  settingLabel: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleThumbOff: { alignSelf: 'flex-start' },
  notifBlockedNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
  },
  notifBlockedText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  syncText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  brandNote: { borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  brandText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  brandSub: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  toastIcon: { fontSize: 18 },
  toastText: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1, lineHeight: 20 },
});

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemePreference, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

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
  const { userData, setThemePreference, buildRecoveryPayload } = useApp();
  const [notifRitual, setNotifRitual] = useState(true);
  const [notifEvening, setNotifEvening] = useState(true);
  const [notifMilestone, setNotifMilestone] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeRefreshed, setCodeRefreshed] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedPayloadRef = useRef<string>('');

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

  function handleDeleteData() {
    Alert.alert(
      'Delete your data',
      'This will permanently delete all your ritual entries, streak data, and milestones. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  }

  function handleDownloadData() {
    Alert.alert('Download your data', 'Your data export will be prepared. In the full version, this will email you a copy of all your entries.');
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
          {[
            { label: 'Daily ritual reminder', value: notifRitual, set: setNotifRitual },
            { label: 'Evening intention check-in', value: notifEvening, set: setNotifEvening },
            { label: 'Milestone celebrations', value: notifMilestone, set: setNotifMilestone },
          ].map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => { Haptics.selectionAsync(); item.set(v => !v); }}
              style={[styles.settingRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
            >
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
              <View
                style={[
                  styles.toggle,
                  { backgroundColor: item.value ? colors.primary : colors.border },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    item.value ? styles.toggleThumbOn : styles.toggleThumbOff,
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>

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
            style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}
          >
            <Text style={[styles.settingLabel, { color: colors.destructive }]}>Delete all my data</Text>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
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
  settingLabel: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleThumbOff: { alignSelf: 'flex-start' },
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
  brandNote: { borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  brandText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  brandSub: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
});

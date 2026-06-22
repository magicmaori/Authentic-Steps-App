import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOSButton } from '@/components/SOSButton';
import { ThemePreference, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userData, setThemePreference } = useApp();
  const [notifRitual, setNotifRitual] = useState(true);
  const [notifEvening, setNotifEvening] = useState(true);
  const [notifMilestone, setNotifMilestone] = useState(true);

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
            { label: 'Privacy Policy', icon: 'shield-outline' },
            { label: 'Terms of Service', icon: 'document-text-outline' },
            { label: 'Safe Messaging Guidelines', icon: 'heart-outline' },
          ].map((item, i) => (
            <Pressable
              key={item.label}
              style={[styles.settingRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
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
      <SOSButton />
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

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOSButton } from '@/components/SOSButton';
import { VideoPlaceholder } from '@/components/VideoPlaceholder';
import { AffirmationTheme, THEME_LABELS, affirmations } from '@/constants/affirmations';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const THEMES: AffirmationTheme[] = ['confidence', 'resilience', 'relationships', 'purpose', 'calm'];

export default function IAmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveIAmStatement } = useApp();

  const [activeTheme, setActiveTheme] = useState<AffirmationTheme>('confidence');
  const [selected, setSelected] = useState('');
  const [mode, setMode] = useState<'library' | 'custom'>('library');
  const [customText, setCustomText] = useState('');
  const [saving, setSaving] = useState(false);

  const themeAffirmations = affirmations.filter(a => a.theme === activeTheme);
  const finalStatement = mode === 'custom' ? customText.trim() : selected;
  const canConfirm = finalStatement.length > 0;

  async function handleSelect(text: string) {
    await Haptics.selectionAsync();
    setSelected(text);
  }

  async function handleConfirm() {
    if (!canConfirm || saving) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveIAmStatement(finalStatement);
    router.push('/ritual/complete');
    setSaving(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, '#193b83']}
        style={[styles.headerGrad, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerNavRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <SOSButton inline />
        </View>
        <View style={styles.progressRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.progressDot, { backgroundColor: '#fff' }]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>
        <Text style={styles.headerTitle}>I Am...</Text>
        <Text style={styles.prompt}>Choose or write your I Am statement for today.</Text>
      </LinearGradient>

      <VideoPlaceholder
        label="About this practice — I Am"
        sublabel="A short intro to I Am affirmation practice"
      />

      <View style={[styles.modeRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setMode('library')}
          style={[
            styles.modeBtn,
            mode === 'library' && { borderBottomWidth: 2, borderBottomColor: colors.accent },
          ]}
        >
          <Text style={[styles.modeBtnText, { color: mode === 'library' ? colors.accent : colors.mutedForeground }]}>
            Library
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('custom')}
          style={[
            styles.modeBtn,
            mode === 'custom' && { borderBottomWidth: 2, borderBottomColor: colors.accent },
          ]}
        >
          <Text style={[styles.modeBtnText, { color: mode === 'custom' ? colors.accent : colors.mutedForeground }]}>
            Write my own
          </Text>
        </Pressable>
      </View>

      {mode === 'library' ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.themeScroll, { backgroundColor: colors.card }]}
            contentContainerStyle={styles.themeScrollContent}
          >
            {THEMES.map(theme => (
              <Pressable
                key={theme}
                onPress={() => { setActiveTheme(theme); setSelected(''); }}
                style={[
                  styles.themeChip,
                  activeTheme === theme
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    { color: activeTheme === theme ? '#fff' : colors.mutedForeground },
                  ]}
                >
                  {THEME_LABELS[theme]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: Platform.OS === 'web' ? 160 : 140 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {themeAffirmations.map(a => (
              <Pressable
                key={a.id}
                onPress={() => handleSelect(a.text)}
                style={[
                  styles.statCard,
                  selected === a.text
                    ? { backgroundColor: `${colors.accent}15`, borderColor: colors.accent }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.statCardInner}>
                  {selected === a.text && (
                    <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.statText, { color: colors.foreground }]}>{a.text}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : (
        <View style={[styles.customContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.customPrompt, { color: colors.mutedForeground }]}>
            Start with "I am..." and write something true about who you are.
          </Text>
          <View style={[styles.customCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.iAmPrefix, { color: colors.accent }]}>I am...</Text>
            <TextInput
              style={[styles.customInput, { color: colors.foreground }]}
              placeholder="worthy of good things"
              placeholderTextColor={colors.mutedForeground}
              value={customText}
              onChangeText={setCustomText}
              multiline
              maxLength={100}
              autoFocus
            />
          </View>
        </View>
      )}

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'web' ? insets.bottom + 34 : insets.bottom + 12,
          },
        ]}
      >
        {selected && mode === 'library' && (
          <View style={[styles.selectedPreview, { backgroundColor: `${colors.accent}12` }]}>
            <Text style={[styles.selectedText, { color: colors.accent }]} numberOfLines={2}>
              {selected}
            </Text>
          </View>
        )}
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={({ pressed }) => [
            styles.confirmBtn,
            { backgroundColor: canConfirm ? colors.accent : colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.confirmBtnText, { color: canConfirm ? '#fff' : colors.mutedForeground }]}>
            This is my I Am statement
          </Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 24, gap: 6 },
  headerNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {},
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#fff', letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff', marginTop: 2 },
  prompt: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#fff', lineHeight: 20, marginTop: 2 },
  modeRow: { flexDirection: 'row', borderBottomWidth: 1 },
  modeBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  modeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  themeScroll: { flexGrow: 0 },
  themeScrollContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  themeChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  themeChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  scroll: { flex: 1 },
  gridContent: { padding: 16, gap: 8 },
  statCard: { borderRadius: 14, padding: 14, borderWidth: 1.5 },
  statCardInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, flex: 1 },
  customContainer: { flex: 1, padding: 20, gap: 14 },
  customPrompt: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  customCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 6 },
  iAmPrefix: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  customInput: { fontSize: 17, fontFamily: 'Inter_400Regular', minHeight: 80, lineHeight: 26 },
  footer: { padding: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  selectedPreview: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  selectedText: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
  },
  confirmBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  pressed: { opacity: 0.85 },
});

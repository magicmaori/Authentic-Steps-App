import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOSButton } from '@/components/SOSButton';
import { VideoPlaceholder } from '@/components/VideoPlaceholder';
import { getVideoUrl } from '@/lib/videoSource';
import { SCREENSHOT_MODE } from '@/constants/screenshotSeed';
import { GratitudeCategory } from '@/context/AppContext';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const CATEGORIES: { id: GratitudeCategory; label: string; icon: string }[] = [
  { id: 'people', label: 'People', icon: 'people' },
  { id: 'experiences', label: 'Experiences', icon: 'sparkles' },
  { id: 'things', label: 'Things', icon: 'star' },
  { id: 'self', label: 'Self', icon: 'heart' },
];

export default function GratitudeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveGratitude, isLoaded } = useApp();

  const [texts, setTexts] = useState<string[]>(
    SCREENSHOT_MODE
      ? ['My little sister making me laugh until I cried', 'The coach who stayed late to help me with free throws', 'A quiet morning with my dog before school']
      : ['', '', '']
  );
  const [cats, setCats] = useState<GratitudeCategory[]>(['people', 'experiences', 'things']);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const cardYPositions = useRef<number[]>([0, 0, 0]);

  const ref1 = useRef<TextInput>(null);
  const ref2 = useRef<TextInput>(null);
  const ref3 = useRef<TextInput>(null);
  const refs = [ref1, ref2, ref3];

  function handleCardLayout(index: number, e: LayoutChangeEvent) {
    cardYPositions.current[index] = e.nativeEvent.layout.y;
  }

  function scrollToCard(index: number) {
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, cardYPositions.current[index] - 16),
      animated: true,
    });
  }

  const filledCount = texts.filter(t => t.trim().length > 0).length;
  const canContinue = filledCount >= 1;

  async function handleContinue() {
    if (!canContinue || saving) return;
    setSaving(true);
    setSaveError(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const entries = texts
      .map((text, i) => ({ text: text.trim(), category: cats[i] }))
      .filter(e => e.text.length > 0);
    try {
      await saveGratitude(entries);
      router.push('/ritual/intention');
    } catch {
      setSaveError('Could not save your gratitude. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function setCategory(index: number, cat: GratitudeCategory) {
    const updated = [...cats];
    updated[index] = cat;
    setCats(updated);
  }

  function setText(index: number, val: string) {
    const updated = [...texts];
    updated[index] = val;
    setTexts(updated);
  }

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.loadingCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <View
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)' },
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 1 of 3</Text>
        <Text style={styles.headerTitle}>Gratitude</Text>
        <Text style={styles.prompt}>
          Name 3 things you are grateful for today — big or small.
        </Text>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 160 : 140 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            {!SCREENSHOT_MODE && (
              <VideoPlaceholder
                label="About this practice — Gratitude"
                sublabel="A short intro to gratitude practice"
                source={getVideoUrl('gratitudeIntro')}
              />
            )}
            {[0, 1, 2].map(i => (
              <View
                key={i}
                onLayout={(e) => handleCardLayout(i, e)}
                style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.entryNumRow}>
                  <View style={[styles.entryNum, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.entryNumText, { color: colors.primary }]}>{i + 1}</Text>
                  </View>
                  {texts[i].trim().length > 0 && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </View>

                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Text style={[styles.inputPrefix, { color: colors.primary }]}>I am grateful for</Text>
                  <TextInput
                    ref={refs[i]}
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="..."
                    placeholderTextColor={colors.mutedForeground}
                    value={texts[i]}
                    onChangeText={v => setText(i, v)}
                    maxLength={100}
                    returnKeyType={i < 2 ? 'next' : 'done'}
                    onSubmitEditing={() => refs[i + 1]?.current?.focus()}
                    onFocus={() => scrollToCard(i)}
                    multiline
                  />
                </View>

                <View style={styles.categoryRow}>
                  {CATEGORIES.map(cat => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(i, cat.id)}
                      style={[
                        styles.catChip,
                        cats[i] === cat.id
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={12}
                        color={cats[i] === cat.id ? '#fff' : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          { color: cats[i] === cat.id ? '#fff' : colors.mutedForeground },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <View style={[styles.treeRow, { backgroundColor: colors.secondary }]}>
              {[0, 1, 2].map(i => (
                <View key={i} style={styles.leafSlot}>
                  <View
                    style={[
                      styles.leaf,
                      texts[i].trim().length > 0
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name="leaf"
                      size={22}
                      color={texts[i].trim().length > 0 ? '#fff' : colors.mutedForeground}
                    />
                  </View>
                  <View style={[styles.leafStem, { backgroundColor: texts[i].trim().length > 0 ? colors.primary : colors.border }]} />
                </View>
              ))}
              <View style={[styles.treeTrunk, { backgroundColor: colors.border }]} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

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
        {saveError && (
          <Text testID="save-error" style={[styles.saveErrorText, { color: colors.destructive }]}>
            {saveError}
          </Text>
        )}
        <View style={styles.footerRow}>
          <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
            {filledCount}/3 — at least 1 required
          </Text>
          <Pressable
            testID="continue-btn"
            onPress={handleContinue}
            disabled={!canContinue || saving}
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: canContinue ? colors.primary : colors.border },
              pressed && styles.pressed,
            ]}
          >
          <Text style={[styles.continueBtnText, { color: canContinue ? '#fff' : colors.mutedForeground }]}>
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={canContinue ? '#fff' : colors.mutedForeground}
          />
          </Pressable>
        </View>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { justifyContent: 'center', alignItems: 'center' },
  headerGrad: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 6,
  },
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  entryCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  entryNumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  entryNumText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputPrefix: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
    letterSpacing: 0.1,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    minHeight: 44,
    lineHeight: 22,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catChipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  treeRow: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 24,
    minHeight: 100,
    position: 'relative',
  },
  leafSlot: { alignItems: 'center', gap: 4 },
  leaf: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafStem: { width: 3, height: 16, borderRadius: 2 },
  treeTrunk: {
    position: 'absolute',
    bottom: 16,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 2,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerHint: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  saveErrorText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  continueBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  pressed: { opacity: 0.85 },
});

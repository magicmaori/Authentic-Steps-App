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
import { IntentionCategory, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const CATEGORIES: { id: IntentionCategory; label: string; icon: string }[] = [
  { id: 'movement', label: 'Movement', icon: 'walk' },
  { id: 'connection', label: 'Connection', icon: 'people' },
  { id: 'learning', label: 'Learning', icon: 'book' },
  { id: 'rest', label: 'Rest', icon: 'moon' },
  { id: 'creativity', label: 'Creativity', icon: 'brush' },
];

export default function IntentionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveIntention } = useApp();

  const [text, setText] = useState('');
  const [category, setCategory] = useState<IntentionCategory | ''>('');
  const [saving, setSaving] = useState(false);

  const canContinue = text.trim().length > 0;

  async function handleContinue() {
    if (!canContinue || saving) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveIntention(text.trim(), category);
    router.push('/ritual/iamstatement');
    setSaving(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, '#193b83']}
        style={[styles.headerGrad, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.progressRow}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i <= 1 ? '#fff' : 'rgba(255,255,255,0.35)' },
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
        <Text style={styles.headerTitle}>Intention</Text>
        <Text style={styles.prompt}>
          What is one thing INSIDE your control that you will do today to make your day great?
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 160 : 140 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.circleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Circle of Influence</Text>
          <View style={styles.circleContainer}>
            <View style={[styles.outerCircle, { borderColor: colors.border }]}>
              <Text style={[styles.circleLabel, styles.outerLabel, { color: colors.mutedForeground }]}>
                Out of my control
              </Text>
              <View style={[styles.innerCircle, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}>
                <Text style={[styles.circleLabel, styles.innerLabel, { color: colors.primary }]}>
                  I control
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.circleHint, { color: colors.mutedForeground }]}>
            Focus your intention on what sits in the inner circle — your actions, thoughts, and choices.
          </Text>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>My intention today</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Today I will..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{text.length}/200</Text>
        </View>

        <View style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Category (optional)</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(category === cat.id ? '' : cat.id)}
                style={[
                  styles.catBtn,
                  category === cat.id
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={category === cat.id ? '#fff' : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.catBtnText,
                    { color: category === cat.id ? '#fff' : colors.foreground },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
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
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
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

      <SOSButton bottom={Platform.OS === 'web' ? 120 : 90} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 24, gap: 6 },
  backBtn: { marginBottom: 4 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#fff', letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff', marginTop: 2 },
  prompt: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#fff', lineHeight: 20, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  circleCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  circleContainer: { alignItems: 'center', paddingVertical: 8 },
  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  outerLabel: { position: 'absolute', top: 8, width: '80%' },
  innerLabel: {},
  circleHint: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, textAlign: 'center' },
  inputCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    lineHeight: 22,
  },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  categoryCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  catBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  footer: { padding: 16, paddingTop: 12, borderTopWidth: 1 },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  continueBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  pressed: { opacity: 0.85 },
});

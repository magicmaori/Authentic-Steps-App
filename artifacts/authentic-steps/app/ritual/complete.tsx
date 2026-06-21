import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function CompleteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayEntry, userData, markRitualComplete } = useApp();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    markRitualComplete();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 6 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleDone() {
    router.dismissAll();
  }

  const isFirstRitual = userData.totalRituals <= 1;
  const streak = userData.currentStreak;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, '#193b83']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.bigCircle}>
            <Ionicons name="checkmark" size={52} color="#001f3d" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textBlock, { opacity: fadeAnim }]}>
          <Text style={styles.bigTitle}>
            {isFirstRitual ? 'Your first step!' : 'Ritual complete!'}
          </Text>
          <Text style={styles.subtitle}>
            {isFirstRitual
              ? "You just took your first authentic step. That took courage."
              : "You showed up for yourself today. That matters."}
          </Text>

          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={20} color="#F4A261" />
            <Text style={styles.streakText}>
              {streak === 1 ? '1 day streak — you have started!' : `${streak} day streak`}
            </Text>
          </View>

          {todayEntry?.iAmStatement ? (
            <View style={styles.iAmCard}>
              <Text style={styles.iAmLabel}>Today you are...</Text>
              <Text style={styles.iAmStatement}>{todayEntry.iAmStatement}</Text>
            </View>
          ) : null}

          {todayEntry?.intention ? (
            <View style={[styles.summaryRow, { borderTopColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="radio-button-on" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.summaryText} numberOfLines={2}>
                Intention: {todayEntry.intention}
              </Text>
            </View>
          ) : null}
        </Animated.View>

        <Pressable
          onPress={handleDone}
          style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
        >
          <Text style={[styles.doneBtnText, { color: '#001f3d' }]}>Back to home</Text>
          <Ionicons name="home" size={18} color="#001f3d" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  iconWrap: { marginTop: 20 },
  bigCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  textBlock: { alignItems: 'center', gap: 14, width: '100%' },
  bigTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  streakText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  iAmCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    gap: 6,
  },
  iAmLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  iAmStatement: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#fff', lineHeight: 26 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
    width: '100%',
  },
  summaryText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#fff', flex: 1, lineHeight: 18 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 15,
    marginBottom: 10,
  },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  pressed: { opacity: 0.85 },
});

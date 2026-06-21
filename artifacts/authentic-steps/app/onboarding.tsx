import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { useApp } from '@/context/AppContext';

const PILLARS = [
  { icon: '🌿', label: 'Gratitude', desc: 'Name three things you are grateful for' },
  { icon: '🎯', label: 'Intention', desc: 'Set one action that is inside your control' },
  { icon: '⭐', label: 'I Am', desc: 'Choose a daily affirmation for yourself' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  async function handleGetStarted() {
    await completeOnboarding();
    router.replace('/(tabs)');
  }

  return (
    <LinearGradient
      colors={['#193b83', '#03989e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.gradient}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <View style={styles.logoArea}>
          <AppLogo size="xl" showTagline tint="light" />
          <Text style={styles.taglineText}>
            Build the habit of showing up for yourself — every single day.
          </Text>
        </View>

        <View style={styles.pillarsArea}>
          <Text style={styles.pillarsHeading}>Your 3-minute daily ritual</Text>
          <View style={styles.pillars}>
            {PILLARS.map(p => (
              <View key={p.label} style={styles.pillarRow}>
                <View style={styles.pillarIcon}>
                  <Text style={styles.pillarEmoji}>{p.icon}</Text>
                </View>
                <View style={styles.pillarText}>
                  <Text style={styles.pillarLabel}>{p.label}</Text>
                  <Text style={styles.pillarDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </Pressable>
          <Text style={styles.footerNote}>
            Anonymous · No account required · Free
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  logoArea: {
    gap: 20,
  },
  taglineText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
    maxWidth: Platform.OS === 'web' ? 420 : undefined,
  },
  pillarsArea: {
    gap: 16,
  },
  pillarsHeading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pillars: { gap: 12 },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
  },
  pillarIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarEmoji: { fontSize: 22 },
  pillarText: { flex: 1, gap: 2 },
  pillarLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pillarDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  footer: {
    gap: 14,
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ctaPressed: { opacity: 0.88 },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#193b83',
    letterSpacing: -0.2,
  },
  footerNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
});

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VideoPlaceholder } from '@/components/VideoPlaceholder';
import { SCREENSHOT_MODE } from '@/constants/screenshotSeed';
import { useColors } from '@/hooks/useColors';

interface Service {
  id: string;
  name: string;
  description: string;
  phone?: string;
  url?: string;
  badge?: string;
  color: string;
  darkColor: string;
}

const SERVICES: Service[] = [
  {
    id: 'kids',
    name: 'Kids Helpline',
    description: 'Free, private counselling for 5–25 year olds. Available 24/7.',
    phone: '1800551800',
    url: 'https://kidshelpline.com.au/get-help/webchat',
    badge: '24/7',
    color: '#03989e',
    darkColor: '#5dd8dd',
  },
  {
    id: 'lifeline',
    name: 'Lifeline',
    description: 'Crisis support and suicide prevention. Available 24/7.',
    phone: '131114',
    url: 'https://www.lifeline.org.au/crisis-chat/',
    badge: '24/7',
    color: '#3B82F6',
    darkColor: '#93c5fd',
  },
  {
    id: 'beyondblue',
    name: 'Beyond Blue',
    description: 'Support for anxiety, depression and mental health.',
    phone: '1300224636',
    url: 'https://www.beyondblue.org.au/get-support/get-immediate-support',
    color: '#1D4ED8',
    darkColor: '#93c5fd',
  },
  {
    id: 'headspace',
    name: 'headspace',
    description: 'Youth mental health support. Find a centre near you.',
    url: 'https://headspace.org.au/headspace-centres/',
    color: '#7C3AED',
    darkColor: '#c4b5fd',
  },
  {
    id: '13yarn',
    name: '13YARN',
    description: 'First Nations crisis support. Culturally safe, 24/7.',
    phone: '139276',
    badge: '24/7',
    color: '#B45309',
    darkColor: '#fbbf24',
  },
  {
    id: 'emergency',
    name: 'Emergency Services',
    description: 'If you or someone else is in immediate danger.',
    phone: '000',
    badge: 'Immediate',
    color: '#EF4444',
    darkColor: '#fca5a5',
  },
];

async function callNumber(phone: string) {
  const url = `tel:${phone}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Call', `Please call ${phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}`);
  }
}

async function openChat(url: string) {
  await WebBrowser.openBrowserAsync(url);
}

export default function SOSScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  async function handleClose() {
    await Haptics.selectionAsync();
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, '#193b83']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Pressable
          onPress={handleClose}
          style={styles.closeBtn}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.heartCircle}>
            <Ionicons name="heart" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>You are not alone</Text>
          <Text style={styles.headerSubtitle}>
            Whatever you are going through, support is here. Choose how you want to reach out.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24, paddingTop: Platform.OS === 'web' ? 16 : 0 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!SCREENSHOT_MODE && (
          <VideoPlaceholder
            label="A message for you"
            sublabel="A personal message from the Authentic STEPS team"
          />
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Immediate Support Services</Text>

        {SERVICES.map((service) => {
          const accentColor = isDark ? service.darkColor : service.color;
          const btnBg = isDark ? service.darkColor : service.color;
          const btnFg = isDark ? colors.background : '#fff';
          return (
            <View
              key={service.id}
              style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.serviceHeader}>
                <View style={[styles.serviceDot, { backgroundColor: accentColor }]} />
                <View style={styles.serviceTitleRow}>
                  <Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text>
                  {service.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.badgeText, { color: accentColor }]}>{service.badge}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{service.description}</Text>
              <View style={styles.serviceActions}>
                {service.phone && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: btnBg },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => callNumber(service.phone!)}
                  >
                    <Ionicons name="call" size={16} color={btnFg} />
                    <Text style={[styles.actionBtnText, { color: btnFg }]}>Call</Text>
                  </Pressable>
                )}
                {service.url && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtnOutline,
                      { borderColor: accentColor },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => openChat(service.url!)}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={accentColor} />
                    <Text style={[styles.actionBtnOutlineText, { color: accentColor }]}>Chat</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        <View style={[styles.note, { backgroundColor: colors.secondary }]}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            These services are confidential and free. You deserve support.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Breathing Exercises</Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          Slow breathing signals safety to your nervous system. Try one now.
        </Text>

        <View style={[styles.breathCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.breathIconWrap, { backgroundColor: '#03989e18' }]}>
            <Ionicons name="pulse" size={22} color="#03989e" />
          </View>
          <Text style={[styles.breathTitle, { color: colors.foreground }]}>Box Breathing</Text>
          <Text style={[styles.breathDesc, { color: colors.mutedForeground }]}>
            Used by athletes and first responders to reset fast.
          </Text>
          <View style={styles.breathSteps}>
            {[
              { label: 'Breathe IN', count: '4 counts', color: '#03989e' },
              { label: 'HOLD', count: '4 counts', color: '#193b83' },
              { label: 'Breathe OUT', count: '4 counts', color: '#03989e' },
              { label: 'HOLD', count: '4 counts', color: '#193b83' },
            ].map((s, i) => (
              <View key={i} style={styles.breathStepRow}>
                <View style={[styles.breathStepDot, { backgroundColor: s.color }]} />
                <Text style={[styles.breathStepLabel, { color: colors.foreground }]}>{s.label}</Text>
                <Text style={[styles.breathStepCount, { color: colors.mutedForeground }]}>{s.count}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.breathRepeat, { color: colors.mutedForeground }]}>Repeat 4 times</Text>
        </View>

        <View style={[styles.breathCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.breathIconWrap, { backgroundColor: '#193b8318' }]}>
            <Ionicons name="moon" size={22} color="#193b83" />
          </View>
          <Text style={[styles.breathTitle, { color: colors.foreground }]}>4-7-8 Calm Down</Text>
          <Text style={[styles.breathDesc, { color: colors.mutedForeground }]}>
            Great for anxiety, panic, or when you can't sleep.
          </Text>
          <View style={styles.breathSteps}>
            {[
              { label: 'Breathe IN through nose', count: '4 counts', color: '#03989e' },
              { label: 'HOLD', count: '7 counts', color: '#193b83' },
              { label: 'Breathe OUT through mouth', count: '8 counts', color: '#03989e' },
            ].map((s, i) => (
              <View key={i} style={styles.breathStepRow}>
                <View style={[styles.breathStepDot, { backgroundColor: s.color }]} />
                <Text style={[styles.breathStepLabel, { color: colors.foreground }]}>{s.label}</Text>
                <Text style={[styles.breathStepCount, { color: colors.mutedForeground }]}>{s.count}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.breathRepeat, { color: colors.mutedForeground }]}>Repeat 3–4 times</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Move to Reset</Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          Physical movement burns off stress hormones and shifts your mood fast.
        </Text>

        {[
          {
            icon: 'body',
            title: '10 Star Jumps',
            desc: 'Gets blood moving and releases tension held in the body. Do them big — arms and legs fully extended.',
            color: '#2D6A4F',
          },
          {
            icon: 'walk',
            title: 'Walk & Count',
            desc: 'Go for a 5-minute walk and silently count your steps. Counting keeps your mind present.',
            color: '#193b83',
          },
          {
            icon: 'hand-left',
            title: 'Progressive Muscle Release',
            desc: 'Clench every muscle tight for 5 seconds — fists, arms, shoulders, legs — then release all at once. Repeat 3 times.',
            color: '#03989e',
          },
          {
            icon: 'water',
            title: 'Cold Water Reset',
            desc: 'Splash cold water on your face or hold ice cubes. Activates the dive reflex and slows your heart rate.',
            color: '#1D4ED8',
          },
        ].map(ex => (
          <View
            key={ex.title}
            style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: ex.color }]}
          >
            <View style={[styles.exerciseIconWrap, { backgroundColor: `${ex.color}15` }]}>
              <Ionicons name={ex.icon as any} size={20} color={ex.color} />
            </View>
            <View style={styles.exerciseText}>
              <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>{ex.title}</Text>
              <Text style={[styles.exerciseDesc, { color: colors.mutedForeground }]}>{ex.desc}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.groundingSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groundingHeading, { color: colors.foreground }]}>5-4-3-2-1 Grounding</Text>
          <Text style={[styles.groundingIntro, { color: colors.mutedForeground }]}>
            Brings you back to the present moment when overwhelmed. Name out loud or in your head:
          </Text>
          {[
            { n: '5', sense: 'things you can SEE', icon: 'eye' },
            { n: '4', sense: 'things you can TOUCH', icon: 'hand-right' },
            { n: '3', sense: 'things you can HEAR', icon: 'ear' },
            { n: '2', sense: 'things you can SMELL', icon: 'flower' },
            { n: '1', sense: 'thing you can TASTE', icon: 'restaurant' },
          ].map(g => (
            <View key={g.n} style={styles.groundingRow}>
              <View style={[styles.groundingBadge, { backgroundColor: '#03989e' }]}>
                <Text style={styles.groundingNum}>{g.n}</Text>
              </View>
              <Text style={[styles.groundingSense, { color: colors.foreground }]}>{g.sense}</Text>
              <Ionicons name={g.icon as any} size={16} color={colors.mutedForeground} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 12,
  },
  headerContent: { alignItems: 'center', gap: 10 },
  heartCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: -4 },
  sectionHint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -8 },
  serviceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceDot: { width: 10, height: 10, borderRadius: 5 },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  serviceName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  serviceDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  serviceActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1.5,
  },
  actionBtnOutlineText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  pressed: { opacity: 0.8 },
  note: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },

  breathCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  breathIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  breathTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  breathDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  breathSteps: { gap: 8, marginTop: 4 },
  breathStepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breathStepDot: { width: 8, height: 8, borderRadius: 4 },
  breathStepLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  breathStepCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  breathRepeat: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'right' },

  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 12,
  },
  exerciseIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  exerciseText: { flex: 1, gap: 4 },
  exerciseTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  exerciseDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  groundingSection: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  groundingHeading: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  groundingIntro: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -4 },
  groundingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groundingBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groundingNum: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  groundingSense: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});

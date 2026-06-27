import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VideoPlaceholder } from '@/components/VideoPlaceholder';
import { useColors } from '@/hooks/useColors';

type HelplineService = {
  name: string;
  num: string;
  display: string;
  desc: string;
  initials: string;
  /** Accent colour verified ≥3:1 against the light card (#FFFFFF). Used for border + badge in light mode. */
  lightAccent: string;
  /** Accent colour verified ≥4.5:1 against the dark card (#193b83). Used for border + badge in dark mode. */
  darkAccent: string;
};

const HELPLINES: HelplineService[] = [
  // Kids Helpline — brand orange. Light: darkened to #E05A00 (3.57:1 on white). Dark: #FFAA55 (5.13:1 on #193b83).
  { name: 'Kids Helpline', num: '1800551800', display: '1800 55 1800', desc: 'Free, private, 24/7 for ages 5–25', initials: 'KH', lightAccent: '#E05A00', darkAccent: '#FFAA55' },
  // Lifeline — brand orange-flame. #F26522 = 3.15:1 on white ✓. Dark: #FF9966 (4.63:1).
  { name: 'Lifeline',      num: '131114',     display: '13 11 14',     desc: 'Crisis support, 24/7',              initials: 'LL', lightAccent: '#F26522', darkAccent: '#FF9966' },
  // Beyond Blue — brand navy. #003D7D = 9.72:1 on white ✓. Dark: #8BBFE8 (4.93:1).
  { name: 'Beyond Blue',   num: '1300224636', display: '1300 22 4636', desc: 'Anxiety & depression support',      initials: 'BB', lightAccent: '#003D7D', darkAccent: '#8BBFE8' },
  // 13YARN — brand amber. #C47A1E = 3.17:1 on white ✓. Dark: #F0B040 (5.08:1).
  { name: '13YARN',        num: '139276',     display: '13 92 76',     desc: 'First Nations, culturally safe, 24/7', initials: '13', lightAccent: '#C47A1E', darkAccent: '#F0B040' },
  // Emergency — red. #CC0000 = 5.89:1 on white ✓. Dark: #FF9999 (4.56:1).
  { name: 'Emergency',     num: '000',        display: '000',          desc: 'Immediate danger — call now',       initials: 'SOS', lightAccent: '#CC0000', darkAccent: '#FF9999' },
];

// ─── Contrast utilities (WCAG 2.1 relative luminance) ─────────────────────────

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** White or near-black text, whichever achieves higher contrast on `bgHex`. */
function badgeTextColor(bgHex: string): string {
  const L = relativeLuminance(bgHex);
  // White contrast: 1.05/(L+0.05). Black contrast: (L+0.05)/0.05 (black L=0).
  // White wins when L < ~0.179.
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.05 ? '#ffffff' : '#1a1a1a';
}

/** Alpha-composite `fg` over `bg` at `alpha` (0–1) and return the opaque hex result. */
function blendHex(fg: string, bg: string, alpha: number): string {
  const fr = parseInt(fg.slice(1, 3), 16);
  const fg_ = parseInt(fg.slice(3, 5), 16);
  const fb = parseInt(fg.slice(5, 7), 16);
  const br = parseInt(bg.slice(1, 3), 16);
  const bg_ = parseInt(bg.slice(3, 5), 16);
  const bb = parseInt(bg.slice(5, 7), 16);
  const r = Math.round(fr * alpha + br * (1 - alpha));
  const g = Math.round(fg_ * alpha + bg_ * (1 - alpha));
  const b = Math.round(fb * alpha + bb * (1 - alpha));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Returns `accentHex` when it meets `threshold` contrast against `bgHex`,
 * otherwise falls back to `fallback` (typically `colors.foreground`).
 */
function safeTextColor(accentHex: string, bgHex: string, fallback: string, threshold = 4.5): string {
  return contrastRatio(accentHex, bgHex) >= threshold ? accentHex : fallback;
}

/** The hex alpha used for the phone-number pill tint (`${accent}22`). */
const PILL_ALPHA = 0x22 / 255; // ≈ 0.133

type TriageStep = 'idle' | 'urgency' | 'area' | 'type' | 'routed';

async function callNumber(num: string, name: string) {
  const url = `tel:${num}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(`Call ${name}`, `Phone: ${num}`);
  }
}

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [triageStep, setTriageStep] = useState<TriageStep>('idle');
  const [urgency, setUrgency] = useState('');
  const [area, setArea] = useState('');
  const [supportType, setSupportType] = useState('');

  function startTriage() {
    Haptics.selectionAsync();
    setTriageStep('urgency');
  }

  function resetTriage() {
    setTriageStep('idle');
    setUrgency('');
    setArea('');
    setSupportType('');
  }

  function handleUrgency(val: string) {
    Haptics.selectionAsync();
    setUrgency(val);
    if (val === 'right now') {
      setTriageStep('routed');
    } else {
      setTriageStep('area');
    }
  }

  function handleArea(val: string) {
    Haptics.selectionAsync();
    setArea(val);
    setTriageStep('type');
  }

  function handleType(val: string) {
    Haptics.selectionAsync();
    setSupportType(val);
    setTriageStep('routed');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Support</Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
          You do not have to figure this out alone.
        </Text>

        <VideoPlaceholder
          label="A message for you"
          sublabel="A personal message from the Authentic STEPS team"
        />

        {triageStep === 'idle' && (
          <Pressable
            onPress={startTriage}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[colors.gradientStart, '#1a5c3a']}
              style={styles.supportBtn}
            >
              <Ionicons name="hand-left" size={28} color="#fff" />
              <Text style={styles.supportBtnText}>I need some support</Text>
              <Text style={styles.supportBtnSub}>Three quick questions to find the right help</Text>
            </LinearGradient>
          </Pressable>
        )}

        {triageStep === 'urgency' && (
          <View style={[styles.triageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.triageQ, { color: colors.foreground }]}>How urgent is this?</Text>
            {['right now', 'today', 'this week'].map(opt => (
              <Pressable
                key={opt}
                onPress={() => handleUrgency(opt)}
                style={({ pressed }) => [
                  styles.triageOpt,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="radio-button-off" size={18} color={colors.primary} />
                <Text style={[styles.triageOptText, { color: colors.foreground }]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {triageStep === 'area' && (
          <View style={[styles.triageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.triageQ, { color: colors.foreground }]}>What area?</Text>
            {['emotions', 'relationships', 'school or home', 'habits', 'something else'].map(opt => (
              <Pressable
                key={opt}
                onPress={() => handleArea(opt)}
                style={({ pressed }) => [
                  styles.triageOpt,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="radio-button-off" size={18} color={colors.primary} />
                <Text style={[styles.triageOptText, { color: colors.foreground }]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {triageStep === 'type' && (
          <View style={[styles.triageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.triageQ, { color: colors.foreground }]}>What kind of support?</Text>
            {['someone to listen', 'practical ideas', 'professional help'].map(opt => (
              <Pressable
                key={opt}
                onPress={() => handleType(opt)}
                style={({ pressed }) => [
                  styles.triageOpt,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="radio-button-off" size={18} color={colors.primary} />
                <Text style={[styles.triageOptText, { color: colors.foreground }]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {triageStep === 'routed' && (
          <View style={[styles.triageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.routedHeader, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="heart" size={22} color={colors.primary} />
              <Text style={[styles.routedTitle, { color: colors.foreground }]}>
                {urgency === 'right now' ? 'Connecting you to immediate support' : 'Here for you'}
              </Text>
            </View>
            {urgency === 'right now' ? (
              <>
                <Text style={[styles.routedMsg, { color: colors.mutedForeground }]}>
                  Right now, the most important thing is connecting with someone who can help. Kids Helpline is free, private, and available 24/7.
                </Text>
                <Pressable
                  onPress={() => callNumber('1800551800', 'Kids Helpline')}
                  style={[styles.bigCallBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="call" size={22} color="#fff" />
                  <Text style={styles.bigCallBtnText}>Call Kids Helpline — 1800 55 1800</Text>
                </Pressable>
                <Pressable
                  onPress={() => WebBrowser.openBrowserAsync('https://kidshelpline.com.au/get-help/webchat')}
                  style={[styles.chatBtn, { borderColor: colors.primary }]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                  <Text style={[styles.chatBtnText, { color: colors.primary }]}>Chat online with Kids Helpline</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.routedMsg, { color: colors.mutedForeground }]}>
                  You are looking for {supportType} with {area}. That takes self-awareness and courage to name.
                </Text>
                {supportType === 'professional help' ? (
                  <Pressable
                    onPress={() => callNumber('1800551800', 'Kids Helpline')}
                    style={[styles.bigCallBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="call" size={22} color="#fff" />
                    <Text style={styles.bigCallBtnText}>Call Kids Helpline — Free, 24/7</Text>
                  </Pressable>
                ) : (
                  <View style={[styles.tipBox, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.tipBoxTitle, { color: colors.foreground }]}>A small step that might help</Text>
                    <Text style={[styles.tipBoxText, { color: colors.mutedForeground }]}>
                      When you are ready, try sharing in the Community tab — others here understand. Or reach out to one person you trust.
                    </Text>
                  </View>
                )}
              </>
            )}
            <Pressable onPress={resetTriage} style={styles.resetBtn}>
              <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Start over</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.servicesSection]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Immediate Support Services</Text>
          {HELPLINES.map(svc => {
            const cardIsDark = relativeLuminance(colors.card) < 0.18;
            const accent = cardIsDark ? svc.darkAccent : svc.lightAccent;
            // Compute the actual opaque colour the phone-number text sits on
            // (accent tinted at PILL_ALPHA over the card) so contrast is checked
            // against the real composited surface, not raw colors.card.
            const pillBg = blendHex(accent, colors.card, PILL_ALPHA);
            const phoneTextColor = safeTextColor(accent, pillBg, colors.foreground);
            return (
              <Pressable
                key={svc.num}
                testID={`helpline-card-${svc.num}`}
                onPress={() => callNumber(svc.num, svc.name)}
                style={({ pressed }) => [
                  styles.svcRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderLeftColor: accent,
                    borderLeftWidth: 4,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.svcInitialsBadge, { backgroundColor: accent }]}>
                  <Text style={[styles.svcInitialsText, { color: badgeTextColor(accent) }]}>
                    {svc.initials}
                  </Text>
                </View>
                <View style={styles.svcText}>
                  <Text style={[styles.svcName, { color: colors.foreground }]}>{svc.name}</Text>
                  <Text style={[styles.svcDesc, { color: colors.mutedForeground }]}>{svc.desc}</Text>
                </View>
                <View style={[styles.svcBadge, { backgroundColor: `${accent}22` }]}>
                  <Text style={[styles.svcNum, { color: phoneTextColor }]}>{svc.display}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  screenTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  screenSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  supportBtn: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  supportBtnText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  supportBtnSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#fff' },
  pressed: { opacity: 0.85 },
  triageCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  triageQ: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  triageOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  triageOptText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  routedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12 },
  routedTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1 },
  routedMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  bigCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  bigCallBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
  },
  chatBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  tipBox: { borderRadius: 12, padding: 14, gap: 6 },
  tipBoxTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tipBoxText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  resetBtn: { alignItems: 'center', paddingVertical: 4 },
  resetBtnText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  servicesSection: { gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  svcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
  },
  svcInitialsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  svcInitialsText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  svcText: { flex: 1, gap: 2 },
  svcName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  svcDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  svcBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  svcNum: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

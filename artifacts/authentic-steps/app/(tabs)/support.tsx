import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOSButton } from '@/components/SOSButton';
import { useColors } from '@/hooks/useColors';

type TriageStep = 'idle' | 'urgency' | 'area' | 'type' | 'routed';

const TIPS = [
  { icon: 'walk', title: 'Move your body', desc: 'Even 10 minutes outside can shift how you feel.' },
  { icon: 'call', title: 'Reach out', desc: 'Text one person you trust — not asking for help, just connecting.' },
  { icon: 'water', title: 'Ground yourself', desc: 'Name 5 things you can see. Slow your breathing.' },
  { icon: 'moon', title: 'Rest without guilt', desc: 'Rest is productive. Your body is working when you sleep.' },
];

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

        {triageStep === 'idle' && (
          <Pressable
            onPress={startTriage}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[colors.primary, '#3A7D5C']}
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
          {[
            { name: 'Kids Helpline', num: '1800551800', display: '1800 55 1800', color: '#2D6A4F', desc: 'Free, private, 24/7 for ages 5–25' },
            { name: 'Lifeline', num: '131114', display: '13 11 14', color: '#3B82F6', desc: 'Crisis support, 24/7' },
            { name: 'Beyond Blue', num: '1300224636', display: '1300 22 4636', color: '#1D4ED8', desc: 'Anxiety & depression support' },
            { name: '13YARN', num: '139276', display: '13 92 76', color: '#B45309', desc: 'First Nations, culturally safe, 24/7' },
            { name: 'Emergency', num: '000', display: '000', color: '#EF4444', desc: 'Immediate danger — call now' },
          ].map(svc => (
            <Pressable
              key={svc.num}
              onPress={() => callNumber(svc.num, svc.name)}
              style={({ pressed }) => [
                styles.svcRow,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.svcDot, { backgroundColor: svc.color }]} />
              <View style={styles.svcText}>
                <Text style={[styles.svcName, { color: colors.foreground }]}>{svc.name}</Text>
                <Text style={[styles.svcDesc, { color: colors.mutedForeground }]}>{svc.desc}</Text>
              </View>
              <View style={[styles.svcBadge, { backgroundColor: `${svc.color}15` }]}>
                <Text style={[styles.svcNum, { color: svc.color }]}>{svc.display}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.tipsSection]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resilience Toolkit</Text>
          <View style={styles.tipsGrid}>
            {TIPS.map(tip => (
              <View
                key={tip.title}
                style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.tipIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name={tip.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
                <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>{tip.desc}</Text>
              </View>
            ))}
          </View>
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
  screenTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  screenSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  supportBtn: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  supportBtnText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  supportBtnSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)' },
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
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  svcDot: { width: 10, height: 10, borderRadius: 5 },
  svcText: { flex: 1, gap: 2 },
  svcName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  svcDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  svcBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  svcNum: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  tipsSection: { gap: 8 },
  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    width: '47%',
  },
  tipIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tipDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
});

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { PRIVACY, TERMS, SAFE_MESSAGING, type DocContent } from '@workspace/legal-content';

type DocType = 'privacy' | 'terms' | 'safe-messaging';

/** Mirrors the apiDomain() helper in lib/videoSource.ts — same source of truth. */
function legalBaseUrl(): string | null {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return null;
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `https://${clean}`;
}

const LEGAL_URL_PATHS: Partial<Record<DocType, string>> = {
  privacy: '/privacy',
  terms: '/terms',
};

const DOCS: Record<DocType, DocContent> = {
  privacy: PRIVACY,
  terms: TERMS,
  'safe-messaging': SAFE_MESSAGING,
};

export default function LegalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();

  const docType = (type as DocType);
  const doc = DOCS[docType] ?? PRIVACY;
  const urlPath = LEGAL_URL_PATHS[docType];
  const base = legalBaseUrl();
  const onlineUrl = base && urlPath ? `${base}${urlPath}` : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{doc.title}</Text>
        {doc.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{doc.subtitle}</Text>
        ) : null}
        {onlineUrl ? (
          <Pressable
            onPress={() => Linking.openURL(onlineUrl)}
            style={({ pressed }) => [styles.viewOnlineBtn, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="link"
            accessibilityLabel={`View ${doc.title} online`}
          >
            <Ionicons name="open-outline" size={14} color={colors.primary} />
            <Text style={[styles.viewOnlineText, { color: colors.primary }]}>View online</Text>
          </Pressable>
        ) : null}

        {doc.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            {section.heading ? (
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{section.heading}</Text>
            ) : null}
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  scroll: { flex: 1 },
  content: {
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginTop: -12,
  },
  viewOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -8,
  },
  viewOnlineText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
});

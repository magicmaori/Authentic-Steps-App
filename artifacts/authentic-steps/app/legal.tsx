import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

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

interface Section {
  heading?: string;
  body: string;
}

interface DocContent {
  title: string;
  subtitle?: string;
  sections: Section[];
}

const PRIVACY: DocContent = {
  title: 'Privacy Policy',
  subtitle: 'Effective 27 June 2026 · Authentic Steps For Youth',
  sections: [
    {
      heading: 'The short version',
      body: 'We do not collect any personal information about you. Everything you write in this app stays on your device. We have no servers holding your data.',
    },
    {
      heading: 'What information we collect',
      body: 'Authentic Steps For Youth does not collect, store, or transmit any personal information. The app:\n\n· Does not require an account, name, email address, or phone number\n· Automatically assigns you a randomly generated anonymous username (e.g. "CopperFox") — stored only on your device, never sent to us\n· Does not track your location\n· Does not use advertising networks or analytics services that identify you\n· Does not share any data with third parties',
    },
    {
      heading: 'What is stored on your device',
      body: 'All data you create — daily ritual entries, gratitude notes, intentions, I Am statements, journal entries, streak counts, and grounding sessions — is stored locally on your device only using your phone\'s private storage. It never leaves your device unless you choose to export or share it yourself.\n\nYour Recovery Code contains only your own journal and streak data in an encoded format. This code is never sent to our servers. Only you hold it.',
    },
    {
      heading: 'Young people and children',
      body: 'This app is designed for young people. We have deliberately built it to collect no personal information so that young users can engage safely without privacy risk. We encourage parents and carers to be aware of the app\'s content and to support young people in using it.',
    },
    {
      heading: 'Australian Privacy Act',
      body: 'Under the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs), "personal information" means information that identifies, or could reasonably identify, an individual. Because we do not collect such information, the APPs do not apply to our operations in relation to this app. We are nonetheless committed to privacy-by-design and keeping your experience safe and anonymous.',
    },
    {
      heading: 'Data security',
      body: 'Because all your data is stored locally on your device, its security depends on your device\'s own security settings (e.g. screen lock, biometrics). We recommend keeping your device locked and your Recovery Code stored somewhere safe — such as a password manager or secure notes app.',
    },
    {
      heading: 'Changes to this policy',
      body: 'If we update this policy, the new version will appear in the app. Continued use of the app after an update means you accept the revised policy.',
    },
    {
      heading: 'Contact us',
      body: 'Questions about this privacy policy?\nhello@authenticsteps.com.au\nauthenticsteps.com.au',
    },
  ],
};

const TERMS: DocContent = {
  title: 'Terms of Service',
  subtitle: 'Effective 27 June 2026',
  sections: [
    {
      heading: 'About this app',
      body: 'Authentic Steps For Youth is a free wellbeing app designed for young people. It provides tools for daily rituals, journaling, breathing exercises, grounding techniques, and community encouragement.',
    },
    {
      heading: 'Not a substitute for professional support',
      body: 'This app is a general wellbeing tool only. It is not a medical device, a mental health treatment, or a crisis service. It does not provide clinical advice, diagnosis, or therapy.\n\nIf you are experiencing a mental health crisis, please contact a crisis support service (see the Support tab) or speak with a trusted adult, doctor, or mental health professional.',
    },
    {
      heading: 'Who can use this app',
      body: 'This app is intended for young people and their supporters. There is no minimum age requirement, but users under 13 are encouraged to use the app with parental guidance.',
    },
    {
      heading: 'Your data and your device',
      body: 'All content you enter — including journal entries, gratitude notes, and intentions — is stored privately on your device. You are responsible for keeping your device secure and for saving your Recovery Code if you wish to retain your data across devices or reinstalls.',
    },
    {
      heading: 'Acceptable use',
      body: 'You agree to use the app for your personal wellbeing only. You must not attempt to reverse-engineer, copy, distribute, or misuse the app or its content.',
    },
    {
      heading: 'Community features',
      body: 'Community encouragement features are anonymous. You agree to send only positive, supportive messages. Content that is harmful, harassing, or inappropriate is not permitted.',
    },
    {
      heading: 'Intellectual property',
      body: 'All original content in this app — including written exercises, affirmations, and design — is owned by Authentic Steps For Youth and is protected by Australian copyright law. You may not reproduce or distribute app content without written permission.',
    },
    {
      heading: 'Disclaimer',
      body: 'The app is provided "as is" without warranties of any kind. To the extent permitted by Australian Consumer Law, Authentic Steps For Youth is not liable for any loss or damage arising from your use of the app.',
    },
    {
      heading: 'Governing law',
      body: 'These terms are governed by the laws of the State of Queensland, Australia.',
    },
    {
      heading: 'Contact',
      body: 'Questions about these terms?\nhello@authenticsteps.com.au\nauthenticsteps.com.au',
    },
  ],
};

const SAFE_MESSAGING: DocContent = {
  title: 'Safe Messaging Guidelines',
  subtitle: 'Based on Mindframe\'s evidence-based guidelines for Australia',
  sections: [
    {
      heading: 'Why safe messaging matters',
      body: 'Research shows that the way we talk about mental health and suicide can make a real difference. Words that are thoughtful and hopeful can support recovery. Words that are careless can cause harm. This app is designed with that in mind.',
    },
    {
      heading: 'What this app does',
      body: '· Uses hope-focused, strengths-based language throughout — framing mental health as something that can improve with the right support and habits\n· Avoids describing or glamorising self-harm or suicide methods\n· Does not use the word "commit" in relation to suicide (outdated and stigmatising language)\n· Highlights help-seeking as a sign of strength, not weakness\n· Includes crisis support resources in the Support tab for when someone needs more than a wellbeing app can offer',
    },
    {
      heading: 'If you are struggling right now',
      body: 'This app is not a crisis service. If you are having thoughts of suicide or self-harm, please reach out:\n\n· Lifeline: 13 11 14 (24/7)\n· Kids Helpline: 1800 55 1800 (24/7, up to age 25)\n· Beyond Blue: 1300 22 4636\n· Emergency: 000',
    },
    {
      heading: 'For parents, carers, and educators',
      body: 'If you are concerned about a young person, trust your instincts. Ask them directly how they are feeling — asking about suicide does not plant the idea. It shows you care. Support them in connecting with a professional if needed.',
    },
    {
      heading: 'Further reading',
      body: '· Mindframe guidelines: mindframe.org.au\n· headspace: headspace.org.au\n· ReachOut: au.reachout.com',
    },
  ],
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
  viewOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: -8,
  },
  viewOnlineText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});

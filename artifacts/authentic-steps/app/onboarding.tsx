import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const { completeOnboarding, restoreFromCode, userData, buildRecoveryPayload } = useApp();

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  async function handleGetStarted() {
    await completeOnboarding();
    setShowCodeModal(true);
  }

  async function handleContinueAfterCode() {
    setShowCodeModal(false);
    router.replace('/(tabs)');
  }

  async function handleCopyCode() {
    const payload = buildRecoveryPayload();
    await Clipboard.setStringAsync(payload);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  }

  async function handleRestore() {
    setRestoreError('');
    setRestoring(true);
    const ok = await restoreFromCode(codeInput);
    setRestoring(false);
    if (ok) {
      setShowRestoreModal(false);
      router.replace('/(tabs)');
    } else {
      setRestoreError('That code doesn\'t look right. Make sure you copied the full code and try again.');
    }
  }

  return (
    <>
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
            <Pressable
              onPress={() => { setCodeInput(''); setRestoreError(''); setShowRestoreModal(true); }}
              style={({ pressed }) => [styles.restoreLink, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.restoreLinkText}>I have a recovery code</Text>
            </Pressable>
            <Text style={styles.footerNote}>
              Anonymous · No account required · Free
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Modal
        visible={showCodeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleContinueAfterCode}
      >
        <LinearGradient
          colors={['#193b83', '#03989e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={styles.gradient}
        >
          <View style={[styles.modalContent, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Save your Recovery Code</Text>
            <Text style={styles.modalSubtitle}>
              If you reinstall or get a new phone, you can use this code to restore your username and all your data.
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeDisplayShort}>{userData.recoveryCode}</Text>
              <Text style={styles.codeHint}>
                Your recovery code includes an encoded backup of your data. Tap the button below to copy the full code — then paste it into Notes, Messages, or a password manager.
              </Text>
            </View>

            <Pressable
              onPress={handleCopyCode}
              style={({ pressed }) => [styles.copyButton, pressed && styles.ctaPressed]}
            >
              <Text style={styles.copyButtonText}>{codeCopied ? '✓ Copied to clipboard!' : 'Copy recovery code'}</Text>
            </Pressable>

            <Text style={styles.saveWarning}>
              ⚠️ You must copy the code to restore your data — a screenshot of this screen alone is not enough.
            </Text>

            <Pressable
              onPress={handleContinueAfterCode}
              style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.skipText}>I've saved it — continue</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Modal>

      <Modal
        visible={showRestoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRestoreModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.restoreModal}
        >
          <View style={[styles.restoreContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.restoreTitle}>Restore your account</Text>
            <Text style={styles.restoreSubtitle}>
              Paste the full recovery code you saved. Your username, streaks, and journal entries will be restored.
            </Text>

            <TextInput
              style={styles.codeInput}
              value={codeInput}
              onChangeText={t => { setCodeInput(t); setRestoreError(''); }}
              placeholder="Paste your recovery code here"
              placeholderTextColor="#999"
              multiline
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {restoreError ? (
              <Text style={styles.errorText}>{restoreError}</Text>
            ) : null}

            <Pressable
              onPress={handleRestore}
              disabled={restoring || codeInput.trim().length === 0}
              style={({ pressed }) => [
                styles.restoreButton,
                (restoring || codeInput.trim().length === 0) && styles.restoreButtonDisabled,
                pressed && styles.ctaPressed,
              ]}
            >
              {restoring ? (
                <ActivityIndicator color="#193b83" />
              ) : (
                <Text style={styles.restoreButtonText}>Restore</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => setShowRestoreModal(false)}
              style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  restoreLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  restoreLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textDecorationLine: 'underline',
  },
  footerNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  codeDisplayShort: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 2,
    fontWeight: '700',
  },
  codeHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  copyButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#193b83',
  },
  saveWarning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textDecorationLine: 'underline',
  },
  restoreModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  restoreContent: {
    flex: 1,
    paddingHorizontal: 28,
    gap: 16,
  },
  restoreTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: '#193b83',
  },
  restoreSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  codeInput: {
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    padding: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    color: '#1A1A2E',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#D32F2F',
    lineHeight: 18,
  },
  restoreButton: {
    backgroundColor: '#193b83',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  restoreButtonDisabled: {
    opacity: 0.45,
  },
  restoreButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#888',
  },
});

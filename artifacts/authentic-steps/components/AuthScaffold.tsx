import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AuthScaffold({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#193b83', '#03989e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.fill}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center' },
});

export const authStyles = StyleSheet.create({
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 22,
    gap: 14,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#FFFFFF', textAlign: 'center' },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldGroup: { gap: 6 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#193b83' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  googleButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#FFD7D7' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  dividerText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  linkText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  linkAction: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' },
  secondaryButton: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textDecorationLine: 'underline',
  },
  helperNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

import { useSignIn, useSSO } from '@clerk/expo';
import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
}

export default function SignInScreen() {
  useWarmUpBrowser();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const navigateAfterAuth = useCallback((decorateUrl: (url: string) => string) => {
    const url = decorateUrl('/');
    if (url.startsWith('http')) {
      // Web: Clerk returns a full URL with session token; hard-navigate to activate it
      if (typeof window !== 'undefined') window.location.href = url;
    } else {
      router.replace(url as any);
    }
  }, [router]);

  const handleEmailSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: ({ decorateUrl }) => navigateAfterAuth(decorateUrl) });
    } else if (signIn.status === 'needs_client_trust') {
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f: any) => f.strategy === 'email_code',
      );
      if (emailFactor) await signIn.mfa.sendEmailCode();
    } else {
      if (__DEV__) console.error('Sign-in not complete:', signIn.status);
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: ({ decorateUrl }) => navigateAfterAuth(decorateUrl) });
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: ({ decorateUrl }) => navigateAfterAuth(decorateUrl),
        });
      }
    } catch (err) {
      if (__DEV__) console.error('Google sign-in error', err);
    }
  }, [startSSOFlow, navigateAfterAuth]);

  if (signIn.status === 'needs_client_trust') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
        <View style={styles.inner}>
          <Text style={[styles.title, { color: colors.foreground }]}>Verify your identity</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            We've sent a code to your email address.
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            value={code}
            placeholder="6-digit code"
            placeholderTextColor={colors.mutedForeground}
            onChangeText={setCode}
            keyboardType="numeric"
            autoFocus
          />
          {errors.fields.code && (
            <Text style={styles.error}>{errors.fields.code.message}</Text>
          )}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed || fetchStatus === 'fetching' ? 0.8 : 1 }]}
            onPress={handleVerify}
            disabled={fetchStatus === 'fetching'}
          >
            {fetchStatus === 'fetching'
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Verify</Text>}
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => signIn.mfa.sendEmailCode()}>
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Resend code</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => signIn.reset()}>
            <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Start over</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#03989e22', '#193b8300']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.logoRow}>
          <AppLogo size="lg" />
          <Text style={[styles.appName, { color: colors.foreground }]}>Authentic Steps</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to access your journal and streaks
        </Text>

        <Pressable
          style={({ pressed }) => [styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={[styles.googleBtnText, { color: colors.foreground }]}>Continue with Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          value={email}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        {errors.fields.identifier && (
          <Text style={styles.error}>{errors.fields.identifier.message}</Text>
        )}

        <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          value={password}
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        {errors.fields.password && (
          <Text style={styles.error}>{errors.fields.password.message}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: pressed || !email || !password || fetchStatus === 'fetching' ? 0.7 : 1 },
          ]}
          onPress={handleEmailSignIn}
          disabled={!email || !password || fetchStatus === 'fetching'}
        >
          {fetchStatus === 'fetching'
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Sign in</Text>}
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>New here? </Text>
          <Link href={"/(auth)/sign-up" as any}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Create an account</Text>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Continue without an account? </Text>
          <Link href={"/(auth)/guest" as any}>
            <Text style={[styles.footerLink, { color: colors.mutedForeground }]}>Use as guest</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  inner: { flex: 1, gap: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  appName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 24 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 14,
  },
  googleIcon: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 6, marginTop: 8 },
  input: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'Inter_400Regular',
  },
  error: { color: '#ef4444', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  primaryBtn: {
    borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  footerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});

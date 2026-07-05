import { useSSO, useSignIn } from '@clerk/expo';
import * as AuthSession from 'expo-auth-session';
import { type Href, Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AuthScaffold, authStyles as s } from '@/components/AuthScaffold';

WebBrowser.maybeCompleteAuthSession();

function clerkErrMsg(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  const e = error as { errors?: { message?: string }[]; message?: string };
  if (Array.isArray(e.errors) && e.errors[0]?.message) return e.errors[0].message as string;
  if (e.message) return e.message;
  return 'Something went wrong. Please try again.';
}

interface FinalizeArgs {
  session?: { currentTask?: unknown } | null;
  decorateUrl: (url: string) => string;
}

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const goHome = useCallback(
    ({ session, decorateUrl }: FinalizeArgs) => {
      if (session?.currentTask) return;
      router.replace(decorateUrl('/') as Href);
    },
    [router],
  );

  const handleSubmit = async () => {
    setFormError('');
    const { error } = await signIn.password({ emailAddress: emailAddress.trim(), password });
    if (error) {
      setFormError(clerkErrMsg(error));
      return;
    }
    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: goHome });
    } else {
      setFormError(
        'Additional verification is required. Please contact your program coordinator for help.',
      );
    }
  };

  const handleGoogle = useCallback(async () => {
    setFormError('');
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId, navigate: goHome });
      } else {
        setFormError('Google sign-in could not be completed. Please try again.');
      }
    } catch (err) {
      setFormError(clerkErrMsg(err));
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, goHome]);

  const submitting = fetchStatus === 'fetching';
  const canSubmit = !!emailAddress && !!password && !submitting;

  return (
    <AuthScaffold>
      <View style={s.logoWrap}>
        <AppLogo size="lg" tint="light" />
      </View>
      <View style={s.card}>
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>
          Sign in to continue. Authentic Steps is available to invited members only.
        </Text>

        <View style={s.fieldGroup}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={emailAddress}
            onChangeText={(t) => {
              setEmailAddress(t);
              setFormError('');
            }}
          />
        </View>
        <View style={s.fieldGroup}>
          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            autoComplete="password"
            placeholder="Your password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setFormError('');
            }}
          />
        </View>

        {formError ? <Text style={s.error}>{formError}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            s.primaryButton,
            !canSubmit && s.buttonDisabled,
            pressed && s.buttonPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#193b83" />
          ) : (
            <Text style={s.primaryButtonText}>Sign in</Text>
          )}
        </Pressable>

        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <Pressable
          onPress={handleGoogle}
          disabled={googleLoading}
          style={({ pressed }) => [
            s.googleButton,
            googleLoading && s.buttonDisabled,
            pressed && s.buttonPressed,
          ]}
        >
          {googleLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.googleButtonText}>Continue with Google</Text>
          )}
        </Pressable>
      </View>

      <View style={s.linkRow}>
        <Text style={s.linkText}>New here? </Text>
        <Link href={'/sign-up' as Href} replace>
          <Text style={s.linkAction}>Create your account</Text>
        </Link>
      </View>
      <Text style={s.helperNote}>Access requires an invite from your agency or coordinator.</Text>
    </AuthScaffold>
  );
}

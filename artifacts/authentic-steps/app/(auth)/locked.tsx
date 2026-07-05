import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AuthScaffold, authStyles as s } from '@/components/AuthScaffold';
import { useEntitlement } from '@/context/EntitlementContext';

type LockReason = 'expired' | 'revoked' | 'offlineExpired' | 'error';

const COPY: Record<LockReason, { title: string; body: string; retry: string }> = {
  expired: {
    title: 'Your access has expired',
    body: 'Your invite is no longer active. Contact your agency or coordinator to renew your access, then try again.',
    retry: 'Check again',
  },
  revoked: {
    title: 'Access removed',
    body: 'Your access to Authentic Steps has been turned off. Please reach out to your program coordinator if you think this is a mistake.',
    retry: 'Check again',
  },
  offlineExpired: {
    title: "You're offline",
    body: 'We need to reconnect to confirm your access. Please check your internet connection and try again.',
    retry: 'Retry',
  },
  error: {
    title: "We couldn't verify your access",
    body: 'Something went wrong while confirming your membership. Please try again, or sign out and sign back in.',
    retry: 'Try again',
  },
};

export default function LockedScreen() {
  const params = useLocalSearchParams<{ reason?: string }>();
  const { refresh } = useEntitlement();
  const { signOut } = useAuth();

  const reason: LockReason =
    params.reason === 'expired' ||
    params.reason === 'revoked' ||
    params.reason === 'offlineExpired'
      ? params.reason
      : 'error';
  const copy = COPY[reason];

  return (
    <AuthScaffold>
      <View style={s.logoWrap}>
        <AppLogo size="lg" tint="light" />
      </View>
      <View style={s.card}>
        <Text style={s.title}>{copy.title}</Text>
        <Text style={s.subtitle}>{copy.body}</Text>

        <Pressable
          onPress={refresh}
          style={({ pressed }) => [s.primaryButton, pressed && s.buttonPressed]}
        >
          <Text style={s.primaryButtonText}>{copy.retry}</Text>
        </Pressable>

        <Pressable onPress={() => signOut()} style={s.secondaryButton}>
          <Text style={s.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}

import { useAuth } from '@clerk/expo';
import { useRedeemInvite } from '@workspace/api-client-react';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AuthScaffold, authStyles as s } from '@/components/AuthScaffold';
import { isApiError, useEntitlement } from '@/context/EntitlementContext';
import { clearPendingInviteCode, getPendingInviteCode } from '@/utils/pendingInvite';

export default function RedeemScreen() {
  const { mutateAsync, isPending } = useRedeemInvite();
  const { refresh } = useEntitlement();
  const { signOut } = useAuth();
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [prefilledFromLink, setPrefilledFromLink] = useState(false);

  // A route param (deep-linked straight here) wins; otherwise fall back to
  // whatever was captured at app launch, since AccessGate may have detoured
  // through sign-in first and dropped the original query param along the way.
  useEffect(() => {
    const fromRoute = Array.isArray(codeParam) ? codeParam[0] : codeParam;
    if (fromRoute) {
      setCode(fromRoute.toUpperCase());
      setPrefilledFromLink(true);
      clearPendingInviteCode();
      return;
    }
    getPendingInviteCode().then((pending) => {
      if (pending) {
        setCode(pending.toUpperCase());
        setPrefilledFromLink(true);
        clearPendingInviteCode();
      }
    });
  }, [codeParam]);

  const handleRedeem = async () => {
    setError('');
    try {
      await mutateAsync({ data: { code: code.trim() } });
      refresh();
    } catch (e) {
      const status = isApiError(e) ? e.status : 0;
      if (status === 409) {
        setError('This invite has already been used or is no longer active.');
      } else if (status === 400 || status === 404) {
        setError("That invite code isn't valid. Double-check it and try again.");
      } else if (status === 401) {
        setError('Your session expired. Please sign out and sign in again.');
      } else {
        setError("We couldn't redeem that code. Please check your connection and try again.");
      }
    }
  };

  const canSubmit = code.trim().length > 0 && !isPending;

  return (
    <AuthScaffold>
      <View style={s.logoWrap}>
        <AppLogo size="lg" tint="light" />
      </View>
      <View style={s.card}>
        <Text style={s.title}>Enter your invite</Text>
        <Text style={s.subtitle}>
          Authentic Steps is invite-only. Enter the code from your agency or coordinator to unlock
          the app.
        </Text>

        <View style={s.fieldGroup}>
          <Text style={s.label}>Invite code</Text>
          <TextInput
            style={s.input}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="e.g. STEPS-2026"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setPrefilledFromLink(false);
              setError('');
            }}
          />
          {prefilledFromLink && !error ? (
            <Text style={s.helperNote}>Code pre-filled from your invite link.</Text>
          ) : null}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Pressable
          onPress={handleRedeem}
          disabled={!canSubmit}
          style={({ pressed }) => [
            s.primaryButton,
            !canSubmit && s.buttonDisabled,
            pressed && s.buttonPressed,
          ]}
        >
          {isPending ? (
            <ActivityIndicator color="#193b83" />
          ) : (
            <Text style={s.primaryButtonText}>Unlock app</Text>
          )}
        </Pressable>

        <Pressable onPress={() => signOut()} style={s.secondaryButton}>
          <Text style={s.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>

      <Text style={s.helperNote}>
        Don&apos;t have a code? Reach out to your program coordinator to request access.
      </Text>
    </AuthScaffold>
  );
}

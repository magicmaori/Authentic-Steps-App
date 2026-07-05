import { useAuth } from '@clerk/expo';
import { useRedeemInvite } from '@workspace/api-client-react';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AuthScaffold, authStyles as s } from '@/components/AuthScaffold';
import { isApiError, useEntitlement } from '@/context/EntitlementContext';

export default function RedeemScreen() {
  const { mutateAsync, isPending } = useRedeemInvite();
  const { refresh } = useEntitlement();
  const { signOut } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

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
              setError('');
            }}
          />
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

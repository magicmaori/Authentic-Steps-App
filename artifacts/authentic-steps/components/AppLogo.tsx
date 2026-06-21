import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  tint?: 'auto' | 'light' | 'dark';
}

const LOGO_HEIGHTS = {
  sm: 30,
  md: 42,
  lg: 64,
  xl: 96,
};

const TAGLINE_SIZES = {
  sm: 9,
  md: 11,
  lg: 13,
  xl: 15,
};

export function AppLogo({ size = 'md', showTagline = false, tint = 'auto' }: AppLogoProps) {
  const colors = useColors();
  const logoHeight = LOGO_HEIGHTS[size];
  const taglineSize = TAGLINE_SIZES[size];

  const logoTintColor =
    tint === 'light'
      ? '#FFFFFF'
      : tint === 'dark'
        ? '#193b83'
        : undefined;

  const taglineColor =
    tint === 'light'
      ? 'rgba(255,255,255,0.75)'
      : tint === 'dark'
        ? '#5a7a8a'
        : colors.mutedForeground;

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={[styles.logo, { height: logoHeight }]}
        resizeMode="contain"
        tintColor={logoTintColor}
        accessibilityLabel="Authentic Steps logo"
      />
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: taglineSize, color: taglineColor }]}>
          For Youth
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 4,
  },
  logo: {
    width: undefined,
    aspectRatio: 2.4,
  },
  tagline: {
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

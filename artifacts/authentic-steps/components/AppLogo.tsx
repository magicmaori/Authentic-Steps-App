import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  tint?: 'auto' | 'light' | 'dark';
}

const ICON_SIZES = {
  sm: 28,
  md: 40,
  lg: 60,
  xl: 88,
};

const TITLE_SIZES = {
  sm: 15,
  md: 20,
  lg: 28,
  xl: 36,
};

const TAGLINE_SIZES = {
  sm: 9,
  md: 11,
  lg: 13,
  xl: 15,
};

export function AppLogo({ size = 'md', showTagline = false, tint = 'auto' }: AppLogoProps) {
  const colors = useColors();
  const iconSize = ICON_SIZES[size];
  const titleSize = TITLE_SIZES[size];
  const taglineSize = TAGLINE_SIZES[size];

  const titleColor =
    tint === 'light'
      ? '#FFFFFF'
      : tint === 'dark'
        ? '#193b83'
        : colors.foreground;

  const taglineColor =
    tint === 'light'
      ? 'rgba(255,255,255,0.75)'
      : tint === 'dark'
        ? '#5a7a8a'
        : colors.mutedForeground;

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={[styles.icon, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.22 }]}
        resizeMode="cover"
        accessibilityLabel="Authentic Steps logo"
      />
      <View style={styles.textGroup}>
        <Text
          style={[styles.title, { fontSize: titleSize, color: titleColor }]}
          numberOfLines={1}
        >
          Authentic Steps
        </Text>
        {showTagline && (
          <Text style={[styles.tagline, { fontSize: taglineSize, color: taglineColor }]}>
            For Youth
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    flexShrink: 0,
  },
  textGroup: {
    gap: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

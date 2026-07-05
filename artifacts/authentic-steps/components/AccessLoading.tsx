import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';

export function AccessLoading() {
  return (
    <LinearGradient
      colors={['#193b83', '#03989e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.fill}
    >
      <View style={styles.center}>
        <AppLogo size="lg" tint="light" />
        <ActivityIndicator color="#FFFFFF" style={styles.spinner} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spinner: { marginTop: 28 },
});

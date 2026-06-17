import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

interface SOSButtonProps {
  bottom?: number;
}

export function SOSButton({ bottom = 110 }: SOSButtonProps) {
  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/sos');
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { bottom: Platform.OS === 'web' ? bottom + 34 : bottom },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      accessibilityLabel="Emergency support — get help now"
      accessibilityRole="button"
    >
      <Ionicons name="heart" size={16} color="#fff" />
      <Text style={styles.label}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#EF4444',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});

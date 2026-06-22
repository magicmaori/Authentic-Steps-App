import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

interface SOSButtonProps {
  bottom?: number;
  inline?: boolean;
}

export function SOSButton({ bottom = 110, inline = false }: SOSButtonProps) {
  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/sos');
  }

  if (inline) {
    return (
      <Pressable
        style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}
        onPress={handlePress}
        accessibilityLabel="Emergency support — get help now"
        accessibilityRole="button"
      >
        <Ionicons name="heart" size={14} color="#fff" />
        <Text style={styles.label}>SOS</Text>
      </Pressable>
    );
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
  inlineButton: {
    backgroundColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    alignSelf: 'flex-end',
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

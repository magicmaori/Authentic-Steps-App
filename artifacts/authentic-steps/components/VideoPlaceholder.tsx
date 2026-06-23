import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface VideoPlaceholderProps {
  label: string;
  sublabel?: string;
  onPress?: () => void;
}

/**
 * Styled video placeholder card with a play button.
 * Swap the onPress handler (and optionally replace this component's body)
 * with a real YouTube/Vimeo embed (e.g. react-native-youtube-iframe) when ready.
 */
export function VideoPlaceholder({ label, sublabel, onPress }: VideoPlaceholderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityLabel={`Play video: ${label}`}
      accessibilityRole="button"
    >
      <View style={styles.thumbnail}>
        <View style={styles.playRing}>
          <Ionicons name="play" size={28} color="#fff" style={styles.playIcon} />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>▶ VIDEO</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
        {sublabel ? (
          <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1f3c',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  thumbnail: {
    height: 180,
    backgroundColor: '#152a50',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(3,152,158,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#03989e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 3,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  info: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    lineHeight: 22,
  },
  sublabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },
});

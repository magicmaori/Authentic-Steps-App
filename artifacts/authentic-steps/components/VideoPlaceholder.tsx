import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as Network from 'expo-network';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VideoPlaceholderProps {
  label: string;
  sublabel?: string;
  /**
   * Streaming URL for the video (served from the API's public object
   * storage endpoint), or null if no URL could be resolved. Videos are
   * streamed rather than bundled to keep the app's download size small.
   */
  source: string | null;
}

/**
 * Styled video card with a play button. Tapping it opens a full-screen
 * modal player (expo-av) that streams `source` over the network. Fails
 * gracefully (shows an inline message instead of crashing) if the device is
 * offline or playback otherwise fails.
 */
export function VideoPlaceholder({ label, sublabel, source }: VideoPlaceholderProps) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'offline'>('loading');
  const insets = useSafeAreaInsets();

  const openPlayer = async () => {
    if (!source) {
      setStatus('error');
      setVisible(true);
      return;
    }

    setStatus('loading');
    setVisible(true);

    try {
      const network = await Network.getNetworkStateAsync();
      if (!network.isConnected || network.isInternetReachable === false) {
        setStatus('offline');
        return;
      }
    } catch {
      // If the connectivity check itself fails, fall through and let the
      // player try — its own onError will surface a failure if needed.
    }
  };

  const closePlayer = () => {
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={openPlayer}
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

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={closePlayer}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.playerWrap}>
            {status === 'offline' ? (
              <View style={styles.errorWrap}>
                <Ionicons name="cloud-offline-outline" size={36} color="#fff" />
                <Text style={styles.errorText}>
                  No internet connection. Connect to Wi-Fi or mobile data to watch this video.
                </Text>
              </View>
            ) : status === 'error' || !source ? (
              <View style={styles.errorWrap}>
                <Ionicons name="alert-circle-outline" size={36} color="#fff" />
                <Text style={styles.errorText}>This video couldn't be played right now.</Text>
              </View>
            ) : (
              <>
                <Video
                  source={{ uri: source }}
                  style={styles.video}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  onReadyForDisplay={() => setStatus('ready')}
                  onError={() => setStatus('error')}
                />
                {status === 'loading' && (
                  <View style={styles.loadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
              </>
            )}
          </View>
          <Pressable
            onPress={closePlayer}
            style={[styles.closeButton, { top: insets.top + 12 }]}
            accessibilityLabel="Close video"
            accessibilityRole="button"
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#fff',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import * as Network from 'expo-network';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cacheVideoInBackground, getCachedVideoUri } from '../lib/videoCache';

/** How often to re-check connectivity while the offline message is showing,
 * so playback can resume automatically once the connection returns instead
 * of requiring the user to close and reopen the player. */
const RECONNECT_POLL_MS = 3000;

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

const STORAGE_KEY_ALLOW_CELLULAR = '@authentic_steps_allow_cellular_video';

/**
 * Styled video card with a play button. Tapping it opens a full-screen
 * modal player (expo-av) that streams `source` over the network. Fails
 * gracefully (shows an inline message instead of crashing) if the device is
 * offline or playback otherwise fails. If the device is on cellular data,
 * shows a heads-up before streaming so users don't unexpectedly burn mobile
 * data, unless they've previously chosen to always allow it.
 */
export function VideoPlaceholder({ label, sublabel, source }: VideoPlaceholderProps) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<
    'checking' | 'loading' | 'ready' | 'error' | 'offline' | 'cellular-warning'
  >('checking');
  const [playbackUri, setPlaybackUri] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const insets = useSafeAreaInsets();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const checkConnected = async () => {
    try {
      const network = await Network.getNetworkStateAsync();
      return Boolean(network.isConnected) && network.isInternetReachable !== false;
    } catch {
      // If the connectivity check itself fails, assume connected and let
      // the player try — its own onError will surface a failure if needed.
      return true;
    }
  };

  const startPlayback = () => {
    setStatus('loading');
    setPlayKey((key) => key + 1);
  };

  const openPlayer = async () => {
    if (!source) {
      setStatus('error');
      setVisible(true);
      return;
    }

    // Show the modal immediately with a neutral "checking" state so we never
    // mount (and auto-play) the <Video> element before we've confirmed the
    // connection is safe to stream on — the network/preference check below
    // is async and must fully resolve before any playback can start.
    setStatus('checking');
    setVisible(true);

    // Previously-watched videos play instantly from the on-device cache
    // instead of re-streaming over the network.
    const cachedUri = await getCachedVideoUri(source);
    setPlaybackUri(cachedUri ?? source);

    if (cachedUri) {
      // Already cached — no need to check connectivity, it'll play offline.
      setStatus('loading');
      return;
    }

    const connected = await checkConnected();
    if (!connected) {
      setStatus('offline');
      return;
    }

    try {
      const network = await Network.getNetworkStateAsync();
      if (network.type === Network.NetworkStateType.CELLULAR) {
        const alwaysAllow = await AsyncStorage.getItem(STORAGE_KEY_ALLOW_CELLULAR);
        if (alwaysAllow !== 'true') {
          setStatus('cellular-warning');
          return;
        }
      }
    } catch {
      // If the connectivity check itself fails, fall through and let the
      // player try — its own onError will surface a failure if needed.
    }

    setStatus('loading');

    // First-time playback streams normally; cache a copy in the background
    // (best-effort, never blocks or affects the current playback) so the
    // next open can skip the network entirely.
    void cacheVideoInBackground(source);
  };

  const playOnCellular = (alwaysAllow: boolean) => {
    if (alwaysAllow) {
      AsyncStorage.setItem(STORAGE_KEY_ALLOW_CELLULAR, 'true').catch(() => {
        // Non-fatal — worst case the user is asked again next time.
      });
    }
    setStatus('loading');

    // The cellular-warning path is only reached for uncached videos (cached
    // videos return earlier, above), so it's safe to kick off background
    // caching here too.
    if (source) {
      void cacheVideoInBackground(source);
    }
  };

  const closePlayer = () => {
    clearPoll();
    setVisible(false);
    setPlaybackUri(null);
  };

  // While the offline message is showing, poll connectivity in the
  // background so playback resumes automatically once the connection
  // returns, instead of forcing the user to close and reopen the player.
  useEffect(() => {
    if (!visible || status !== 'offline') {
      clearPoll();
      return;
    }

    pollRef.current = setInterval(async () => {
      const connected = await checkConnected();
      if (connected) {
        clearPoll();
        startPlayback();
      }
    }, RECONNECT_POLL_MS);

    return clearPoll;
  }, [visible, status]);

  // Clean up any pending poll on unmount.
  useEffect(() => clearPoll, []);

  // Proactively react to connectivity dropping while the player is open,
  // instead of relying solely on the <Video> element's onError callback.
  // The player's network error and the platform's connectivity-state
  // update can arrive in either order (or the error can be slow/absent —
  // e.g. mid-buffer with no active request in flight when the connection
  // drops), so without this a real disconnect could sit unnoticed as
  // "loading"/"ready" until the next playback error, rather than
  // immediately showing the actionable offline message.
  useEffect(() => {
    if (!visible || status === 'offline') return;

    const subscription = Network.addNetworkStateListener((state) => {
      const connected = Boolean(state.isConnected) && state.isInternetReachable !== false;
      if (!connected) setStatus('offline');
    });

    return () => subscription.remove();
  }, [visible, status]);

  const handlePlaybackError = async () => {
    // A mid-playback failure could be a real connection drop rather than a
    // genuine playback error — check so we can show the more actionable
    // "no internet" message (and auto-recover) instead of a dead end.
    //
    // A single connectivity check right when the error fires can race the
    // platform's own connectivity-state update (the player's network
    // request can abort and fire its error callback essentially
    // simultaneously with the OS/browser flipping its "offline" flag, so
    // the first check can still observe the stale "online" value). Retry
    // briefly before concluding it's a genuine playback error, so a real
    // disconnect reliably surfaces the offline message instead of the dead-
    // end "couldn't be played" error.
    for (let attempt = 0; attempt < 3; attempt++) {
      const connected = await checkConnected();
      if (!connected) {
        setStatus('offline');
        return;
      }
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    setStatus('error');
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
                <Text style={styles.errorHint}>We'll resume playback automatically once you're back online.</Text>
              </View>
            ) : status === 'error' || !playbackUri ? (
              <View style={styles.errorWrap}>
                <Ionicons name="alert-circle-outline" size={36} color="#fff" />
                <Text style={styles.errorText}>This video couldn't be played right now.</Text>
                {source ? (
                  <Pressable
                    onPress={startPlayback}
                    style={styles.retryButton}
                    accessibilityLabel="Retry video"
                    accessibilityRole="button"
                  >
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : status === 'cellular-warning' ? (
              <View style={styles.errorWrap}>
                <Ionicons name="cellular-outline" size={36} color="#fff" />
                <Text style={styles.errorText}>
                  You're on mobile data. This video may use several MB of data — continue?
                </Text>
                <View style={styles.cellularActions}>
                  <Pressable
                    onPress={() => playOnCellular(false)}
                    style={({ pressed }) => [styles.cellularButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Play video using mobile data"
                  >
                    <Text style={styles.cellularButtonText}>Play anyway</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => playOnCellular(true)}
                    style={({ pressed }) => [
                      styles.cellularButton,
                      styles.cellularButtonSecondary,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Always allow videos to play on mobile data"
                  >
                    <Text style={styles.cellularButtonText}>Always allow on mobile data</Text>
                  </Pressable>
                </View>
              </View>
            ) : status === 'checking' ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : (
              <>
                <Video
                  key={playKey}
                  source={{ uri: playbackUri }}
                  style={styles.video}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  onReadyForDisplay={() => setStatus('ready')}
                  onError={handlePlaybackError}
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
  cellularActions: {
    gap: 10,
    marginTop: 4,
    width: '100%',
  },
  cellularButton: {
    backgroundColor: 'rgba(3,152,158,0.85)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cellularButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cellularButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  errorHint: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  retryText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
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

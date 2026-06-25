import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type ChimeType = 'in' | 'out' | 'hold' | 'done';

const SOUND_SOURCES: Record<ChimeType, any> = {
  in: require('../assets/sounds/chime-in.wav'),
  out: require('../assets/sounds/chime-out.wav'),
  hold: require('../assets/sounds/chime-hold.wav'),
  done: require('../assets/sounds/chime-done.wav'),
};

export function useBreathingSound(enabled: boolean) {
  const soundsRef = useRef<Partial<Record<ChimeType, Audio.Sound>>>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!enabled || loadedRef.current) return;

    let cancelled = false;

    async function loadSounds() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const entries = Object.entries(SOUND_SOURCES) as [ChimeType, any][];
        const loaded: Partial<Record<ChimeType, Audio.Sound>> = {};

        for (const [key, source] of entries) {
          const { sound } = await Audio.Sound.createAsync(source, {
            shouldPlay: false,
            volume: 0.7,
          });
          loaded[key] = sound;
        }

        if (!cancelled) {
          soundsRef.current = loaded;
          loadedRef.current = true;
        } else {
          for (const sound of Object.values(loaded)) {
            await sound.unloadAsync().catch(() => {});
          }
        }
      } catch {
        // Audio load failed silently — haptics still work
      }
    }

    loadSounds();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    return () => {
      const sounds = soundsRef.current;
      soundsRef.current = {};
      loadedRef.current = false;
      for (const sound of Object.values(sounds)) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playChime = useCallback(
    async (type: ChimeType) => {
      if (!enabled) return;
      if (Platform.OS === 'web') {
        playWebTone(type);
        return;
      }
      const sound = soundsRef.current[type];
      if (!sound) return;
      try {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch {
        // ignore playback errors
      }
    },
    [enabled],
  );

  return { playChime };
}

// Web Audio API fallback for browser
function playWebTone(type: ChimeType) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const configs: Record<ChimeType, { freqs: number[]; duration: number; gain: number }> = {
      in:   { freqs: [523.25], duration: 0.45, gain: 0.18 },
      out:  { freqs: [392.00], duration: 0.45, gain: 0.15 },
      hold: { freqs: [329.63], duration: 0.35, gain: 0.13 },
      done: { freqs: [523.25, 659.25, 783.99], duration: 0.9, gain: 0.14 },
    };
    const { freqs, duration, gain } = configs[type];
    const now = ctx.currentTime;

    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain / freqs.length, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    }
  } catch {
    // Web Audio not available
  }
}

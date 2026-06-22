import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface SplashAnimationProps {
  onFinished: () => void;
}

interface StoneConfig {
  size: number;
  color: string;
  top: string;
  left: string;
  delay: number;
  translateY: number;
}

const STONES: StoneConfig[] = [
  { size: 52, color: "rgba(3,120,128,0.28)",  top: "14%", left: "8%",  delay: 0,   translateY: 18 },
  { size: 34, color: "rgba(99,195,200,0.22)", top: "28%", left: "74%", delay: 80,  translateY: 14 },
  { size: 44, color: "rgba(25,59,131,0.25)",  top: "62%", left: "82%", delay: 160, translateY: 20 },
  { size: 28, color: "rgba(99,195,200,0.30)", top: "70%", left: "12%", delay: 240, translateY: 12 },
  { size: 38, color: "rgba(3,120,128,0.20)",  top: "48%", left: "55%", delay: 120, translateY: 16 },
];

function SteppingStone({ config, screenFading }: { config: StoneConfig; screenFading: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(config.translateY);

  useEffect(() => {
    opacity.value = withDelay(
      config.delay,
      withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      config.delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.stone,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          top: config.top as any,
          left: config.left as any,
        },
        style,
      ]}
    />
  );
}

export function SplashAnimation({ onFinished }: SplashAnimationProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.82);
  const screenOpacity = useSharedValue(1);

  const finish = useCallback(() => {
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    logoOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    logoScale.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    screenOpacity.value = withSequence(
      withDelay(1050, withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) })),
    );

    const total = 1050 + 450;
    const timer = setTimeout(() => {
      runOnJS(finish)();
    }, total);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <LinearGradient
        colors={["#193b83", "#037880"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {STONES.map((stone, i) => (
        <SteppingStone key={i} config={stone} screenFading={false} />
      ))}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          tintColor="#FFFFFF"
          accessibilityLabel="Authentic Steps logo"
        />
        <View style={styles.taglineRow}>
          <Animated.Text style={styles.tagline}>FOR YOUTH</Animated.Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  stone: {
    position: "absolute",
  },
  logoWrap: {
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 220,
    height: undefined,
    aspectRatio: 2.4,
  },
  taglineRow: {
    alignItems: "center",
  },
  tagline: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
  },
});

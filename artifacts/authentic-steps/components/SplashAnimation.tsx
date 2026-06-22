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

export function SplashAnimation({ onFinished }: SplashAnimationProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.82);
  const screenOpacity = useSharedValue(1);

  const finish = useCallback(() => {
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    screenOpacity.value = withSequence(
      withDelay(900, withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) })),
    );

    const total = 900 + 450;
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

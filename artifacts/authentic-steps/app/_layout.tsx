import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SplashAnimation } from "@/components/SplashAnimation";
import { AppProvider, useApp } from "@/context/AppContext";

const INTRO_SEEN_KEY = "hasSeenIntro";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: appLoaded, userData } = useApp();

  useEffect(() => {
    if (!appLoaded) return;
    if (!userData.hasOnboarded) {
      router.replace("/onboarding" as any);
    }
  }, [appLoaded, userData.hasOnboarded]);

  if (!appLoaded) return null;
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <OnboardingGate>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ritual" options={{ headerShown: false }} />
        <Stack.Screen name="sos" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="journal" options={{ headerShown: false }} />
        <Stack.Screen name="grounding-history" options={{ headerShown: false }} />
        <Stack.Screen name="legal" options={{ headerShown: false }} />
      </Stack>
    </OnboardingGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Ionicons.font,
    ...Feather.font,
  });
  const [splashDone, setSplashDone] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(INTRO_SEEN_KEY).then((value) => {
      setShowIntro(value === null);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const handleSplashFinished = useCallback(() => {
    AsyncStorage.setItem(INTRO_SEEN_KEY, "1");
    setSplashDone(true);
  }, []);

  if (!fontsLoaded && !fontError) return null;
  if (showIntro === null) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
                {showIntro && !splashDone && (
                  <SplashAnimation onFinished={handleSplashFinished} />
                )}
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

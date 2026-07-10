import { useAuth, ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
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
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { router, Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AccessLoading } from "@/components/AccessLoading";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SplashAnimation } from "@/components/SplashAnimation";
import { AppProvider, useApp } from "@/context/AppContext";
import { precacheVideosOnWifi } from "@/lib/videoCache";
import { getAllVideoUrls } from "@/lib/videoSource";

const INTRO_SEEN_KEY = "hasSeenIntro";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function AuthTokenSync() {
  const { isSignedIn, getToken } = useAuth();
  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
    return () => setAuthTokenGetter(null);
  }, [isSignedIn, getToken]);
  return null;
}

function AccessGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const nav = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuth = segments[0] === "(auth)";
    const sub = segments[1];
    if (!isSignedIn) {
      if (!(inAuth && (sub === "sign-in" || sub === "sign-up"))) {
        nav.replace("/(auth)/sign-in" as any);
      }
    } else {
      if (inAuth) {
        nav.replace("/(tabs)" as any);
      }
    }
  }, [isLoaded, isSignedIn, segments, nav]);

  if (!isLoaded) return <AccessLoading />;
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: appLoaded, userData } = useApp();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!appLoaded) return;
    if (!isSignedIn) return;
    if (!userData.hasOnboarded) {
      router.replace("/onboarding" as any);
    }
  }, [appLoaded, userData.hasOnboarded, isSignedIn]);

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
    void precacheVideosOnWifi(getAllVideoUrls());
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
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={tokenCache}
      proxyUrl={clerkProxyUrl}
    >
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <ClerkLoading>
                  <AccessLoading />
                </ClerkLoading>
                <ClerkLoaded>
                  <AuthTokenSync />
                  <AppProvider>
                    <AccessGate>
                      <RootLayoutNav />
                    </AccessGate>
                    {showIntro && !splashDone && (
                      <SplashAnimation onFinished={handleSplashFinished} />
                    )}
                  </AppProvider>
                </ClerkLoaded>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/expo";
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
import { setBaseUrl } from "@workspace/api-client-react";
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
import { EntitlementProvider, useEntitlement } from "@/context/EntitlementContext";

const INTRO_SEEN_KEY = "hasSeenIntro";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function AccessGate({ children }: { children: React.ReactNode }) {
  const { state } = useEntitlement();
  const segments = useSegments() as string[];
  const nav = useRouter();

  useEffect(() => {
    if (state === "loading") return;

    const inAuth = segments[0] === "(auth)";
    const sub = segments[1];

    switch (state) {
      case "signedOut":
        if (!(inAuth && (sub === "sign-in" || sub === "sign-up"))) {
          nav.replace("/(auth)/sign-in" as any);
        }
        break;
      case "needsInvite":
        if (!(inAuth && sub === "redeem")) {
          nav.replace("/(auth)/redeem" as any);
        }
        break;
      case "expired":
      case "revoked":
      case "offlineExpired":
      case "error":
        if (!(inAuth && sub === "locked")) {
          nav.replace({ pathname: "/(auth)/locked", params: { reason: state } } as any);
        }
        break;
      case "active":
        if (inAuth) {
          nav.replace("/(tabs)" as any);
        }
        break;
    }
  }, [state, segments, nav]);

  if (state === "loading") return <AccessLoading />;
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: appLoaded, userData } = useApp();
  const { state } = useEntitlement();

  useEffect(() => {
    if (!appLoaded) return;
    if (state !== "active") return;
    if (!userData.hasOnboarded) {
      router.replace("/onboarding" as any);
    }
  }, [appLoaded, userData.hasOnboarded, state]);

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
                  <EntitlementProvider>
                    <AppProvider>
                      <AccessGate>
                        <RootLayoutNav />
                      </AccessGate>
                      {showIntro && !splashDone && (
                        <SplashAnimation onFinished={handleSplashFinished} />
                      )}
                    </AppProvider>
                  </EntitlementProvider>
                </ClerkLoaded>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

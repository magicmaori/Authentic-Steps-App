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
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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

// Keys that @clerk/expo stores in SecureStore — clear these to reset a stuck session
const CLERK_SECURE_STORE_KEYS = [
  "__clerk_client_jwt",
  "clerk-db-jwt",
  "__clerk_db_jwt",
];

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

/**
 * Shows the normal loading screen for CLERK_TIMEOUT_MS, then surfaces a
 * recovery button so the app is never permanently stuck.
 * Stale SecureStore tokens from a previous install are the most common cause
 * of Clerk hanging before it makes any network request.
 * On a fresh install there are no cached keys, so we show a neutral
 * "check your connection" message instead of the misleading cache copy.
 */
const CLERK_TIMEOUT_MS = 15_000;

function ClerkLoadingGuard({ onClearAndRetry }: { onClearAndRetry: () => void }) {
  const [timedOut, setTimedOut] = useState(false);
  const [hasCachedSession, setHasCachedSession] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      CLERK_SECURE_STORE_KEYS.map((k) =>
        SecureStore.getItemAsync(k).then((v) => v !== null && v !== undefined)
      )
    ).then((results) => {
      if (!cancelled) setHasCachedSession(results.some(Boolean));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), CLERK_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  if (!timedOut) return <AccessLoading />;

  const hasCache = hasCachedSession === true;

  return (
    <View style={{ flex: 1, backgroundColor: "#193b83", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" }}>
        Taking longer than expected
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 10, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
        {hasCache
          ? "A cached session may be causing the delay.\nTap below to clear it and try again."
          : "Check your connection and tap Retry to try again."}
      </Text>
      <TouchableOpacity
        onPress={onClearAndRetry}
        style={{ marginTop: 32, backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
        activeOpacity={0.85}
      >
        <Text style={{ color: "#193b83", fontWeight: "700", fontSize: 15 }}>
          {hasCache ? "Clear cache & retry" : "Retry"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

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
  const [clerkKey, setClerkKey] = useState(0);

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

  const clearClerkCacheAndRetry = useCallback(async () => {
    await Promise.allSettled(
      CLERK_SECURE_STORE_KEYS.map((k) => SecureStore.deleteItemAsync(k))
    );
    setClerkKey((n) => n + 1);
  }, []);

  if (!fontsLoaded && !fontError) return null;
  if (showIntro === null) return null;

  return (
    <ClerkProvider
      key={clerkKey}
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
                  <ClerkLoadingGuard onClearAndRetry={clearClerkCacheAndRetry} />
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

import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, usePathname } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { AppLogo } from "@/components/AppLogo";

const TAB_NAMES: Record<string, string> = {
  "/": "Daily",
  "/streaks": "Streaks",
  "/community": "Community",
  "/support": "Support",
  "/profile": "Profile",
};

function HeaderLeft({ tabName }: { tabName?: string }) {
  const colors = useColors();
  return (
    <View style={headerStyles.container}>
      <AppLogo size="sm" />
      {tabName ? (
        <Text
          style={[headerStyles.tabName, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {tabName}
        </Text>
      ) : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 1,
  },
  tabName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});

function NativeTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const tabName = TAB_NAMES[pathname] ?? TAB_NAMES["/"];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: colors.background,
        }}
      >
        <HeaderLeft tabName={tabName} />
      </View>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "sun.horizon", selected: "sun.horizon.fill" }} />
          <Label>Daily</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="streaks">
          <Icon sf={{ default: "flame", selected: "flame.fill" }} />
          <Label>Streaks</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="community">
          <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
          <Label>Community</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="support">
          <Icon sf={{ default: "heart", selected: "heart.fill" }} />
          <Label>Support</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const safeAreaInsets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: ({ children }) => <HeaderLeft tabName={children} />,
        headerTitleAlign: "left",
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Daily",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="sun.horizon.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="sunny" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "Streaks",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="flame.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="flame" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2.fill" tintColor={color} size={24} />
            ) : (
              <Feather name="users" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="heart.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="heart" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.circle.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="person-circle" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

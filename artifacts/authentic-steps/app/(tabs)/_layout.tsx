import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, View, useColorScheme, type GestureResponderEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { AppLogo } from "@/components/AppLogo";

const ICON_SPRING = { damping: 10, stiffness: 220, useNativeDriver: true } as const;
const LABEL_FADE_MS = 150;
const PRESS_DIP_OPACITY = 0.5;
const PRESS_IN_MS = 60;
const PRESS_OUT_MS = 180;

type TabBarButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> & {
  children?: React.ReactNode;
};

function TapFeedbackTabButton({ children, onPressIn, onPressOut, style, ...rest }: TabBarButtonProps) {
  const pressOpacity = useRef(new Animated.Value(1)).current;

  function handlePressIn(e: GestureResponderEvent) {
    if (Platform.OS !== "android") {
      Animated.timing(pressOpacity, {
        toValue: PRESS_DIP_OPACITY,
        duration: PRESS_IN_MS,
        useNativeDriver: true,
      }).start();
    }
    if (typeof onPressIn === "function") onPressIn(e);
  }

  function handlePressOut(e: GestureResponderEvent) {
    if (Platform.OS !== "android") {
      Animated.timing(pressOpacity, {
        toValue: 1,
        duration: PRESS_OUT_MS,
        useNativeDriver: true,
      }).start();
    }
    if (typeof onPressOut === "function") onPressOut(e);
  }

  return (
    <Pressable
      {...rest}
      style={style}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: "rgba(128,128,128,0.22)", borderless: false, radius: 40 }}
    >
      <Animated.View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          opacity: Platform.OS === "android" ? 1 : pressOpacity,
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function AnimatedTabLabel({ focused, color, children }: { focused: boolean; color: string; children: string }) {
  const boldOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(boldOpacity, {
      toValue: focused ? 1 : 0,
      duration: LABEL_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [focused, boldOpacity]);

  const normalOpacity = boldOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 14 }}>
      <Animated.Text style={{ position: "absolute", color, fontWeight: "600", fontSize: 10, opacity: boldOpacity }}>
        {children}
      </Animated.Text>
      <Animated.Text style={{ position: "absolute", color, fontWeight: "400", fontSize: 10, opacity: normalOpacity }}>
        {children}
      </Animated.Text>
    </View>
  );
}

function AnimatedTabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevFocused = useRef(focused);

  useEffect(() => {
    if (focused && !prevFocused.current) {
      scale.setValue(0.82);
      Animated.spring(scale, { toValue: 1, ...ICON_SPRING }).start();
    }
    prevFocused.current = focused;
  }, [focused, scale]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

const TAB_NAMES: Record<string, string> = {
  "/": "Daily",
  "/streaks": "Streaks",
  "/community": "Community",
  "/support": "Support",
  "/profile": "Profile",
};

const NATIVE_TAB_ROUTES = ["index", "streaks", "community", "support", "profile"] as const;
type NativeTabRoute = (typeof NATIVE_TAB_ROUTES)[number];

const PATHNAME_TO_ROUTE: Record<string, NativeTabRoute> = {
  "/": "index",
  "/streaks": "streaks",
  "/community": "community",
  "/support": "support",
  "/profile": "profile",
};

function HeaderLeft({ tabName }: { tabName?: string }) {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [displayedName, setDisplayedName] = useState(tabName);
  const prevTabName = useRef(tabName);

  useEffect(() => {
    if (tabName !== prevTabName.current) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 75,
        useNativeDriver: true,
      }).start(() => {
        setDisplayedName(tabName);
        prevTabName.current = tabName;
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 75,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [tabName, fadeAnim]);

  return (
    <View style={headerStyles.leftContainer}>
      <AppLogo size="sm" />
      {displayedName ? (
        <Animated.Text
          style={[headerStyles.tabName, { color: colors.mutedForeground, opacity: fadeAnim }]}
          numberOfLines={1}
        >
          {displayedName}
        </Animated.Text>
      ) : null}
    </View>
  );
}

function HeaderRight() {
  const colors = useColors();
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  function handlePress() {
    router.navigate("/profile");
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        headerStyles.settingsButton,
        { opacity: pressed ? 0.5 : 1 },
      ]}
      accessibilityLabel="Open settings"
      accessibilityRole="button"
      hitSlop={8}
    >
      {isIOS ? (
        <SymbolView name="gearshape" tintColor={colors.mutedForeground} size={22} />
      ) : (
        <Ionicons name="settings-outline" size={22} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

const headerStyles = StyleSheet.create({
  leftContainer: {
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
  settingsButton: {
    padding: 4,
  },
});

function NativeTriggerContent({
  scaleAnim,
  icon,
  label,
}: {
  scaleAnim: Animated.Value;
  icon: React.ReactNode;
  label: string;
}) {
  const pressOpacity = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.timing(pressOpacity, {
      toValue: PRESS_DIP_OPACITY,
      duration: PRESS_IN_MS,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.timing(pressOpacity, {
      toValue: 1,
      duration: PRESS_OUT_MS,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ alignItems: "center" }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: pressOpacity }}>
        {icon}
      </Animated.View>
      <Label selectedStyle={{ fontWeight: "600" }}>{label}</Label>
    </Pressable>
  );
}

function NativeTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const tabName = TAB_NAMES[pathname] ?? TAB_NAMES["/"];
  const activeRoute = PATHNAME_TO_ROUTE[pathname] ?? "index";

  const scaleAnims = useRef(
    Object.fromEntries(NATIVE_TAB_ROUTES.map((r) => [r, new Animated.Value(1)])) as Record<
      NativeTabRoute,
      Animated.Value
    >
  ).current;

  const prevActiveRoute = useRef<NativeTabRoute>(activeRoute);

  useEffect(() => {
    if (activeRoute !== prevActiveRoute.current) {
      const anim = scaleAnims[activeRoute];
      anim.setValue(0.82);
      Animated.spring(anim, { toValue: 1, ...ICON_SPRING }).start();
      prevActiveRoute.current = activeRoute;
    }
  }, [activeRoute, scaleAnims]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: colors.background,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <HeaderLeft tabName={tabName} />
        <HeaderRight />
      </View>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTriggerContent
            scaleAnim={scaleAnims["index"]}
            icon={<Icon sf={{ default: "sun.horizon", selected: "sun.horizon.fill" }} />}
            label="Daily"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="streaks">
          <NativeTriggerContent
            scaleAnim={scaleAnims["streaks"]}
            icon={<Icon sf={{ default: "flame", selected: "flame.fill" }} />}
            label="Streaks"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="community">
          <NativeTriggerContent
            scaleAnim={scaleAnims["community"]}
            icon={<Icon sf={{ default: "person.2", selected: "person.2.fill" }} />}
            label="Community"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="support">
          <NativeTriggerContent
            scaleAnim={scaleAnims["support"]}
            icon={<Icon sf={{ default: "heart", selected: "heart.fill" }} />}
            label="Support"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTriggerContent
            scaleAnim={scaleAnims["profile"]}
            icon={<Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />}
            label="Profile"
          />
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
        headerRight: () => <HeaderRight />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarButton: (props) => <TapFeedbackTabButton {...props} />,
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
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>Daily</AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              {isIOS ? (
                <SymbolView name="sun.horizon.fill" tintColor={color} size={24} />
              ) : (
                <Ionicons name="sunny" size={22} color={color} />
              )}
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "Streaks",
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>Streaks</AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              {isIOS ? (
                <SymbolView name="flame.fill" tintColor={color} size={24} />
              ) : (
                <Ionicons name="flame" size={22} color={color} />
              )}
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>Community</AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              {isIOS ? (
                <SymbolView name="person.2.fill" tintColor={color} size={24} />
              ) : (
                <Feather name="users" size={22} color={color} />
              )}
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>Support</AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              {isIOS ? (
                <SymbolView name="heart.fill" tintColor={color} size={24} />
              ) : (
                <Ionicons name="heart" size={22} color={color} />
              )}
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>Profile</AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              {isIOS ? (
                <SymbolView name="person.circle.fill" tintColor={color} size={24} />
              ) : (
                <Ionicons name="person-circle" size={22} color={color} />
              )}
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <ClassicTabLayout />;
}

import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useAppOptional } from "@/context/AppContext";

/**
 * Returns the design tokens for the current color scheme.
 *
 * When called inside AppProvider, reads the user's themePreference and
 * applies it: 'light' or 'dark' override the device setting; 'system'
 * follows useColorScheme() as before.
 *
 * When called outside AppProvider (e.g. ErrorFallback rendered by
 * ErrorBoundary which wraps AppProvider), falls back to device scheme
 * so the error screen still renders correctly.
 */
export function useColors() {
  const app = useAppOptional();
  const deviceScheme = useColorScheme();

  let scheme: "light" | "dark";
  const pref = app?.userData.themePreference ?? "system";

  if (pref === "light") {
    scheme = "light";
  } else if (pref === "dark") {
    scheme = "dark";
  } else {
    scheme = deviceScheme === "dark" ? "dark" : "light";
  }

  const palette =
    scheme === "dark" && "dark" in colors
      ? (colors as unknown as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}

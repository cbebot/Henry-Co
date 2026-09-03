import { ThemeProvider } from "@react-navigation/native";
import type { Theme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { brandType } from "@henryco/rn-type";
import { palette } from "@/design-system/theme";
import { PlatformProvider } from "@/providers/PlatformProvider";

// Owned type — RN text tokens (flag-gated; platform defaults until reveal).
const type = brandType();

const navigationTheme: Theme = {
  dark: true,
  colors: {
    primary: palette.accent,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.border,
    notification: palette.accent,
  },
  fonts: {
    regular: { fontFamily: type.sans, fontWeight: "400" },
    medium: { fontFamily: type.sansMedium, fontWeight: "500" },
    bold: { fontFamily: type.sansBold, fontWeight: "700" },
    heavy: { fontFamily: type.sansBold, fontWeight: "800" },
  },
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PlatformProvider>
        <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
      </PlatformProvider>
    </GestureHandlerRootView>
  );
}

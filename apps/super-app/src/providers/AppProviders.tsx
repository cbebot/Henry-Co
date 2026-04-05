import { ThemeProvider } from "@react-navigation/native";
import type { Theme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { palette } from "@/design-system/theme";
import { PlatformProvider } from "@/providers/PlatformProvider";

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
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "800" },
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

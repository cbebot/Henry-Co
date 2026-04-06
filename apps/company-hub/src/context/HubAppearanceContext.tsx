import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import type { MD3Theme } from "react-native-paper";

import { getThemeMode, type ThemeMode } from "@/store/themeStore";
import { getHubPalette, type HubPalette } from "@/theme/hubPalette";
import { hubPaperLightTheme, hubPaperTheme } from "@/theme/paperTheme";

type ResolvedScheme = "light" | "dark";

type HubAppearanceContextValue = {
  themeMode: ThemeMode;
  resolvedScheme: ResolvedScheme;
  palette: HubPalette;
  paperTheme: MD3Theme;
  refresh: () => Promise<void>;
};

const HubAppearanceContext = createContext<HubAppearanceContextValue | null>(
  null,
);

function resolveScheme(
  mode: ThemeMode,
  system: ResolvedScheme | null | undefined,
): ResolvedScheme {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return system === "light" ? "light" : "dark";
}

export function HubAppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  const load = useCallback(async () => {
    const mode = await getThemeMode();
    setThemeMode(mode);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolvedScheme = useMemo(
    () => resolveScheme(themeMode, systemScheme ?? "dark"),
    [themeMode, systemScheme],
  );

  const palette = useMemo(
    () => getHubPalette(resolvedScheme),
    [resolvedScheme],
  );

  const paperTheme = useMemo(
    () => (resolvedScheme === "light" ? hubPaperLightTheme : hubPaperTheme),
    [resolvedScheme],
  );

  const value = useMemo(
    () => ({
      themeMode,
      resolvedScheme,
      palette,
      paperTheme,
      refresh: load,
    }),
    [themeMode, resolvedScheme, palette, paperTheme, load],
  );

  return (
    <HubAppearanceContext.Provider value={value}>
      {children}
    </HubAppearanceContext.Provider>
  );
}

export function useHubAppearance(): HubAppearanceContextValue {
  const ctx = useContext(HubAppearanceContext);
  if (!ctx) {
    throw new Error("useHubAppearance must be used within HubAppearanceProvider");
  }
  return ctx;
}

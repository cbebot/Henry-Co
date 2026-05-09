"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { HENRYCO_PUBLIC_THEME_STORAGE_KEY } from "./constants";

/**
 * Mirror next-themes' `resolvedTheme` onto `<html>.style.colorScheme` and a
 * sentinel `data-theme-source="next-themes"` attribute. The blocking script
 * already runs pre-paint to set `class="dark"`, `data-theme`, and
 * `colorScheme` — but once next-themes hydrates with `attribute={["class",
 * "data-theme"]}` it maintains both attributes going forward, so the toggle
 * actually flips the page. This effect just keeps `colorScheme` aligned for
 * native form-control rendering on theme switch.
 */
function ColorSchemeSync() {
  const { resolvedTheme } = useTheme();
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const next = resolvedTheme === "dark" ? "dark" : "light";
    root.style.colorScheme = next;
    root.dataset.themeSource = "next-themes";
  }, [resolvedTheme]);
  return null;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute={["class", "data-theme"]}
      defaultTheme="system"
      enableSystem
      storageKey={HENRYCO_PUBLIC_THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <ColorSchemeSync />
      {children}
    </NextThemesProvider>
  );
}

export { ThemeProvider };
export default ThemeProvider;
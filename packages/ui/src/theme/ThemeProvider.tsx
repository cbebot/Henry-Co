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

/**
 * DeviceThemeSync — a change to the OS colour scheme always re-takes control.
 *
 * The toggle writes an explicit `light`/`dark` preference, and from then on
 * next-themes PINS it and ignores the device — so after one tap, changing the
 * OS theme no longer updates the site (owner-reported: "the moon toggle stays
 * still… it doesn't switch when the user switches their device"). We treat a
 * device-theme *change* as a fresh, intentional signal: reset to `system` so
 * the page AND the toggle snap back to following the OS.
 *
 * The contract this gives every public site — "respect my device; remember my
 * choice until I change my device":
 *   • First visit, no pref → follow the OS (defaultTheme="system").
 *   • Tap the toggle → explicit light/dark, persisted, overrides the OS and
 *     survives reloads.
 *   • Change the OS theme → the explicit pref yields; the site follows the OS
 *     again (and a later tap can re-pin). No more "stuck on the old theme".
 *
 * Listener-only effect: we never read matchMedia into the explicit value (that
 * would re-pin); we just hand control back to next-themes' own `system`
 * resolution, which keeps `class`/`data-theme` consistent for page + chrome.
 */
function DeviceThemeSync() {
  const { setTheme } = useTheme();
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme("system");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    // Safari < 14 fallback
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, [setTheme]);
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
      <DeviceThemeSync />
      {children}
    </NextThemesProvider>
  );
}

export { ThemeProvider };
export default ThemeProvider;
"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "../theme/ThemeProvider";
import { LocaleProvider } from "@henryco/i18n/react";
import type { AppLocale } from "@henryco/i18n";

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

export function PublicLocaleProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}

/**
 * Mount point for ecosystem-wide preference persistence (theme/locale are handled by dedicated providers).
 * Passes children through; compose `EcosystemPreferences` where the full consent UI is required.
 */
export function PublicPreferencesProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

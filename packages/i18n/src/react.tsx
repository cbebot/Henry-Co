"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppLocale } from "./locales";

type LocaleContextValue = {
  locale: AppLocale;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useHenryCoLocale(): AppLocale {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useHenryCoLocale must be used within LocaleProvider");
  }
  return ctx.locale;
}

export function useOptionalHenryCoLocale(): AppLocale | null {
  return useContext(LocaleContext)?.locale ?? null;
}

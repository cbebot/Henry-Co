"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { HENRYCO_PUBLIC_THEME_STORAGE_KEY } from "./constants";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={HENRYCO_PUBLIC_THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export { ThemeProvider };
export default ThemeProvider;
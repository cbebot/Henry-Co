"use client";

import { ThemeProvider } from "@henryco/ui";

export function HubPublicProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

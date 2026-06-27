"use client";

import { useSyncExternalStore } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getStudioMiscCopy } from "@henryco/i18n";

export function StudioThemeToggle() {
  const locale = useHenryCoLocale();
  const copy = getStudioMiscCopy(locale);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className="h-11 w-11 rounded-full border border-[var(--studio-line)]" />;
  }

  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--studio-line)] bg-white/[0.04] text-[var(--studio-ink)] transition hover:bg-white/[0.08]"
      aria-label={copy.themeToggle.toggleTheme}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}

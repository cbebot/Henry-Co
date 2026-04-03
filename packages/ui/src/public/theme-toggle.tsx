"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    >
      {isDark ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      // `isDark` is read only on click (client, post-mount) — correct there.
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl outline-none transition hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-[#050816]",
        className
      )}
    >
      {/* Render BOTH icons and let the `.dark` class pick — the DOM is identical
          server↔client, so there is no hydration mismatch (branching on
          resolvedTheme during render caused a dark-only React #418). */}
      <SunMedium className="hidden h-5 w-5 dark:block" aria-hidden />
      <Moon className="block h-5 w-5 dark:hidden" aria-hidden />
    </button>
  );
}
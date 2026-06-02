"use client";

import * as React from "react";
import { Laptop, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/cn";

const MODES = ["light", "dark", "system"] as const;

/**
 * Public theme toggle — TRI-STATE: light → dark → system.
 *
 * The "system" state is the load-bearing one: it lets the public surface
 * AUTO-FOLLOW the visitor's OS colour scheme and flip live when they change it,
 * with no further clicks. A binary light/dark toggle (the previous version) only
 * ever wrote an explicit pref, which permanently PINNED the theme and stopped
 * next-themes + the anti-flash blocking script from following the OS — so the
 * site never auto-switched again after a single tap. The cycle restores a path
 * back to "system".
 *
 * Hydration: render the neutral "system" affordance until mounted so the server
 * and first client render match (branching on the real theme during render
 * caused a dark-only React #418). After mount we reflect the actual mode.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const raw = mounted ? theme ?? "system" : "system";
  const mode = (MODES.includes(raw as (typeof MODES)[number]) ? raw : "system") as (typeof MODES)[number];
  const isDark = mounted && resolvedTheme === "dark";

  const cycle = () => setTheme(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);

  const label =
    mode === "system"
      ? "Theme: System (following your device)"
      : mode === "dark"
        ? "Theme: Dark"
        : "Theme: Light";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={cycle}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl outline-none transition hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-[#050816]",
        className
      )}
    >
      {mode === "system" ? (
        <Laptop className="h-5 w-5" aria-hidden />
      ) : isDark ? (
        <SunMedium className="h-5 w-5" aria-hidden />
      ) : (
        <Moon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}

"use client";

import * as React from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/cn";

/**
 * Public theme toggle — BINARY: light ⇄ dark.
 *
 * Device-aware by default, then remembers your choice — the standard, calm
 * contract every Henry Onyx public site shares:
 *
 *   • First visit, no stored preference → next-themes (`defaultTheme="system"`
 *     + `enableSystem`) and the pre-paint blocking script resolve the visitor's
 *     OS colour scheme, so the page opens matching the device.
 *   • One tap flips the *resolved* theme and writes an explicit `light`/`dark`
 *     preference (persisted under `henryco-public-theme`), which from then on
 *     overrides the OS — "respect my device, remember my choice".
 *
 * There is deliberately NO third "system" position. The tri-state cycle let the
 * page land in mixed/ambiguous states (light-first `--home-*` content beside
 * dark-first `--site-*` chrome → light-on-light), and "system" is already the
 * default until the first tap, so a binary toggle loses nothing and removes the
 * whole class of desync. The toggle always sets a *definitive* theme, so the
 * blocking script + next-themes apply one consistent `class`/`data-theme`.
 *
 * Hydration-safe: until mounted we render the light affordance (matching the
 * SSR/light default) so server and first client render agree (no React #418),
 * then reflect the real resolved theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = mounted ? `Switch to ${nextTheme} theme` : "Switch theme";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl outline-none transition hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-[#050816]",
        className
      )}
    >
      {/* Icon shows the action: a sun while dark (tap → light), a moon while
          light (tap → dark). Before mount we show the moon (light default) so
          SSR and first client render match. */}
      {isDark ? (
        <SunMedium className="h-5 w-5" aria-hidden />
      ) : (
        <Moon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}

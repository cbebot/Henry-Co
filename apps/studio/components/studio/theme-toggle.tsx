"use client";

import { useSyncExternalStore } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Studio header theme toggle — BINARY: light ⇄ dark.
 *
 * Device-aware by default (system until the first tap, via next-themes +
 * the pre-paint blocking script), then flips + persists an explicit choice.
 * No tri-state "system" position — matches the shared @henryco/ui toggle and
 * removes the content/chrome desync the cycle could leave behind.
 * useSyncExternalStore gives a mounted gate (placeholder pre-hydration).
 */
export function StudioThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className="h-11 w-11 rounded-full border border-[var(--studio-line)]" />;
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = `Switch to ${nextTheme} theme`;

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--studio-line)] bg-[color:var(--studio-surface)] text-[var(--studio-ink)] transition hover:bg-[color:var(--studio-surface-strong)]"
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <SunMedium className="h-4 w-4" aria-hidden />
      ) : (
        <MoonStar className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

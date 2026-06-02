"use client";

import { useSyncExternalStore } from "react";
import { Laptop, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

const MODES = ["light", "dark", "system"] as const;

/**
 * Studio header theme toggle — TRI-STATE: light → dark → system.
 *
 * "system" lets the public surface auto-follow the device colour scheme and
 * flip live with no further clicks; the previous binary toggle pinned an
 * explicit pref and stopped OS-following after one tap. useSyncExternalStore
 * gives a mounted gate (placeholder pre-hydration) so we never branch on the
 * client-only theme during SSR.
 */
export function StudioThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className="h-11 w-11 rounded-full border border-[var(--studio-line)]" />;
  }

  const raw = theme ?? "system";
  const mode = (MODES.includes(raw as (typeof MODES)[number]) ? raw : "system") as (typeof MODES)[number];
  const isDark = resolvedTheme === "dark";
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
      onClick={cycle}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--studio-line)] bg-white/[0.04] text-[var(--studio-ink)] transition hover:bg-white/[0.08]"
      aria-label={label}
      title={label}
    >
      {mode === "system" ? (
        <Laptop className="h-4 w-4" aria-hidden />
      ) : isDark ? (
        <SunMedium className="h-4 w-4" aria-hidden />
      ) : (
        <MoonStar className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

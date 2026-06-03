"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

/**
 * Care public theme toggle — BINARY: light ⇄ dark.
 *
 * Device-aware by default (system until first tap), then flips + persists an
 * explicit preference. Replaces the prior 3-option (system/light/dark) dropdown
 * to match the shared, standard Henry Onyx toggle across every site.
 */
export default function ThemeToggle() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) return <div className="h-10 w-10" />;

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/80 text-zinc-900 shadow-sm backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.10]"
      aria-label={t("Toggle theme")}
      title={dark ? t("Switch to light") : t("Switch to dark")}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

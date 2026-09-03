"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "../cn";

/**
 * Binary theme toggle (light ⇄ dark) with a text label.
 *
 * Same contract as the icon-only `@henryco/ui/public` ThemeToggle: device-aware
 * by default (system until first tap), then it flips + persists an explicit
 * preference. No tri-state "system" position — see that file for the rationale.
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
      onClick={() => setTheme(nextTheme)}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
        "border-black/10 bg-white/60 backdrop-blur hover:bg-white/80",
        "dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/55",
        className
      )}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

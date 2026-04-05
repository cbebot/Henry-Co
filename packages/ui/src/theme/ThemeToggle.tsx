"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";
import { cn } from "../cn";

const MODES = ["light", "dark", "system"] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const raw = theme ?? "system";
  const mode = (MODES.includes(raw as (typeof MODES)[number]) ? raw : "system") as (typeof MODES)[number];
  const resolved = resolvedTheme === "dark" ? "dark" : "light";
  const isDark = resolved === "dark";

  const cycle = () => {
    const i = MODES.indexOf(mode);
    setTheme(MODES[(i + 1) % MODES.length]);
  };

  const label =
    mode === "system"
      ? `Theme: System (${isDark ? "dark" : "light"} now)`
      : mode === "dark"
        ? "Theme: Dark"
        : "Theme: Light";

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
        "border-black/10 bg-white/60 backdrop-blur hover:bg-white/80",
        "dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/55",
        className
      )}
      aria-label={label}
      title={label}
    >
      {mode === "system" ? (
        <Laptop className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {mode === "system" ? "System" : isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";

function Icon({ mode }: { mode: "light" | "dark" | "system" }) {
  if (mode === "light") return <Sun className="h-4 w-4" />;
  if (mode === "dark") return <Moon className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) return <div className="h-10 w-[110px]" />;

  const current = (theme ?? "system") as "light" | "dark" | "system";
  const visibleLabel = current === "system" ? `System (${resolvedTheme})` : current;

  const item = (mode: "light" | "dark" | "system", label: string) => (
    <button
      type="button"
      onClick={() => {
        setTheme(mode);
        setOpen(false);
      }}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100 dark:text-white/85 dark:hover:bg-white/10"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
        <Icon mode={mode} />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.10]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-black/5 dark:bg-white/10">
          <Icon mode={current} />
        </span>
        <span className="hidden sm:inline">{visibleLabel}</span>
        <span className="sm:hidden">{current}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[220px] overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-2 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#0B1220]/95">
          {item("system", "System")}
          {item("light", "Light")}
          {item("dark", "Dark")}
        </div>
      ) : null}
    </div>
  );
}

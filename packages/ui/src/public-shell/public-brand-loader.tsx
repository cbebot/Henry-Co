import type { ReactNode } from "react";
import { HenryCoBrandedSpinner } from "../loading/HenryCoBrandedSpinner";
import { cn } from "../lib/cn";

/**
 * Premium full-viewport branded loader.
 *
 * Used for first-paint fallbacks, expensive client bootstraps, and other moments
 * where the page hasn't arrived yet but we want to feel calm and intentional
 * instead of showing a blank white flash or a generic spinner.
 *
 * Respects `prefers-reduced-motion` (via the inner branded spinner) and keeps
 * the visual footprint quiet so it doesn't feel like a marketing screen.
 */
export function PublicBrandLoader({
  brand = "HenryCo",
  eyebrow,
  title = "One moment",
  subtitle,
  tone = "auto",
  children,
  className,
}: {
  brand?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** `auto` uses theme tokens; `onDark` forces the dark premium chrome. */
  tone?: "auto" | "onDark";
  children?: ReactNode;
  className?: string;
}) {
  const onDark = tone === "onDark";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-12",
        onDark
          ? "bg-[#050816] text-white"
          : "bg-white text-zinc-950 dark:bg-[#050816] dark:text-white",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(1200px_circle_at_50%_-10%,rgba(201,162,39,0.18),transparent_55%),radial-gradient(900px_circle_at_50%_110%,rgba(201,162,39,0.08),transparent_60%)]"
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-[1.25rem] border shadow-[0_28px_80px_-36px_rgba(201,162,39,0.5)]",
            onDark
              ? "border-white/10 bg-white/[0.04]"
              : "border-zinc-200/80 bg-white dark:border-white/10 dark:bg-white/[0.04]"
          )}
        >
          <HenryCoBrandedSpinner size="xl" tone={onDark ? "onDark" : "default"} label={title} />
        </div>
        <div className="max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-500/80 dark:text-amber-300/70">
            {eyebrow ?? brand}
          </p>
          <p
            className={cn(
              "mt-2.5 text-xl font-black tracking-[-0.02em]",
              onDark ? "text-white" : "text-zinc-950 dark:text-white"
            )}
          >
            {title}
          </p>
          {subtitle ? (
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed",
                onDark ? "text-white/65" : "text-zinc-600 dark:text-white/65"
              )}
            >
              {subtitle}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

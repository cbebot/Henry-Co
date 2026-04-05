import type { ReactNode } from "react";
import { HenryCoActivityIndicator } from "../loading/HenryCoActivityIndicator";
import { cn } from "../lib/cn";

/** Shared copy tokens for public loading surfaces (route + inline). */
export const HENRYCO_PUBLIC_LOADING = {
  defaultTitle: "Loading",
  defaultSubtitle: "Preparing this view.",
} as const;

/**
 * Shared public route loading — no timers, resolves with the route when data is ready.
 */
export function HenryCoPublicRouteLoading({
  eyebrow,
  title = HENRYCO_PUBLIC_LOADING.defaultTitle,
  subtitle = HENRYCO_PUBLIC_LOADING.defaultSubtitle,
  className,
  spinnerClassName,
  tone = "default",
  children,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  spinnerClassName?: string;
  /** Use on dark division shells (e.g. Care) where zinc body text would be too dim. */
  tone?: "default" | "onDark";
  /** Optional skeleton or layout preview below the shared loading header. */
  children?: ReactNode;
}) {
  const onDark = tone === "onDark";
  return (
    <div
      className={cn("flex flex-col px-6 py-10 sm:py-14", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center gap-4">
        <HenryCoActivityIndicator
          className={cn(
            onDark ? "text-white/85" : "text-zinc-700 dark:text-white/80",
            spinnerClassName
          )}
          label={title}
        />
        <div className="max-w-md text-center">
          {eyebrow ? (
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.2em]",
                onDark ? "text-white/48" : "text-zinc-500 dark:text-white/45"
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <p
            className={cn(
              "text-sm font-semibold",
              onDark ? "text-white" : "text-zinc-900 dark:text-white",
              eyebrow && "mt-2"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "mt-1 text-sm leading-relaxed",
              onDark ? "text-white/62" : "text-zinc-600 dark:text-white/60"
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Inline row for async sections (cards, panels) — same spinner language as route loading.
 */
export function HenryCoPublicInlineLoading({
  label = HENRYCO_PUBLIC_LOADING.defaultTitle,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 px-4 py-6 dark:border-white/10 dark:bg-zinc-900/40",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <HenryCoActivityIndicator
        size="sm"
        className="text-zinc-700 dark:text-white/75"
        label={label}
      />
      <span className="text-sm font-medium text-zinc-700 dark:text-white/75">{label}</span>
    </div>
  );
}

/**
 * Neutral skeleton blocks for “content is arriving” states — works in light and dark.
 */
export function HenryCoPublicContentSkeleton({
  cards = 3,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-7xl gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-3 lg:px-8",
        className
      )}
      aria-hidden
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="space-y-4 rounded-[1.75rem] border border-zinc-200/90 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/50"
        >
          <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
          <div className="h-8 w-2/3 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
          <div className="space-y-2 pt-2">
            <div className="h-2.5 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
            <div className="h-2.5 w-[88%] animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
            <div className="h-2.5 w-[72%] animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

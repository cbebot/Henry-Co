import type { ReactNode } from "react";
import { HenryCoBrandedSpinner } from "../loading/HenryCoBrandedSpinner";
import { cn } from "../lib/cn";

/**
 * Unified public route-level loading indicator.
 *
 * Calm, branded, screen-reader friendly. Appears across every public division's
 * `/loading.tsx` by convention so the ecosystem feels one-and-the-same during
 * navigation.
 */
export function PublicRouteLoader({
  eyebrow,
  title = "One moment",
  subtitle = "Bringing this page together.",
  className,
  spinnerClassName,
  tone = "default",
  size = "lg",
  children,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  spinnerClassName?: string;
  tone?: "default" | "onDark";
  size?: "md" | "lg" | "xl";
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
      <div className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center gap-5">
        <HenryCoBrandedSpinner
          size={size}
          tone={tone}
          className={cn(spinnerClassName)}
          label={title}
        />
        <div className="max-w-md text-center">
          {eyebrow ? (
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                onDark ? "text-white/50" : "text-zinc-500 dark:text-white/45"
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <p
            className={cn(
              "text-[0.95rem] font-semibold tracking-[-0.01em]",
              onDark ? "text-white" : "text-zinc-900 dark:text-white",
              eyebrow && "mt-2"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed",
              onDark ? "text-white/65" : "text-zinc-600 dark:text-white/60"
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

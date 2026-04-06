import type { ReactNode } from "react";
import { HenryCoActivityIndicator } from "../loading/HenryCoActivityIndicator";
import { cn } from "../lib/cn";

/**
 * Unified public route-level loading indicator.
 * Re-exports the proven HenryCoPublicRouteLoading pattern under the
 * standardized public-shell API name.
 */
export function PublicRouteLoader({
  eyebrow,
  title = "Loading",
  subtitle = "Preparing this view.",
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
  tone?: "default" | "onDark";
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

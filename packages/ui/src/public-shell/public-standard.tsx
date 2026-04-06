import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import type { PublicNavItem } from "./public-header";

/** Shared motion presets for public shells (respect `prefers-reduced-motion` in CSS when animating) */
export const PublicMotionTokens = {
  dropdownMs: 150,
  routeFadeMs: 200,
  sheetEase: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** Shared spacing scale hints for public marketing layouts */
export const PublicSpacingTokens = {
  headerToolbarY: "py-4",
  sectionX: "px-6 sm:px-8 lg:px-10",
  shellMax: "max-w-7xl",
} as const;

export type PublicMenuItem = PublicNavItem;

export type PublicMenuSection = {
  title: string;
  items: readonly PublicNavItem[];
};

/** Row of header actions (search, cart, etc.) with consistent gaps */
export function PublicHeaderActions({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2 sm:gap-3", className)}>
      {children}
    </div>
  );
}

/** Semantic slot for search UI in the public header toolbar */
export function PublicSearchSlot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 flex-1", className)} data-public-slot="search">
      {children}
    </div>
  );
}

/** Thin status / trust strip above or below the header */
export function PublicStatusStrip({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-b border-black/10 bg-black/[0.03] text-xs dark:border-white/10 dark:bg-white/[0.04]",
        className
      )}
      data-public-slot="status"
    >
      {children}
    </div>
  );
}

/** Page surface with HenryCo public background tokens */
export function PublicSurface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-zinc-950 dark:bg-[var(--site-bg,#050816)] dark:text-[var(--site-text,#ffffff)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Wraps main content to apply hero / sticky-header offset rules from site navigation config.
 */
export function PublicHeaderGuard({
  className,
  children,
  overlap,
}: {
  className?: string;
  children: ReactNode;
  /** When true, avoids extra top padding so heroes can sit flush under the sticky header */
  overlap?: boolean;
}) {
  return (
    <div
      className={cn(overlap ? "pt-0" : undefined, className)}
      data-public-header-guard={overlap ? "overlap" : "default"}
    >
      {children}
    </div>
  );
}

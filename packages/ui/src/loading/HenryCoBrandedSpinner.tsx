import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * HenryCo branded loader glyph.
 *
 * Renders a calm two-ring orbit in brand amber: an outer thin arc and an inner
 * concentric arc that rotates at a softer cadence. Honours `prefers-reduced-motion`
 * by falling back to a subtle pulsing dot so it never feels twitchy on slow devices.
 *
 * Use this glyph anywhere the ecosystem renders "loading" — route loaders,
 * full-page shells, skeleton overlays, wallet confirmations, etc.
 */
export function HenryCoBrandedSpinner({
  size = "md",
  label,
  className,
  tone = "default",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Visually hidden label for screen readers. */
  label?: string;
  /** `onDark` keeps the glyph legible on navy / black hero shells. */
  tone?: "default" | "onDark";
}) {
  const dim =
    size === "xs"
      ? "h-4 w-4"
      : size === "sm"
        ? "h-5 w-5"
        : size === "lg"
          ? "h-10 w-10"
          : size === "xl"
            ? "h-14 w-14"
            : "h-7 w-7";

  const inner =
    size === "xs"
      ? "inset-[3px]"
      : size === "sm"
        ? "inset-[4px]"
        : size === "lg"
          ? "inset-[7px]"
          : size === "xl"
            ? "inset-[9px]"
            : "inset-[5px]";

  const outerArc =
    tone === "onDark"
      ? "border-amber-300/75 border-t-transparent"
      : "border-amber-500/70 border-t-transparent dark:border-amber-300/70 dark:border-t-transparent";
  const innerArc =
    tone === "onDark"
      ? "border-amber-200/45 border-b-transparent"
      : "border-amber-600/45 border-b-transparent dark:border-amber-200/55 dark:border-b-transparent";

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("relative inline-flex shrink-0 items-center justify-center", dim, className)}
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full border-2 motion-reduce:hidden animate-[hc-spin_1200ms_linear_infinite]",
          outerArc
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full border-2 motion-reduce:hidden animate-[hc-spin-rev_1600ms_linear_infinite]",
          inner,
          innerArc
        )}
      />
      <span
        aria-hidden
        className={cn(
          "hidden motion-reduce:block h-2 w-2 rounded-full",
          tone === "onDark" ? "bg-amber-300/85" : "bg-amber-500/85 dark:bg-amber-300/85",
          "animate-pulse"
        )}
      />
      <style>{`
        @keyframes hc-spin { to { transform: rotate(360deg); } }
        @keyframes hc-spin-rev { to { transform: rotate(-360deg); } }
      `}</style>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Branded eyebrow label — short, all-caps, amber-tinted.
 * Reserve for one-line contextual labels above titles.
 */
export function PublicEyebrow({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "onDark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.24em]",
        tone === "onDark"
          ? "text-amber-300/85"
          : "text-amber-700 dark:text-amber-300/85",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Calm gradient divider — use between hero and content sections. */
export function PublicDivider({
  tone = "soft",
  className,
}: {
  tone?: "soft" | "amber";
  className?: string;
}) {
  return (
    <hr
      aria-hidden
      className={cn(
        "h-px w-full border-0",
        tone === "amber"
          ? "bg-gradient-to-r from-transparent via-amber-400/55 to-transparent"
          : "bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-white/10",
        className
      )}
    />
  );
}

/**
 * Small branded mark used for premium touches — renders a calm amber pill
 * with a contained icon. Good for trust rows, hero meta, CTA surface accents.
 */
export function PublicBrandMark({
  label,
  icon,
  tone = "default",
  className,
}: {
  label?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "onDark";
  className?: string;
}) {
  const onDark = tone === "onDark";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
        onDark
          ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
          : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300",
        className
      )}
    >
      {icon ? <span className="inline-flex" aria-hidden>{icon}</span> : null}
      {label}
    </span>
  );
}

/**
 * Trust strip — short, premium row of certifications / trust statements.
 * Drop into hero footers or under section headlines.
 */
export function PublicTrustStrip({
  items,
  className,
  tone = "default",
}: {
  items: ReactNode[];
  className?: string;
  tone?: "default" | "onDark";
}) {
  const onDark = tone === "onDark";
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-medium",
        onDark ? "text-white/70" : "text-zinc-600 dark:text-white/70",
        className
      )}
    >
      {items.map((item, idx) => (
        <span key={idx} className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              onDark ? "bg-amber-300/75" : "bg-amber-500/80 dark:bg-amber-300/75"
            )}
          />
          {item}
        </span>
      ))}
    </div>
  );
}

import * as React from "react";
import { cn } from "../lib/cn";

export interface PublicProofItem {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

export interface PublicProofRailProps {
  items: ReadonlyArray<PublicProofItem>;
  /** Optional eyebrow/heading shown above the rail. */
  eyebrow?: React.ReactNode;
  /** Visual density. "tight" = compact strip; "default" = standard card-rail. */
  density?: "tight" | "default";
  /** Surface treatment. "rail" = single bordered strip (no per-item cards); "cards" = subtle per-item dividers. */
  variant?: "rail" | "cards";
  className?: string;
}

const valueSizes: Record<NonNullable<PublicProofRailProps["density"]>, string> = {
  tight: "text-[1.25rem] sm:text-[1.4rem]",
  default: "text-[1.5rem] sm:text-[1.7rem]",
};

export function PublicProofRail({
  items,
  eyebrow,
  density = "default",
  variant = "rail",
  className,
}: PublicProofRailProps) {
  if (items.length === 0) return null;

  const wrapper =
    variant === "rail"
      ? "rounded-[1.5rem] border border-white/10 bg-white/[0.025] px-5 py-5 sm:px-7 sm:py-6"
      : "rounded-[1.5rem] border border-white/10 bg-white/[0.025] divide-y divide-white/10 sm:divide-y-0 sm:divide-x";

  const grid =
    variant === "rail"
      ? "grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-10"
      : `grid grid-cols-2 sm:grid-cols-${Math.min(items.length, 4)}`;

  return (
    <section className={cn("text-[var(--public-foreground,#f5f1eb)]", className)}>
      {eyebrow ? (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] opacity-65">
          {eyebrow}
        </p>
      ) : null}
      <div className={wrapper}>
        <dl className={grid}>
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1",
                variant === "cards" ? "px-5 py-5" : "",
              )}
            >
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] opacity-60">
                {item.label}
              </dt>
              <dd
                className={cn(
                  "font-semibold tracking-tight leading-tight",
                  valueSizes[density],
                )}
              >
                {item.value}
              </dd>
              {item.hint ? (
                <p className="text-[12.5px] leading-relaxed opacity-70">{item.hint}</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

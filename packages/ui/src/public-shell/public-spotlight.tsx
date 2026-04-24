import * as React from "react";
import { cn } from "../lib/cn";

export interface PublicSpotlightProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  /** Inline list of short supporting points (rendered as a clean column, no panels). */
  points?: ReadonlyArray<{ label: React.ReactNode; detail?: React.ReactNode }>;
  /** Right-side aside slot (e.g. quote, list, cta). Replaces points layout when provided. */
  aside?: React.ReactNode;
  /** Inverts surface from default (panel) to a strong contrast band that breaks card monotony. */
  tone?: "panel" | "contrast" | "muted";
  align?: "split" | "center";
  className?: string;
  children?: React.ReactNode;
}

const toneClass: Record<NonNullable<PublicSpotlightProps["tone"]>, string> = {
  panel: "bg-[var(--public-surface,rgba(255,255,255,0.02))] text-[var(--public-foreground,#f5f1eb)]",
  contrast:
    "bg-[linear-gradient(135deg,#0c0a09_0%,#1a1410_55%,#2a1f17_100%)] text-white border border-white/5",
  muted: "bg-[rgba(255,255,255,0.03)] text-[var(--public-foreground,#f5f1eb)] border border-white/5",
};

export function PublicSpotlight({
  eyebrow,
  title,
  body,
  points,
  aside,
  tone = "contrast",
  align = "split",
  className,
  children,
}: PublicSpotlightProps) {
  const surface = toneClass[tone];
  const hasAside = Boolean(aside ?? (points && points.length > 0));
  const layout =
    align === "split" && hasAside
      ? "grid gap-10 lg:grid-cols-[1.25fr,0.85fr] lg:items-center"
      : "max-w-3xl mx-auto text-center";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2.25rem] px-6 py-10 sm:px-10 sm:py-12",
        surface,
        className,
      )}
    >
      <div className={layout}>
        <div className={align === "center" ? "space-y-5" : "space-y-5"}>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] opacity-70">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-balance text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[2.1rem] md:text-[2.4rem]">
            {title}
          </h2>
          {body ? (
            <p className="max-w-2xl text-pretty text-[15px] leading-[1.7] opacity-80 sm:text-base">
              {body}
            </p>
          ) : null}
          {children}
        </div>
        {hasAside ? (
          <div className="space-y-4">
            {aside ??
              (points
                ? points.map((p, i) => (
                    <div
                      key={i}
                      className="border-l border-white/15 pl-4 py-1"
                    >
                      <p className="text-sm font-semibold tracking-tight">{p.label}</p>
                      {p.detail ? (
                        <p className="mt-1 text-sm leading-relaxed opacity-75">{p.detail}</p>
                      ) : null}
                    </div>
                  ))
                : null)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Public design system — the section-rhythm scaffold (V3-PUBLIC-DESIGN-01).
 *
 * `Section` is THE "one breath per section" primitive: one vertical-rhythm band +
 * one centered measure. `SectionHeader` is the standard opener (eyebrow → heading →
 * one lede). `Reveal` is the dependency-free motion wrapper; `Hairline` the
 * editorial rule. All server-safe.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "../cn";
import { Eyebrow, DisplayHeading, Lede, type DisplaySize } from "./typography";

type Width = "default" | "prose" | "wide";
const WIDTH_CLASS: Record<Width, string> = {
  default: "",
  prose: "home-shell-prose",
  wide: "home-shell-wide",
};

type Rhythm = "default" | "tight" | "hero";
const RHYTHM_CLASS: Record<Rhythm, string> = {
  default: "home-section",
  tight: "home-section-tight",
  hero: "home-section-hero",
};

/**
 * One-breath section: a single vertical-rhythm band wrapping a centered measure.
 * `tone="sunken"` paints the alternating deep-canvas band (use sparingly to mark a
 * chapter, not on every section). Compose ONE point per Section.
 */
export function Section({
  id,
  children,
  className,
  innerClassName,
  width = "default",
  rhythm = "default",
  tone = "default",
  as: As = "section",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  width?: Width;
  rhythm?: Rhythm;
  tone?: "default" | "sunken";
  as?: ElementType;
}) {
  return (
    <As
      id={id}
      className={cn(
        RHYTHM_CLASS[rhythm],
        tone === "sunken" && "bg-[color:var(--home-canvas-deep)]",
        className,
      )}
    >
      <div className={cn("home-shell", WIDTH_CLASS[width], innerClassName)}>{children}</div>
    </As>
  );
}

/** Eyebrow + heading + one lede — the standard section opener. All text via props. */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  level = 2,
  size = "display",
  align = "start",
  headingId,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  level?: 1 | 2 | 3 | 4;
  size?: DisplaySize;
  align?: "start" | "center";
  headingId?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <DisplayHeading level={level} size={size} id={headingId}>
        {title}
      </DisplayHeading>
      {lede ? <Lede>{lede}</Lede> : null}
    </header>
  );
}

/** Full-width editorial hairline that flips with the canvas. */
export function Hairline({ className }: { className?: string }) {
  return <hr className={cn("home-hairline", className)} />;
}

/**
 * Reveal — calm entrance motion, pure CSS (no JS, SSR-safe, reduced-motion-aware).
 * `mode="reveal"` (default) = scroll-triggered via the system's scroll-driven
 * timeline (progressive enhancement). `mode="rise"` = a one-time load entrance;
 * pass `delay` (1–6) to stagger siblings. Content is never trapped invisible.
 */
export function Reveal({
  children,
  className,
  mode = "reveal",
  delay,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  mode?: "reveal" | "rise";
  delay?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: ElementType;
}) {
  return (
    <As
      className={cn(
        mode === "rise" ? "home-rise" : "home-reveal",
        mode === "rise" && delay ? `home-delay-${delay}` : "",
        className,
      )}
    >
      {children}
    </As>
  );
}

/**
 * Public design system — typography primitives (V3-PUBLIC-DESIGN-01).
 *
 * Thin, server-safe wrappers over the `--home-*` type-scale utility classes
 * (packages/ui/src/styles/public-design.css). They exist so routes never hand-roll
 * font sizes/weights and so the document outline (heading level) stays decoupled
 * from the visual tier (size) — the audit's #1 hierarchy fault.
 *
 * All copy arrives via props → i18n-ready, zero hardcoded strings.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "../cn";

/** Uppercase tracked label above a heading. Discipline: at most 2–3 per page. */
export function Eyebrow({
  children,
  className,
  as: As = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <As className={cn("home-eyebrow", className)}>{children}</As>;
}

export type DisplaySize = "xl" | "display" | "headline" | "title";

const DISPLAY_CLASS: Record<DisplaySize, string> = {
  xl: "home-display-xl",
  display: "home-display",
  headline: "home-headline",
  title: "home-title",
};

/**
 * Editorial serif heading. `level` sets the semantic tag (h1–h4) for a11y/SEO;
 * `size` sets the visual tier. Keep them decoupled so the outline and the scale
 * are each correct. Exactly one display tier per section (one breath).
 */
export function DisplayHeading({
  level = 2,
  size = "display",
  children,
  className,
  id,
}: {
  level?: 1 | 2 | 3 | 4;
  size?: DisplaySize;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const Tag = `h${level}` as ElementType;
  return (
    <Tag id={id} className={cn(DISPLAY_CLASS[size], className)}>
      {children}
    </Tag>
  );
}

/** The single calm sub-line under a heading. One sentence — words are expensive. */
export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("home-lede", className)}>{children}</p>;
}

/** Body copy on the public canvas. */
export function Body({
  children,
  className,
  size = "base",
}: {
  children: ReactNode;
  className?: string;
  size?: "base" | "sm";
}) {
  return <p className={cn(size === "sm" ? "home-body-sm" : "home-body", className)}>{children}</p>;
}

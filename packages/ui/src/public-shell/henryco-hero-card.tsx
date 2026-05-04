"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "../lib/cn";

/**
 * HenryCoHeroCard — the first card on the landing page hero across every
 * HenryCo public surface (hub, care, marketplace, property, studio, jobs,
 * learn, logistics).
 *
 * Why this primitive exists:
 *   - The same first-card slot was previously hand-rolled in every app, with
 *     different mobile breakpoints, different hover behaviours, and different
 *     overflow guarantees. Owner flagged the result as "rough" on small
 *     viewports — sticky hover state after touch on division cards (notably
 *     /care) and clipped/cramped headlines on hub.
 *   - This primitive consolidates the surface so every division renders the
 *     hero card with identical mobile-first composition, identical tap
 *     behaviour, identical motion (henrycoHeroEnter / henrycoCardLift), and
 *     identical accessibility guarantees.
 *
 * Mobile-first guarantees:
 *   - typography uses clamp() so the title cannot clip on 320px viewports
 *   - [overflow-wrap:break-word] + hyphens prevent first-letter bleed
 *   - interactive states use :active for touch (no hover-stuck after tap)
 *   - hover affordances only activate on @media (hover: hover) pointer:fine
 *   - prefers-reduced-motion shuts off lift + entry cleanly
 */

type HeroCardTone = "spotlight" | "panel" | "contrast" | "ink";

const TONE: Record<HeroCardTone, string> = {
  spotlight:
    "border border-white/12 bg-[linear-gradient(135deg,rgba(214,168,81,0.10)_0%,rgba(20,16,12,0.55)_100%)] text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]",
  panel:
    "border border-white/10 bg-white/[0.04] text-white shadow-[0_22px_70px_-30px_rgba(0,0,0,0.45)]",
  contrast:
    "border border-white/8 bg-[linear-gradient(135deg,#0c0a09_0%,#1a1410_55%,#2a1f17_100%)] text-white shadow-[0_30px_90px_-30px_rgba(0,0,0,0.6)]",
  ink: "border border-zinc-200/80 bg-white text-zinc-950 shadow-[0_22px_60px_-32px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-[#0b1018]/85 dark:text-white",
};

export interface HenryCoHeroCardProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  rows?: ReadonlyArray<{
    key?: string;
    icon?: React.ReactNode;
    label: React.ReactNode;
    value?: React.ReactNode;
    detail?: React.ReactNode;
  }>;
  bullets?: ReadonlyArray<React.ReactNode>;
  brandMark?: React.ReactNode;
  primaryCta?: { label: React.ReactNode; href?: string; onClick?: () => void };
  secondaryCta?: { label: React.ReactNode; href?: string; onClick?: () => void };
  footer?: React.ReactNode;
  accentVar?: string;
  tone?: HeroCardTone;
  className?: string;
  id?: string;
  ariaLabel?: string;
  /** Optional eyebrow line shown above the eyebrow row, e.g. "Welcome back, X". */
  signedInEyebrow?: React.ReactNode;
}

export function HenryCoHeroCard({
  eyebrow,
  title,
  body,
  rows,
  bullets,
  brandMark,
  primaryCta,
  secondaryCta,
  footer,
  accentVar = "var(--accent, #c9a227)",
  tone = "spotlight",
  className,
  id,
  ariaLabel,
  signedInEyebrow,
}: HenryCoHeroCardProps) {
  const accentStyle = { ["--henryco-hero-accent" as never]: accentVar } as React.CSSProperties;
  // Mount-flip pattern: avoids needing global @keyframes. The card paints
  // initial-state on SSR, then on first browser frame flips data-mounted to
  // true, triggering a clean opacity+translate transition. prefers-reduced-
  // motion is honoured purely in CSS via .henryco-hero-card[data-motion="reduce"].
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  React.useEffect(() => {
    mountHeroCardStyles();
  }, []);

  return (
    <>
      <section
        id={id}
        aria-label={ariaLabel}
        style={accentStyle}
        data-henryco-hero-card={tone}
        data-mounted={mounted ? "true" : "false"}
        className={cn(
          "henryco-hero-card",
          "relative isolate w-full overflow-hidden",
          "rounded-[1.6rem] sm:rounded-[2rem] md:rounded-[2.4rem]",
          "p-5 sm:p-7 md:p-9",
          TONE[tone],
          className,
        )}
      >
        {signedInEyebrow ? (
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
            {signedInEyebrow}
          </p>
        ) : null}

        {(eyebrow || brandMark) ? (
          <div className="flex items-start justify-between gap-4">
            {eyebrow ? (
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--henryco-hero-accent)]">
                {eyebrow}
              </p>
            ) : (
              <span aria-hidden />
            )}
            {brandMark ? <div className="shrink-0">{brandMark}</div> : null}
          </div>
        ) : null}

        <h2
          className={cn(
            "henryco-hero-card-title text-balance text-white",
            "[overflow-wrap:break-word] hyphens-auto",
            eyebrow || brandMark ? "mt-3" : "",
          )}
        >
          {title}
        </h2>

        {body ? (
          <p className="mt-3 max-w-md text-pretty text-sm leading-7 text-white/72 sm:text-[15px] sm:leading-[1.7]">
            {body}
          </p>
        ) : null}

        {bullets && bullets.length ? (
          <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {bullets.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-3 py-2.5 text-sm leading-6 text-white/82"
              >
                <span
                  aria-hidden
                  className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--henryco-hero-accent)]"
                />
                <span className="min-w-0 flex-1">{line}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {rows && rows.length ? (
          <dl className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {rows.map((row, i) => (
              <div
                key={row.key ?? i}
                className="flex items-baseline gap-3 py-3 text-sm"
              >
                {row.icon ? (
                  <span className="text-[color:var(--henryco-hero-accent)]">
                    {row.icon}
                  </span>
                ) : null}
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {row.label}
                </dt>
                <dd className="ml-auto min-w-0 max-w-[60%] text-right text-sm font-semibold tracking-tight text-white [overflow-wrap:anywhere]">
                  {row.value}
                  {row.detail ? (
                    <span className="ml-2 text-[11px] font-medium text-white/55">
                      {row.detail}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {(primaryCta || secondaryCta) ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {primaryCta ? <HeroCardCta tone="primary" cta={primaryCta} /> : null}
            {secondaryCta ? <HeroCardCta tone="secondary" cta={secondaryCta} /> : null}
          </div>
        ) : null}

        {footer ? (
          <div className="mt-6 border-t border-white/10 pt-4 text-[11.5px] leading-5 text-white/52">
            {footer}
          </div>
        ) : null}
      </section>
    </>
  );
}

function HeroCardCta({
  cta,
  tone,
}: {
  cta: NonNullable<HenryCoHeroCardProps["primaryCta"]>;
  tone: "primary" | "secondary";
}) {
  const className = cn(
    "henryco-hero-cta",
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none",
    "active:translate-y-[0.5px]",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--henryco-hero-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
    tone === "primary"
      ? "bg-[color:var(--henryco-hero-accent)] text-black hover:opacity-90"
      : "border border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.10] hover:border-white/35",
  );
  if (cta.href) {
    return (
      <Link
        href={cta.href}
        className={className}
        aria-label={typeof cta.label === "string" ? cta.label : undefined}
      >
        {cta.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className={className}>
      {cta.label}
    </button>
  );
}

/**
 * HenryCoTactileCard — interactive card that respects touch devices.
 *
 * Use this for division-grid cards, persona-path cards, or any card where
 * the entire surface is a navigation target. The hover lift only fires on
 * @media (hover: hover) pointer:fine, so on touch devices there is no
 * stuck-hover state after release. :active / :focus-visible give the
 * touch press its own feedback.
 */
export function HenryCoTactileCard({
  href,
  onClick,
  children,
  className,
  ariaLabel,
  asChild = false,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  asChild?: boolean;
}) {
  const classes = cn(
    "henryco-tactile-card",
    "group relative isolate flex flex-col justify-between overflow-hidden",
    "rounded-[1.4rem] sm:rounded-[1.6rem]",
    "border border-white/10 bg-white/[0.03] p-4 sm:p-5",
    "transition outline-none",
    "active:translate-y-[0.5px] active:bg-white/[0.06]",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--accent,#c9a227)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
    className,
  );
  React.useEffect(() => {
    mountHeroCardStyles();
  }, []);
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={classes}>
        {children}
      </Link>
    );
  }
  if (asChild) {
    return (
      <span aria-label={ariaLabel} className={classes}>
        {children}
      </span>
    );
  }
  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

/**
 * Singleton stylesheet mount. Browser-only. Idempotent via a stable id so
 * multiple HeroCard / TactileCard instances inject the rules exactly once.
 *
 * Why a DOM mount instead of an inline `<style>` element in JSX:
 * an inline `<style>` rendered inside an `<a>` (Link) or `<button>` is
 * invalid HTML; some browsers / RSC streamers serialize the rule text as
 * visible text content. CHROME-01A audit caught this leak on /about.
 */
const HERO_CARD_STYLE_ID = "henryco-hero-card-styles";

function mountHeroCardStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(HERO_CARD_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HERO_CARD_STYLE_ID;
  style.setAttribute("data-henryco-hero-card-styles", "");
  style.appendChild(document.createTextNode(HENRYCO_HERO_CARD_CSS));
  document.head.appendChild(style);
}

const HENRYCO_HERO_CARD_CSS = `
.henryco-hero-card {
  /* Entry — opacity + tiny rise. Mount-flip pattern. */
  opacity: 0;
  transform: translate3d(0, 8px, 0);
  transition:
    opacity 600ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}
.henryco-hero-card[data-mounted="true"] {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
.henryco-hero-card-title {
  /* henrycoHeroEnter typography — display weight, clamp so 320px never
     clips, no manual line breaks needed. */
  font-size: clamp(1.5rem, 4.6vw + 0.5rem, 2.1rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 600;
  font-family:
    var(--font-display, "Iowan Old Style"),
    "Iowan Old Style",
    "Baskerville Old Face",
    Baskerville,
    "Palatino Linotype",
    "Book Antiqua",
    "Times New Roman",
    serif;
}
@media (min-width: 640px) {
  .henryco-hero-card-title {
    font-size: clamp(1.7rem, 2.6vw + 0.6rem, 2.3rem);
    line-height: 1.08;
    letter-spacing: -0.025em;
  }
}

/* Tactile card — hover lift scoped to fine pointers only. This is the
   single most important rule: touch devices never see hover-stuck. */
@media (hover: hover) and (pointer: fine) {
  .henryco-tactile-card {
    transition:
      transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
      border-color 200ms ease-out,
      background-color 200ms ease-out;
  }
  .henryco-tactile-card:hover {
    border-color: color-mix(in srgb, var(--accent, #c9a227) 40%, transparent);
    background-color: rgba(255, 255, 255, 0.06);
    transform: translate3d(0, -2px, 0);
  }
}

/* Reduced motion — disable lift + entry cleanly. */
@media (prefers-reduced-motion: reduce) {
  .henryco-hero-card,
  .henryco-tactile-card {
    transition: none !important;
    transform: none !important;
  }
  .henryco-hero-card[data-mounted="false"] {
    opacity: 1 !important;
  }
}
`;

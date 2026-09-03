/**
 * DivisionLanding — the page-level composer for division overviews.
 *
 * ACCOUNT-PREMIUM-01, Phase 2.
 *
 * One layout, every division. Replaces the boilerplate of
 *   <div className="acct-<div> acct-fade-in">
 *     <{DivHero}/>
 *     <section aria-labelledby="..."><div className="...__section-head">...</div>...</section>
 *     <section>...</section>
 *     <section>...</section>
 *   </div>
 * with a typed, semantic composer that holds the section grammar in
 * exactly one place.
 *
 * The composer DOES NOT render hero or sections directly — it lays out
 * the regions. Each region is a render-prop slot: hero, nextStep, metrics,
 * sections (an array of { title, meta, content }). Anything not provided
 * is omitted (no empty section heads, no orphan margin).
 *
 * Why a slot-based composer (not a fully prescriptive one)? Because each
 * division renders specialized content (care bookings dashboard, marketplace
 * orders, learn courses). The composer doesn't know what a "booking" is —
 * it knows what a "section with a head + content" is. Callers compose
 * the actual data renders inside each section.
 *
 * Sections rule of thumb: 0-5 sections, in order of declining urgency.
 * Each section has a kicker title (h2) and an optional meta line on the
 * right (e.g. "12 active · 3 paid").
 */

import type { ReactNode } from "react";

export type DivisionLandingSection = {
  /** Unique key for React reconciliation. */
  id: string;
  /** Section title — short, sentence case. */
  title: string;
  /** Meta line on the right — e.g. "12 active · 3 paid". */
  meta?: string | null;
  /** Section body — caller renders the data list / grid / card. */
  content: ReactNode;
  /** Aria-labelledby anchor; defaults to id. */
  ariaLabel?: string;
};

export type DivisionLandingProps = {
  /** The hero band — usually <HeroCard /> rendered by the caller. */
  hero?: ReactNode;
  /** Optional next-step row sitting under the hero. */
  nextStep?: ReactNode;
  /** Optional metric strip under the next-step. */
  metrics?: ReactNode;
  /** Sections in render order. */
  sections?: ReadonlyArray<DivisionLandingSection>;
  /** Additional footer / trailing slot (rare). */
  footer?: ReactNode;
  /** Pass-through className for animation hooks (e.g. `acct-fade-in`). */
  className?: string;
};

export function DivisionLanding({
  hero,
  nextStep,
  metrics,
  sections,
  footer,
  className,
}: DivisionLandingProps) {
  const wrapperClass = ["acct-division-landing", className].filter(Boolean).join(" ");

  return (
    <div className={wrapperClass}>
      {hero}
      {nextStep}
      {metrics}
      {sections && sections.length > 0
        ? sections.map((section) => (
            <section
              key={section.id}
              /* The section carries its own id so in-page anchors
                 (#<section.id>) land here — scroll-margin in surfaces.css
                 clears the sticky chrome (redesign 2026-07-08). */
              id={section.id}
              className="acct-division-landing__section"
              aria-labelledby={`section-head-${section.id}`}
              aria-label={section.ariaLabel}
            >
              <div className="acct-division-landing__section-head">
                <h2
                  id={`section-head-${section.id}`}
                  className="acct-division-landing__section-title"
                >
                  {section.title}
                </h2>
                {section.meta ? (
                  <span className="acct-division-landing__section-meta">{section.meta}</span>
                ) : null}
              </div>
              {section.content}
            </section>
          ))
        : null}
      {footer}
    </div>
  );
}

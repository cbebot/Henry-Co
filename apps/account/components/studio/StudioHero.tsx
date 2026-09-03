import { ArrowUpRight } from "lucide-react";
import {
  formatAccountTemplate,
  translateSurfaceLabel,
  type AccountCopy,
  type AppLocale,
} from "@henryco/i18n";

import { heroState, STUDIO_ORIGIN, type StudioStats } from "./helpers";

type StudioCopy = AccountCopy["divisionStudio"];

type Props = {
  stats: StudioStats;
  locale?: AppLocale;
  copy: StudioCopy;
};

type ResolvedHero = {
  headline: string;
  blurb: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
};

function pluralPick(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function resolveHero(stats: StudioStats, copy: StudioCopy): ResolvedHero {
  const state = heroState(stats);
  const slice = copy.hero.state;

  if (state === "empty") {
    return {
      headline: slice.empty.headline,
      blurb: slice.empty.blurb,
      ctaPrimary: { label: slice.empty.ctaPrimary, href: `${STUDIO_ORIGIN}/request` },
      ctaSecondary: { label: slice.empty.ctaSecondary, href: STUDIO_ORIGIN },
    };
  }

  if (state === "attention") {
    const count = stats.overduePayments;
    return {
      headline: formatAccountTemplate(
        pluralPick(count, slice.attention.headlineTemplateSingular, slice.attention.headlineTemplatePlural),
        { count },
      ),
      blurb: slice.attention.blurb,
      ctaPrimary: { label: slice.attention.ctaPrimary, href: "#studio-payments" },
      ctaSecondary: { label: slice.attention.ctaSecondary, href: STUDIO_ORIGIN },
    };
  }

  if (state === "active") {
    if (stats.readyReview > 0) {
      const count = stats.readyReview;
      return {
        headline: formatAccountTemplate(
          pluralPick(count, slice.activeReady.headlineTemplateSingular, slice.activeReady.headlineTemplatePlural),
          { count },
        ),
        blurb: slice.activeReady.blurb,
        ctaPrimary: { label: slice.activeReady.ctaPrimary, href: "#studio-projects" },
        ctaSecondary: { label: slice.activeReady.ctaSecondary, href: STUDIO_ORIGIN },
      };
    }
    const count = stats.metrics.activeProjects;
    return {
      headline: formatAccountTemplate(
        pluralPick(count, slice.activeProjects.headlineTemplateSingular, slice.activeProjects.headlineTemplatePlural),
        { count },
      ),
      blurb: slice.activeProjects.blurb,
      ctaPrimary: { label: slice.activeProjects.ctaPrimary, href: STUDIO_ORIGIN },
      ctaSecondary: { label: slice.activeProjects.ctaSecondary, href: `${STUDIO_ORIGIN}/request` },
    };
  }

  const count = stats.totalProjects;
  return {
    headline: formatAccountTemplate(
      pluralPick(count, slice.calm.headlineTemplateSingular, slice.calm.headlineTemplatePlural),
      { count },
    ),
    blurb: slice.calm.blurb,
    ctaPrimary: { label: slice.calm.ctaPrimary, href: STUDIO_ORIGIN },
    ctaSecondary: { label: slice.calm.ctaSecondary, href: `${STUDIO_ORIGIN}/request` },
  };
}

export function StudioHero({ stats, locale = "en", copy }: Props) {
  const state = heroState(stats);
  const hero = resolveHero(stats, copy);
  // translateSurfaceLabel remains for any free-form fallback that escapes the slice.
  void translateSurfaceLabel;
  void locale;

  const breakdown = [
    { key: "active",   label: copy.hero.breakdown.active,         count: stats.metrics.activeProjects, color: "var(--acct-gold)" },
    { key: "review",   label: copy.hero.breakdown.readyReview,    count: stats.readyReview,            color: "var(--acct-blue)" },
    { key: "pending",  label: copy.hero.breakdown.pendingPayment, count: stats.metrics.pendingPayments, color: "var(--acct-purple)" },
    { key: "proof",    label: copy.hero.breakdown.proofSubmitted, count: stats.metrics.proofSubmitted, color: "var(--acct-green)" },
  ].filter((row) => row.count > 0);

  return (
    <section className="acct-stu__hero" data-state={state} aria-label={copy.hero.overviewAriaLabel}>
      <div className="acct-stu__hero-inner">
        <div>
          <span className="acct-stu__eyebrow">
            <span className="acct-stu__eyebrow-dot" aria-hidden />
            {copy.hero.eyebrowLive}
          </span>
          <h1 className="acct-stu__headline">{hero.headline}</h1>
          <p className="acct-stu__blurb">{hero.blurb}</p>
          <div className="acct-stu__hero-ctas">
            <a
              className="acct-stu__cta acct-stu__cta--primary"
              href={hero.ctaPrimary.href}
              target={hero.ctaPrimary.href.startsWith("#") ? undefined : "_blank"}
              rel={hero.ctaPrimary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {hero.ctaPrimary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a
              className="acct-stu__cta acct-stu__cta--ghost"
              href={hero.ctaSecondary.href}
              target={hero.ctaSecondary.href.startsWith("#") ? undefined : "_blank"}
              rel={hero.ctaSecondary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {hero.ctaSecondary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-stu__hero-tiles" role="list" aria-label={copy.hero.activityAriaLabel}>
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">{copy.hero.tiles.activeLabel}</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.activeProjects}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.activeProjects === 0
                  ? copy.hero.tiles.activeFootEmpty
                  : copy.hero.tiles.activeFootHasValue}
              </span>
            </div>
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">{copy.hero.tiles.pendingLabel}</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.pendingPayments}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.pendingPayments === 0
                  ? copy.hero.tiles.pendingFootEmpty
                  : copy.hero.tiles.pendingFootHasValue}
              </span>
            </div>
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">{copy.hero.tiles.proofLabel}</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.proofSubmitted}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.proofSubmitted === 0
                  ? copy.hero.tiles.proofFootEmpty
                  : copy.hero.tiles.proofFootHasValue}
              </span>
            </div>
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">{copy.hero.tiles.deliverablesLabel}</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.deliverables}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.deliverables === 0
                  ? copy.hero.tiles.deliverablesFootEmpty
                  : copy.hero.tiles.deliverablesFootHasValue}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-stu__hero-side" aria-label={copy.hero.sideAriaLabel}>
          <p className="acct-stu__hero-side-label">{copy.hero.sideLabel}</p>
          <p className="acct-stu__hero-side-title">{copy.hero.sideTitle}</p>
          <p className="acct-stu__hero-side-body">{copy.hero.sideBody}</p>
          {breakdown.length > 0 ? (
            <div className="acct-stu__hero-breakdown" aria-label={copy.hero.breakdownAriaLabel}>
              <p className="acct-stu__hero-breakdown-label">{copy.hero.breakdownLabel}</p>
              {breakdown.map((row) => (
                <div key={row.key} className="acct-stu__hero-breakdown-row">
                  <span className="acct-stu__hero-breakdown-name">
                    <span
                      className="acct-stu__hero-breakdown-dot"
                      style={{ background: row.color }}
                      aria-hidden
                    />
                    {row.label}
                  </span>
                  <span className="acct-stu__hero-breakdown-count">{row.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

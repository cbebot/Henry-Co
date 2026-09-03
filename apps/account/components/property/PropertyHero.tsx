import { ArrowUpRight } from "lucide-react";

import { formatAccountTemplate } from "@henryco/i18n";

import {
  activityBreakdown,
  heroState,
  type PropertyStats,
} from "./helpers";

type BreakdownLabels = {
  saved: string;
  inquiries: string;
  viewings: string;
  listings: string;
};

export type PropertyHeroCopy = {
  eyebrow: string;
  ariaLabel: string;
  browseListingsCta: string;
  savedShortlistCta: string;
  tilesAriaLabel: string;
  tileLabels: {
    saved: string;
    inquiries: string;
    viewings: string;
    listings: string;
  };
  tileFoot: {
    savedManagedTemplate: string;
    savedEmpty: string;
    savedWith: string;
    inquiriesEmpty: string;
    inquiriesWith: string;
    viewingsEmpty: string;
    viewingsWith: string;
    listingsEmpty: string;
    listingsWith: string;
  };
  sideAriaLabel: string;
  sideKicker: string;
  sideTitle: string;
  sideBody: string;
  sideBodyMuted: string;
  breakdownAriaLabel: string;
  breakdownLabel: string;
  breakdownLabels: BreakdownLabels;
  state: {
    empty: {
      headline: string;
      blurb: string;
    };
    discover: {
      headlineTemplateSingular: string;
      headlineTemplatePlural: string;
      blurb: string;
    };
    active: {
      viewingHeadlineTemplateSingular: string;
      viewingHeadlineTemplatePlural: string;
      inquiryHeadlineTemplateSingular: string;
      inquiryHeadlineTemplatePlural: string;
      blurb: string;
    };
  };
};

type Props = {
  stats: PropertyStats;
  propertyOrigin: string;
  copy: PropertyHeroCopy;
};

function buildHeadline(state: ReturnType<typeof heroState>, stats: PropertyStats, copy: PropertyHeroCopy): string {
  if (state === "empty") return copy.state.empty.headline;
  if (state === "active") {
    if (stats.viewings > 0) {
      return formatAccountTemplate(
        stats.viewings === 1
          ? copy.state.active.viewingHeadlineTemplateSingular
          : copy.state.active.viewingHeadlineTemplatePlural,
        { count: stats.viewings },
      );
    }
    return formatAccountTemplate(
      stats.inquiries === 1
        ? copy.state.active.inquiryHeadlineTemplateSingular
        : copy.state.active.inquiryHeadlineTemplatePlural,
      { count: stats.inquiries },
    );
  }
  return formatAccountTemplate(
    stats.saved === 1
      ? copy.state.discover.headlineTemplateSingular
      : copy.state.discover.headlineTemplatePlural,
    { count: stats.saved },
  );
}

function buildBlurb(state: ReturnType<typeof heroState>, copy: PropertyHeroCopy): string {
  if (state === "empty") return copy.state.empty.blurb;
  if (state === "active") return copy.state.active.blurb;
  return copy.state.discover.blurb;
}

export function PropertyHero({ stats, propertyOrigin, copy }: Props) {
  const state = heroState(stats);
  const headline = buildHeadline(state, stats, copy);
  const blurb = buildBlurb(state, copy);
  const breakdown = activityBreakdown(stats, copy.breakdownLabels);

  const savedFoot =
    stats.managed > 0
      ? formatAccountTemplate(copy.tileFoot.savedManagedTemplate, { count: stats.managed })
      : stats.saved === 0
        ? copy.tileFoot.savedEmpty
        : copy.tileFoot.savedWith;

  return (
    <section className="acct-prop__hero" data-state={state} aria-label={copy.ariaLabel}>
      <div className="acct-prop__hero-inner">
        <div>
          <span className="acct-prop__eyebrow">
            <span className="acct-prop__eyebrow-dot" aria-hidden />
            {copy.eyebrow}
          </span>
          <h1 className="acct-prop__headline">{headline}</h1>
          <p className="acct-prop__blurb">{blurb}</p>
          <div className="acct-prop__hero-ctas">
            <a
              className="acct-prop__cta acct-prop__cta--primary"
              href={propertyOrigin}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.browseListingsCta} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a className="acct-prop__cta acct-prop__cta--ghost" href="/property/saved">
              {copy.savedShortlistCta} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-prop__hero-tiles" role="list" aria-label={copy.tilesAriaLabel}>
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">{copy.tileLabels.saved}</span>
              <span className="acct-prop__hero-tile-value">{stats.saved}</span>
              <span className="acct-prop__hero-tile-foot">{savedFoot}</span>
            </div>
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">{copy.tileLabels.inquiries}</span>
              <span className="acct-prop__hero-tile-value">{stats.inquiries}</span>
              <span className="acct-prop__hero-tile-foot">
                {stats.inquiries === 0 ? copy.tileFoot.inquiriesEmpty : copy.tileFoot.inquiriesWith}
              </span>
            </div>
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">{copy.tileLabels.viewings}</span>
              <span className="acct-prop__hero-tile-value">{stats.viewings}</span>
              <span className="acct-prop__hero-tile-foot">
                {stats.viewings === 0 ? copy.tileFoot.viewingsEmpty : copy.tileFoot.viewingsWith}
              </span>
            </div>
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">{copy.tileLabels.listings}</span>
              <span className="acct-prop__hero-tile-value">{stats.listings}</span>
              <span className="acct-prop__hero-tile-foot">
                {stats.listings === 0 ? copy.tileFoot.listingsEmpty : copy.tileFoot.listingsWith}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-prop__hero-side" aria-label={copy.sideAriaLabel}>
          <p className="acct-prop__hero-side-label">{copy.sideKicker}</p>
          <p className="acct-prop__hero-side-title">{copy.sideTitle}</p>
          <p className="acct-prop__hero-side-body">{copy.sideBody}</p>
          <p className="acct-prop__hero-side-body acct-prop__hero-side-body--muted">
            {copy.sideBodyMuted}
          </p>
          {breakdown.length > 0 ? (
            <div className="acct-prop__hero-breakdown" aria-label={copy.breakdownAriaLabel}>
              <p className="acct-prop__hero-breakdown-label">{copy.breakdownLabel}</p>
              {breakdown.map((row) => (
                <div key={row.key} className="acct-prop__hero-breakdown-row">
                  <span className="acct-prop__hero-breakdown-name">
                    <span
                      className="acct-prop__hero-breakdown-dot"
                      style={{ background: row.color }}
                      aria-hidden
                    />
                    {row.label}
                  </span>
                  <span className="acct-prop__hero-breakdown-count">{row.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

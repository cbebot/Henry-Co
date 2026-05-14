import { ArrowUpRight } from "lucide-react";

import {
  activityBreakdown,
  buildBlurb,
  buildHeadline,
  heroState,
  type PropertyStats,
} from "./helpers";

type Props = {
  stats: PropertyStats;
  propertyOrigin: string;
};

export function PropertyHero({ stats, propertyOrigin }: Props) {
  const state = heroState(stats);
  const headline = buildHeadline(state, stats);
  const blurb = buildBlurb(state);
  const breakdown = activityBreakdown(stats);

  return (
    <section className="acct-prop__hero" data-state={state} aria-label="Property overview">
      <div className="acct-prop__hero-inner">
        <div>
          <span className="acct-prop__eyebrow">
            <span className="acct-prop__eyebrow-dot" aria-hidden />
            Property · live
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
              Browse listings <ArrowUpRight size={14} aria-hidden />
            </a>
            <a className="acct-prop__cta acct-prop__cta--ghost" href="/property/saved">
              Saved shortlist <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-prop__hero-tiles" role="list" aria-label="Property activity">
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">Saved</span>
              <span className="acct-prop__hero-tile-value">{stats.saved}</span>
              <span className="acct-prop__hero-tile-foot">
                {stats.managed > 0
                  ? `${stats.managed} HenryCo-managed`
                  : stats.saved === 0
                    ? "Save listings to build a shortlist"
                    : "Compare and revisit anytime"}
              </span>
            </div>
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">Inquiries</span>
              <span className="acct-prop__hero-tile-value">{stats.inquiries}</span>
              <span className="acct-prop__hero-tile-foot">
                {stats.inquiries === 0 ? "No conversations open yet" : "Follow-ups land in this room"}
              </span>
            </div>
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">Viewings</span>
              <span className="acct-prop__hero-tile-value">{stats.viewings}</span>
              <span className="acct-prop__hero-tile-foot">
                {stats.viewings === 0 ? "Request a viewing on a saved home" : "Confirmations sync across devices"}
              </span>
            </div>
            <div className="acct-prop__hero-tile" role="listitem">
              <span className="acct-prop__hero-tile-label">Listings</span>
              <span className="acct-prop__hero-tile-value">{stats.listings}</span>
              <span className="acct-prop__hero-tile-foot">
                {stats.listings === 0 ? "Submit a listing on Property" : "Moderation outcomes mirror here"}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-prop__hero-side" aria-label="How this room works">
          <p className="acct-prop__hero-side-label">How this room works</p>
          <p className="acct-prop__hero-side-title">Discover on Property, follow up here.</p>
          <p className="acct-prop__hero-side-body">
            Save a listing, request a viewing, or open an inquiry on HenryCo
            Property — every action mirrors into this account room so you can
            pick up where you left off across devices.
          </p>
          <p className="acct-prop__hero-side-body acct-prop__hero-side-body--muted">
            HenryCo-managed listings flag with a Managed badge — review,
            inspection, and lease follow-ups are coordinated by the Property
            team.
          </p>
          {breakdown.length > 0 ? (
            <div className="acct-prop__hero-breakdown" aria-label="Activity breakdown">
              <p className="acct-prop__hero-breakdown-label">By activity</p>
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

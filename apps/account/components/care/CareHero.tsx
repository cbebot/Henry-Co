import { ArrowUpRight } from "lucide-react";

import { heroState, type CareStats } from "./helpers";

type Props = {
  stats: CareStats;
  labels: {
    eyebrow: string;
    sideKicker: string;
    sideTitle: string;
    sideBody: string;
    breakdownLabel: string;
    tilesAriaLabel: string;
    tileLabels: {
      total: string;
      inFlight: string;
      payment: string;
      completed: string;
    };
    tileFoot: {
      totalEmpty: string;
      totalWith: (n: number) => string;
      inFlightEmpty: string;
      inFlightWith: string;
      paymentEmpty: string;
      paymentWith: string;
      completedEmpty: string;
      completedWith: string;
    };
    breakdownLabels: {
      inFlight: string;
      scheduled: string;
      payment: string;
      completed: string;
    };
    headline: string;
    blurb: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
  };
};

export function CareHero({ stats, labels }: Props) {
  const state = heroState(stats);

  const breakdown = [
    { key: "inFlight",  label: labels.breakdownLabels.inFlight,  count: stats.inFlight,    color: "var(--acct-gold)" },
    { key: "scheduled", label: labels.breakdownLabels.scheduled, count: stats.scheduled,   color: "var(--acct-blue)" },
    { key: "payment",   label: labels.breakdownLabels.payment,   count: stats.needsPayment, color: "var(--acct-red)" },
    { key: "completed", label: labels.breakdownLabels.completed, count: stats.completed,    color: "var(--acct-green)" },
  ].filter((row) => row.count > 0);

  return (
    <section className="acct-care__hero" data-state={state} aria-label={labels.eyebrow}>
      <div className="acct-care__hero-inner">
        <div>
          <span className="acct-care__eyebrow">
            <span className="acct-care__eyebrow-dot" aria-hidden />
            {labels.eyebrow}
          </span>
          <h1 className="acct-care__headline">{labels.headline}</h1>
          <p className="acct-care__blurb">{labels.blurb}</p>
          <div className="acct-care__hero-ctas">
            <a
              className="acct-care__cta acct-care__cta--primary"
              href={labels.ctaPrimary.href}
              target={labels.ctaPrimary.href.startsWith("#") ? undefined : "_blank"}
              rel={labels.ctaPrimary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {labels.ctaPrimary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a
              className="acct-care__cta acct-care__cta--ghost"
              href={labels.ctaSecondary.href}
              target={labels.ctaSecondary.href.startsWith("#") ? undefined : "_blank"}
              rel={labels.ctaSecondary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {labels.ctaSecondary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-care__hero-tiles" role="list" aria-label={labels.tilesAriaLabel}>
            <div className="acct-care__hero-tile" role="listitem">
              <span className="acct-care__hero-tile-label">{labels.tileLabels.total}</span>
              <span className="acct-care__hero-tile-value">{stats.total}</span>
              <span className="acct-care__hero-tile-foot">
                {stats.total === 0 ? labels.tileFoot.totalEmpty : labels.tileFoot.totalWith(stats.total)}
              </span>
            </div>
            <div className="acct-care__hero-tile" role="listitem">
              <span className="acct-care__hero-tile-label">{labels.tileLabels.inFlight}</span>
              <span className="acct-care__hero-tile-value">{stats.inFlight}</span>
              <span className="acct-care__hero-tile-foot">
                {stats.inFlight === 0 ? labels.tileFoot.inFlightEmpty : labels.tileFoot.inFlightWith}
              </span>
            </div>
            <div className="acct-care__hero-tile" role="listitem">
              <span className="acct-care__hero-tile-label">{labels.tileLabels.payment}</span>
              <span className="acct-care__hero-tile-value">{stats.needsPayment}</span>
              <span className="acct-care__hero-tile-foot">
                {stats.needsPayment === 0 ? labels.tileFoot.paymentEmpty : labels.tileFoot.paymentWith}
              </span>
            </div>
            <div className="acct-care__hero-tile" role="listitem">
              <span className="acct-care__hero-tile-label">{labels.tileLabels.completed}</span>
              <span className="acct-care__hero-tile-value">{stats.completed}</span>
              <span className="acct-care__hero-tile-foot">
                {stats.completed === 0 ? labels.tileFoot.completedEmpty : labels.tileFoot.completedWith}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-care__hero-side" aria-label={labels.sideKicker}>
          <p className="acct-care__hero-side-label">{labels.sideKicker}</p>
          <p className="acct-care__hero-side-title">{labels.sideTitle}</p>
          <p className="acct-care__hero-side-body">{labels.sideBody}</p>
          {breakdown.length > 0 ? (
            <div className="acct-care__hero-breakdown" aria-label={labels.breakdownLabel}>
              <p className="acct-care__hero-breakdown-label">{labels.breakdownLabel}</p>
              {breakdown.map((row) => (
                <div key={row.key} className="acct-care__hero-breakdown-row">
                  <span className="acct-care__hero-breakdown-name">
                    <span
                      className="acct-care__hero-breakdown-dot"
                      style={{ background: row.color }}
                      aria-hidden
                    />
                    {row.label}
                  </span>
                  <span className="acct-care__hero-breakdown-count">{row.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

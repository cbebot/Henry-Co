import type { invoiceStats } from "./helpers";
import { divisionForKey, formatKoboMajor } from "./helpers";

type Props = {
  stats: ReturnType<typeof invoiceStats>;
  headline: string;
  blurb: string;
  eyebrow: string;
  labels: {
    ariaOverview: string;
    ariaTotals: string;
    ariaByDivision: string;
    totalPaid: string;
    thisMonth: string;
    thisMonthFoot: string;
    outstanding: string;
    paidCount: string;
    pendingCount: string;
    overdueCount: string;
    byDivision: string;
    nothing: string;
  };
  divisionLabels: Record<string, string>;
};

export function InvoicesHero({
  stats,
  headline,
  blurb,
  eyebrow,
  labels,
  divisionLabels,
}: Props) {
  return (
    <section className="acct-inv__hero" aria-label={labels.ariaOverview}>
      <div className="acct-inv__hero-inner">
        <div>
          <span className="acct-inv__eyebrow">
            <span className="acct-inv__eyebrow-dot" aria-hidden />
            {eyebrow}
          </span>
          <h1 className="acct-inv__headline">{headline}</h1>
          <p className="acct-inv__blurb">{blurb}</p>
          <div className="acct-inv__hero-tiles" role="list" aria-label={labels.ariaTotals}>
            <div className="acct-inv__hero-tile" role="listitem">
              <span className="acct-inv__hero-tile-label">{labels.totalPaid}</span>
              <span className="acct-inv__hero-tile-value">
                ₦{formatKoboMajor(stats.totalPaidKobo)}
              </span>
              <span className="acct-inv__hero-tile-foot">
                {stats.paidCount} {labels.paidCount}
              </span>
            </div>
            <div className="acct-inv__hero-tile" role="listitem">
              <span className="acct-inv__hero-tile-label">{labels.thisMonth}</span>
              <span className="acct-inv__hero-tile-value">
                ₦{formatKoboMajor(stats.thisMonthPaidKobo)}
              </span>
              <span className="acct-inv__hero-tile-foot">{labels.thisMonthFoot}</span>
            </div>
            <div className="acct-inv__hero-tile" role="listitem">
              <span className="acct-inv__hero-tile-label">{labels.outstanding}</span>
              <span className="acct-inv__hero-tile-value">
                ₦{formatKoboMajor(stats.outstandingKobo)}
              </span>
              <span className="acct-inv__hero-tile-foot">
                {stats.pendingCount} {labels.pendingCount} · {stats.overdueCount}{" "}
                {labels.overdueCount}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-inv__hero-side" aria-label={labels.ariaByDivision}>
          <p className="acct-inv__hero-side-label">{labels.byDivision}</p>
          {stats.divisions.length === 0 ? (
            <span
              style={{
                fontSize: 13,
                color: "color-mix(in srgb, var(--acct-bg-soft) 70%, transparent)",
              }}
            >
              {labels.nothing}
            </span>
          ) : (
            stats.divisions.map((d) => {
              const palette = divisionForKey(d.key);
              const localizedLabel = divisionLabels[d.key] ?? divisionLabels.fallback ?? d.label;
              return (
                <div className="acct-inv__hero-side-row" key={d.key}>
                  <span className="acct-inv__hero-side-name">
                    <span
                      className="acct-inv__hero-side-dot"
                      style={{ background: palette.color }}
                      aria-hidden
                    />
                    {localizedLabel}
                  </span>
                  <span className="acct-inv__hero-side-count">{d.count}</span>
                </div>
              );
            })
          )}
        </aside>
      </div>
    </section>
  );
}

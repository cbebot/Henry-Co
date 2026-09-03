import { ArrowUpRight } from "lucide-react";

import { formatNaira, type MarketStats } from "./helpers";

type CtaLabel = { label: string; href: string };

type HeroLabels = {
  eyebrow: string;
  ariaLabel: string;
  sideAriaLabel: string;
  sideKicker: string;
  sideTitle: string;
  sideBody: string;
  breakdownLabel: string;
  breakdownAriaLabel: string;
  tilesAriaLabel: string;
  tileLabels: {
    orders: string;
    disputes: string;
    store: string;
    payouts: string;
  };
  tileFoot: {
    ordersEmpty: string;
    ordersInMotionTemplate: string;
    ordersDeliveredTemplate: string;
    disputesClear: string;
    disputesActiveTemplate: string;
    storeActiveNoName: string;
    storeActiveWithNameTemplate: string;
    storeApplicationTemplate: string;
    storeIdle: string;
    payoutsEmptyNoneSettled: string;
    payoutsSettledTemplate: string;
    payoutsPendingTemplate: string;
  };
  breakdownLabels: {
    inMotion: string;
    openDisputes: string;
    delivered: string;
    pendingPayouts: string;
  };
  applicationStatusLabels: Record<string, string>;
  headline: string;
  blurb: string;
  ctaPrimary: CtaLabel;
  ctaSecondary: CtaLabel;
};

type Props = {
  stats: MarketStats;
  labels: HeroLabels;
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function MarketplaceHero({ stats, labels }: Props) {
  const breakdown = [
    { key: "inFlight", label: labels.breakdownLabels.inMotion, count: stats.inFlight, color: "var(--acct-gold)" },
    { key: "open", label: labels.breakdownLabels.openDisputes, count: stats.openDisputes, color: "var(--acct-red)" },
    { key: "delivered", label: labels.breakdownLabels.delivered, count: stats.delivered, color: "var(--acct-green)" },
    { key: "pendingPay", label: labels.breakdownLabels.pendingPayouts, count: stats.payoutsPending, color: "var(--acct-blue)" },
  ].filter((row) => row.count > 0);

  const localizeApplicationStatus = (raw: string | null): string => {
    if (!raw) return "";
    const key = raw.toLowerCase();
    return labels.applicationStatusLabels[key] ?? raw.replace(/_/g, " ");
  };

  const storeFoot = stats.sellerActive
    ? stats.storeName
      ? fill(labels.tileFoot.storeActiveWithNameTemplate, { name: stats.storeName })
      : labels.tileFoot.storeActiveNoName
    : stats.applicationStatus
      ? fill(labels.tileFoot.storeApplicationTemplate, {
          status: localizeApplicationStatus(stats.applicationStatus),
        })
      : labels.tileFoot.storeIdle;

  const ordersFoot =
    stats.totalOrders === 0
      ? labels.tileFoot.ordersEmpty
      : stats.inFlight > 0
        ? fill(labels.tileFoot.ordersInMotionTemplate, {
            inFlight: stats.inFlight,
            delivered: stats.delivered,
          })
        : fill(labels.tileFoot.ordersDeliveredTemplate, { delivered: stats.delivered });

  const disputesFoot =
    stats.openDisputes + stats.resolvingDisputes === 0
      ? labels.tileFoot.disputesClear
      : fill(labels.tileFoot.disputesActiveTemplate, {
          open: stats.openDisputes,
          resolving: stats.resolvingDisputes,
        });

  const payoutsFoot =
    stats.payoutsPending === 0
      ? stats.payoutsPaid > 0
        ? fill(labels.tileFoot.payoutsSettledTemplate, { count: stats.payoutsPaid })
        : labels.tileFoot.payoutsEmptyNoneSettled
      : fill(labels.tileFoot.payoutsPendingTemplate, {
          amount: formatNaira(stats.payoutsPendingKobo),
        });

  return (
    <section className="acct-mkt__hero" aria-label={labels.ariaLabel}>
      <div className="acct-mkt__hero-inner">
        <div>
          <span className="acct-mkt__eyebrow">
            <span className="acct-mkt__eyebrow-dot" aria-hidden />
            {labels.eyebrow}
          </span>
          <h1 className="acct-mkt__headline">{labels.headline}</h1>
          <p className="acct-mkt__blurb">{labels.blurb}</p>
          <div className="acct-mkt__hero-ctas">
            <a
              className="acct-mkt__cta acct-mkt__cta--primary"
              href={labels.ctaPrimary.href}
              target={labels.ctaPrimary.href.startsWith("#") ? undefined : "_blank"}
              rel={labels.ctaPrimary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {labels.ctaPrimary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a
              className="acct-mkt__cta acct-mkt__cta--ghost"
              href={labels.ctaSecondary.href}
              target={labels.ctaSecondary.href.startsWith("#") ? undefined : "_blank"}
              rel={labels.ctaSecondary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {labels.ctaSecondary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-mkt__hero-tiles" role="list" aria-label={labels.tilesAriaLabel}>
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">{labels.tileLabels.orders}</span>
              <span className="acct-mkt__hero-tile-value">{stats.totalOrders}</span>
              <span className="acct-mkt__hero-tile-foot">{ordersFoot}</span>
            </div>
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">{labels.tileLabels.disputes}</span>
              <span className="acct-mkt__hero-tile-value">
                {stats.openDisputes + stats.resolvingDisputes}
              </span>
              <span className="acct-mkt__hero-tile-foot">{disputesFoot}</span>
            </div>
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">{labels.tileLabels.store}</span>
              <span className="acct-mkt__hero-tile-value">
                {stats.sellerActive ? "✓" : stats.applicationStatus ? "…" : "—"}
              </span>
              <span className="acct-mkt__hero-tile-foot">{storeFoot}</span>
            </div>
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">{labels.tileLabels.payouts}</span>
              <span className="acct-mkt__hero-tile-value">{stats.payoutsPending}</span>
              <span className="acct-mkt__hero-tile-foot">{payoutsFoot}</span>
            </div>
          </div>
        </div>
        <aside className="acct-mkt__hero-side" aria-label={labels.sideAriaLabel}>
          <p className="acct-mkt__hero-side-label">{labels.sideKicker}</p>
          <p className="acct-mkt__hero-side-title">{labels.sideTitle}</p>
          <p className="acct-mkt__hero-side-body">{labels.sideBody}</p>
          {breakdown.length > 0 ? (
            <div className="acct-mkt__hero-breakdown" aria-label={labels.breakdownAriaLabel}>
              <p className="acct-mkt__hero-breakdown-label">{labels.breakdownLabel}</p>
              {breakdown.map((row) => (
                <div key={row.key} className="acct-mkt__hero-breakdown-row">
                  <span className="acct-mkt__hero-breakdown-name">
                    <span
                      className="acct-mkt__hero-breakdown-dot"
                      style={{ background: row.color }}
                      aria-hidden
                    />
                    {row.label}
                  </span>
                  <span className="acct-mkt__hero-breakdown-count">{row.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

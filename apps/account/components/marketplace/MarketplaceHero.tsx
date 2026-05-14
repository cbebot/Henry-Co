import { ArrowUpRight } from "lucide-react";

import {
  buildHeroCopy,
  formatNaira,
  heroState,
  type MarketStats,
} from "./helpers";

type Props = {
  stats: MarketStats;
  marketplaceOrigin: string;
};

export function MarketplaceHero({ stats, marketplaceOrigin }: Props) {
  const state = heroState(stats);
  const copy = buildHeroCopy(state, stats, marketplaceOrigin);

  const breakdown = [
    { key: "inFlight",   label: "In motion",  count: stats.inFlight,         color: "var(--acct-gold)" },
    { key: "open",       label: "Open disputes", count: stats.openDisputes,  color: "var(--acct-red)" },
    { key: "delivered",  label: "Delivered",  count: stats.delivered,        color: "var(--acct-green)" },
    { key: "pendingPay", label: "Pending payouts", count: stats.payoutsPending, color: "var(--acct-blue)" },
  ].filter((row) => row.count > 0);

  const storeFoot = stats.sellerActive
    ? (stats.storeName ? `Store: ${stats.storeName}` : "Vendor membership active")
    : stats.applicationStatus
      ? `Application: ${stats.applicationStatus.replace(/_/g, " ")}`
      : "Not selling yet — apply when ready";

  return (
    <section className="acct-mkt__hero" data-state={state} aria-label="Marketplace overview">
      <div className="acct-mkt__hero-inner">
        <div>
          <span className="acct-mkt__eyebrow">
            <span className="acct-mkt__eyebrow-dot" aria-hidden />
            Marketplace · live
          </span>
          <h1 className="acct-mkt__headline">{copy.headline}</h1>
          <p className="acct-mkt__blurb">{copy.blurb}</p>
          <div className="acct-mkt__hero-ctas">
            <a
              className="acct-mkt__cta acct-mkt__cta--primary"
              href={copy.ctaPrimary.href}
              target={copy.ctaPrimary.href.startsWith("#") ? undefined : "_blank"}
              rel={copy.ctaPrimary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {copy.ctaPrimary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a
              className="acct-mkt__cta acct-mkt__cta--ghost"
              href={copy.ctaSecondary.href}
              target={copy.ctaSecondary.href.startsWith("#") ? undefined : "_blank"}
              rel={copy.ctaSecondary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {copy.ctaSecondary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-mkt__hero-tiles" role="list" aria-label="Marketplace activity">
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">Orders</span>
              <span className="acct-mkt__hero-tile-value">{stats.totalOrders}</span>
              <span className="acct-mkt__hero-tile-foot">
                {stats.totalOrders === 0
                  ? "First order will appear here"
                  : stats.inFlight > 0
                    ? `${stats.inFlight} in motion · ${stats.delivered} delivered`
                    : `${stats.delivered} delivered to date`}
              </span>
            </div>
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">Disputes</span>
              <span className="acct-mkt__hero-tile-value">{stats.openDisputes + stats.resolvingDisputes}</span>
              <span className="acct-mkt__hero-tile-foot">
                {stats.openDisputes + stats.resolvingDisputes === 0
                  ? "All clear"
                  : `${stats.openDisputes} open · ${stats.resolvingDisputes} resolving`}
              </span>
            </div>
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">Store</span>
              <span className="acct-mkt__hero-tile-value">
                {stats.sellerActive ? "✓" : stats.applicationStatus ? "…" : "—"}
              </span>
              <span className="acct-mkt__hero-tile-foot">{storeFoot}</span>
            </div>
            <div className="acct-mkt__hero-tile" role="listitem">
              <span className="acct-mkt__hero-tile-label">Payouts</span>
              <span className="acct-mkt__hero-tile-value">{stats.payoutsPending}</span>
              <span className="acct-mkt__hero-tile-foot">
                {stats.payoutsPending === 0
                  ? stats.payoutsPaid > 0
                    ? `${stats.payoutsPaid} settled to date`
                    : "No payout requests yet"
                  : `${formatNaira(stats.payoutsPendingKobo)} pending`}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-mkt__hero-side" aria-label="How this room works">
          <p className="acct-mkt__hero-side-label">How this room works</p>
          <p className="acct-mkt__hero-side-title">Buy and sell — one room.</p>
          <p className="acct-mkt__hero-side-body">
            Every order, dispute, and payout request you create on Marketplace
            mirrors into this room. Seller workspace activity threads in
            alongside buyer orders, so the two sides of marketplace stay
            visible at a glance.
          </p>
          {breakdown.length > 0 ? (
            <div className="acct-mkt__hero-breakdown" aria-label="Activity breakdown">
              <p className="acct-mkt__hero-breakdown-label">By status</p>
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

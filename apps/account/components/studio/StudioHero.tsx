import { ArrowUpRight } from "lucide-react";

import {
  buildHeroCopy,
  heroState,
  type StudioStats,
} from "./helpers";

type Props = {
  stats: StudioStats;
};

export function StudioHero({ stats }: Props) {
  const state = heroState(stats);
  const copy = buildHeroCopy(state, stats);

  const breakdown = [
    { key: "active",   label: "Active",         count: stats.metrics.activeProjects, color: "var(--acct-gold)" },
    { key: "review",   label: "Ready for review", count: stats.readyReview,          color: "var(--acct-blue)" },
    { key: "pending",  label: "Pending payment", count: stats.metrics.pendingPayments, color: "var(--acct-purple)" },
    { key: "proof",    label: "Proof submitted",  count: stats.metrics.proofSubmitted, color: "var(--acct-green)" },
  ].filter((row) => row.count > 0);

  return (
    <section className="acct-stu__hero" data-state={state} aria-label="Studio overview">
      <div className="acct-stu__hero-inner">
        <div>
          <span className="acct-stu__eyebrow">
            <span className="acct-stu__eyebrow-dot" aria-hidden />
            Studio · live
          </span>
          <h1 className="acct-stu__headline">{copy.headline}</h1>
          <p className="acct-stu__blurb">{copy.blurb}</p>
          <div className="acct-stu__hero-ctas">
            <a
              className="acct-stu__cta acct-stu__cta--primary"
              href={copy.ctaPrimary.href}
              target={copy.ctaPrimary.href.startsWith("#") ? undefined : "_blank"}
              rel={copy.ctaPrimary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {copy.ctaPrimary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a
              className="acct-stu__cta acct-stu__cta--ghost"
              href={copy.ctaSecondary.href}
              target={copy.ctaSecondary.href.startsWith("#") ? undefined : "_blank"}
              rel={copy.ctaSecondary.href.startsWith("#") ? undefined : "noopener noreferrer"}
            >
              {copy.ctaSecondary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-stu__hero-tiles" role="list" aria-label="Studio activity">
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">Active projects</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.activeProjects}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.activeProjects === 0
                  ? "No live workspaces right now"
                  : "Live workspaces with delivery motion"}
              </span>
            </div>
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">Pending payments</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.pendingPayments}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.pendingPayments === 0
                  ? "Commercial lane is clear"
                  : "Commercial checkpoints still open"}
              </span>
            </div>
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">Proof submitted</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.proofSubmitted}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.proofSubmitted === 0
                  ? "Nothing awaiting review"
                  : "Payments waiting on Studio review"}
              </span>
            </div>
            <div className="acct-stu__hero-tile" role="listitem">
              <span className="acct-stu__hero-tile-label">Deliverables</span>
              <span className="acct-stu__hero-tile-value">{stats.metrics.deliverables}</span>
              <span className="acct-stu__hero-tile-foot">
                {stats.metrics.deliverables === 0
                  ? "Files appear here as Studio uploads them"
                  : "Files and outputs tracked in one place"}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-stu__hero-side" aria-label="How this room works">
          <p className="acct-stu__hero-side-label">How this room works</p>
          <p className="acct-stu__hero-side-title">One project room, real state.</p>
          <p className="acct-stu__hero-side-body">
            Proposals, milestones, payment proofs, deliverables, and
            communication signals stay connected to the same HenryCo
            identity you use everywhere else. The dashboard below reflects
            the Studio team&apos;s actual progress, not a status list.
          </p>
          {breakdown.length > 0 ? (
            <div className="acct-stu__hero-breakdown" aria-label="Activity breakdown">
              <p className="acct-stu__hero-breakdown-label">By state</p>
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

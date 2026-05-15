import type { InboxAggregate } from "@henryco/data";
import {
  DIVISION_ACCENT_VAR,
  DIVISION_LABEL,
  inboxBlurb,
  inboxHeadline,
  inboxState,
} from "./helpers";

type Props = {
  aggregate: InboxAggregate;
};

/**
 * V3 Wave A1 D3 — Inbox hero.
 *
 * Premium, capability-evidence-first hero (memory:
 * feedback_no_giant_hero_text.md — owner rejects giant landing hero
 * text). Shows live counts (open / unread / portals represented), the
 * top three division mixes by volume, and a calm headline tuned to the
 * current state (zero / calm / busy / overloaded).
 */
export function InboxHero({ aggregate }: Props) {
  const state = inboxState(aggregate);
  const portalsActive = Object.values(aggregate.counts).filter((n) => n > 0).length;

  // Top 3 divisions by count for the side panel mix.
  const sortedMix = (Object.entries(aggregate.counts) as Array<[
    keyof typeof DIVISION_LABEL,
    number,
  ]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <section className="acct-inbox__hero" aria-label="Inbox overview">
      <div className="acct-inbox__hero-inner">
        <div>
          <span className="acct-inbox__eyebrow">
            <span className="acct-inbox__eyebrow-dot" aria-hidden />
            HenryCo · unified inbox
          </span>
          <h1 className="acct-inbox__headline">{inboxHeadline(state, aggregate)}</h1>
          <p className="acct-inbox__blurb">{inboxBlurb(state)}</p>
          <div className="acct-inbox__hero-tiles" role="list" aria-label="Inbox volume">
            <div className="acct-inbox__hero-tile" role="listitem">
              <span className="acct-inbox__hero-tile-label">Open</span>
              <span className="acct-inbox__hero-tile-value">{aggregate.totalOpen}</span>
              <span className="acct-inbox__hero-tile-foot">
                {aggregate.totalOpen === 0
                  ? "Nothing in progress"
                  : "Threads awaiting movement"}
              </span>
            </div>
            <div className="acct-inbox__hero-tile" role="listitem">
              <span className="acct-inbox__hero-tile-label">Unread</span>
              <span className="acct-inbox__hero-tile-value">{aggregate.totalUnread}</span>
              <span className="acct-inbox__hero-tile-foot">
                {aggregate.totalUnread === 0
                  ? "Inbox caught up"
                  : "Tap a row to open the thread"}
              </span>
            </div>
            <div className="acct-inbox__hero-tile" role="listitem">
              <span className="acct-inbox__hero-tile-label">Portals</span>
              <span className="acct-inbox__hero-tile-value">{portalsActive}</span>
              <span className="acct-inbox__hero-tile-foot">
                {portalsActive === 0
                  ? "Care, Marketplace, Studio, Jobs and more"
                  : portalsActive === 1
                    ? "One division active"
                    : `${portalsActive} divisions represented`}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-inbox__hero-side" aria-label="By portal">
          <p className="acct-inbox__hero-side-label">By portal</p>
          <p className="acct-inbox__hero-side-title">
            {portalsActive === 0
              ? "Quiet across every division"
              : portalsActive === 1
                ? "One division has traffic"
                : `${portalsActive} divisions in the mix`}
          </p>
          <p className="acct-inbox__hero-side-body">
            Every portal feeds this one inbox. Support, marketplace orders, jobs
            interviews, studio projects and care bookings all surface here in
            chronological order.
          </p>
          {sortedMix.length === 0 ? null : (
            <div role="list">
              {sortedMix.map(([key, count]) => (
                <div className="acct-inbox__mix-row" role="listitem" key={key}>
                  <span
                    className="acct-inbox__mix-label"
                    style={{ color: `var(${DIVISION_ACCENT_VAR[key]})` }}
                  >
                    <span className="acct-inbox__mix-dot" aria-hidden />
                    <span style={{ color: "color-mix(in srgb, var(--acct-bg-soft) 88%, transparent)" }}>
                      {DIVISION_LABEL[key]}
                    </span>
                  </span>
                  <span className="acct-inbox__mix-value">{count}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

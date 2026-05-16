import type { InboxAggregate } from "@henryco/data";
import { formatAccountTemplate, type AccountCopy } from "@henryco/i18n/server";
import {
  DIVISION_ACCENT_VAR,
  inboxBlurbKey,
  inboxHeadlineKey,
  inboxState,
} from "./helpers";

type MessagesCopy = AccountCopy["messages"];

type Props = {
  aggregate: InboxAggregate;
  copy: MessagesCopy;
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
export function InboxHero({ aggregate, copy }: Props) {
  const state = inboxState(aggregate);
  const portalsActive = Object.values(aggregate.counts).filter((n) => n > 0).length;

  const headlineKey = inboxHeadlineKey(state, aggregate);
  const headline =
    headlineKey === "zero"
      ? copy.headlines.zero
      : headlineKey === "calmOne"
        ? copy.headlines.calmOne
        : headlineKey === "calmMany"
          ? formatAccountTemplate(copy.headlines.calmMany, {
              count: aggregate.totalOpen,
            })
          : headlineKey === "busy"
            ? formatAccountTemplate(copy.headlines.busy, {
                unread: aggregate.totalUnread,
                open: aggregate.totalOpen,
              })
            : formatAccountTemplate(copy.headlines.overloaded, {
                unread: aggregate.totalUnread,
                open: aggregate.totalOpen,
              });

  const blurbKey = inboxBlurbKey(state);
  const blurb = copy.blurbs[blurbKey];

  // Top 4 divisions by count for the side panel mix.
  const sortedMix = (Object.entries(aggregate.counts) as Array<[
    keyof MessagesCopy["divisionLabels"],
    number,
  ]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const sideTitle =
    portalsActive === 0
      ? copy.sideTitle.empty
      : portalsActive === 1
        ? copy.sideTitle.singular
        : formatAccountTemplate(copy.sideTitle.plural, { count: portalsActive });

  const portalsFoot =
    portalsActive === 0
      ? copy.tiles.portalsFootEmpty
      : portalsActive === 1
        ? copy.tiles.portalsFootSingular
        : formatAccountTemplate(copy.tiles.portalsFootPlural, {
            count: portalsActive,
          });

  return (
    <section className="acct-inbox__hero" aria-label={copy.hero.ariaLabel}>
      <div className="acct-inbox__hero-inner">
        <div>
          <span className="acct-inbox__eyebrow">
            <span className="acct-inbox__eyebrow-dot" aria-hidden />
            {copy.hero.eyebrow}
          </span>
          <h1 className="acct-inbox__headline">{headline}</h1>
          <p className="acct-inbox__blurb">{blurb}</p>
          <div
            className="acct-inbox__hero-tiles"
            role="list"
            aria-label={copy.hero.ariaTiles}
          >
            <div className="acct-inbox__hero-tile" role="listitem">
              <span className="acct-inbox__hero-tile-label">{copy.tiles.openLabel}</span>
              <span className="acct-inbox__hero-tile-value">{aggregate.totalOpen}</span>
              <span className="acct-inbox__hero-tile-foot">
                {aggregate.totalOpen === 0
                  ? copy.tiles.openFootEmpty
                  : copy.tiles.openFootActive}
              </span>
            </div>
            <div className="acct-inbox__hero-tile" role="listitem">
              <span className="acct-inbox__hero-tile-label">{copy.tiles.unreadLabel}</span>
              <span className="acct-inbox__hero-tile-value">{aggregate.totalUnread}</span>
              <span className="acct-inbox__hero-tile-foot">
                {aggregate.totalUnread === 0
                  ? copy.tiles.unreadFootEmpty
                  : copy.tiles.unreadFootActive}
              </span>
            </div>
            <div className="acct-inbox__hero-tile" role="listitem">
              <span className="acct-inbox__hero-tile-label">{copy.tiles.portalsLabel}</span>
              <span className="acct-inbox__hero-tile-value">{portalsActive}</span>
              <span className="acct-inbox__hero-tile-foot">{portalsFoot}</span>
            </div>
          </div>
        </div>
        <aside className="acct-inbox__hero-side" aria-label={copy.hero.ariaSide}>
          <p className="acct-inbox__hero-side-label">{copy.hero.sideLabel}</p>
          <p className="acct-inbox__hero-side-title">{sideTitle}</p>
          <p className="acct-inbox__hero-side-body">{copy.hero.sideBody}</p>
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
                      {copy.divisionLabels[key]}
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

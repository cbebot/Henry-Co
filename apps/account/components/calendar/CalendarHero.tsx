import type { CalendarAggregate } from "@henryco/data";
import type { AccountCopy } from "@henryco/i18n";
import { formatAccountTemplate } from "@henryco/i18n";
import {
  calendarBlurb,
  calendarHeadline,
  calendarState,
  topMix,
} from "./helpers";

type Props = {
  aggregate: CalendarAggregate;
  /**
   * Server-resolved "now" (ms since epoch). Passed in by the RSC page
   * so the component stays pure (React 19 purity rule — see
   * https://react.dev/reference/rules/components-and-hooks-must-be-pure).
   */
  nowMs: number;
  copy: AccountCopy["calendar"];
};

/**
 * V3 Wave A1 D4 — Calendar hero.
 *
 * Capability-evidence-first hero: total events, distinct portals,
 * next-up countdown. No giant landing text (memory:
 * feedback_no_giant_hero_text.md). The right panel ranks the top
 * portals by count so the viewer sees mix at a glance.
 */
export function CalendarHero({ aggregate, nowMs, copy }: Props) {
  const state = calendarState(aggregate);
  const portalsActive = Object.values(aggregate.counts).filter((n) => n > 0).length;
  const mix = topMix(aggregate.counts, copy);

  const next = aggregate.events.find((e) => Date.parse(e.startAt) >= nowMs);
  const nextLabel = next ? formatNextLabel(next.startAt, nowMs) : "—";

  const portalsFoot =
    portalsActive === 0
      ? copy.tilePortalsFootEmpty
      : portalsActive === 1
        ? copy.tilePortalsFootSingular
        : formatAccountTemplate(copy.tilePortalsFootPlural, { count: portalsActive });

  const sideTitle =
    portalsActive === 0
      ? copy.sideTitleEmpty
      : portalsActive === 1
        ? copy.sideTitleSingular
        : formatAccountTemplate(copy.sideTitlePlural, { count: portalsActive });

  return (
    <section className="acct-cal__hero" aria-label={copy.heroAriaLabel}>
      <div className="acct-cal__hero-inner">
        <div>
          <span className="acct-cal__eyebrow">
            <span className="acct-cal__eyebrow-dot" aria-hidden />
            {copy.heroEyebrow}
          </span>
          <h1 className="acct-cal__headline">
            {calendarHeadline(state, aggregate, copy)}
          </h1>
          <p className="acct-cal__blurb">{calendarBlurb(state, copy)}</p>
          <div
            className="acct-cal__hero-tiles"
            role="list"
            aria-label={copy.tileVolumeAriaLabel}
          >
            <div className="acct-cal__hero-tile" role="listitem">
              <span className="acct-cal__hero-tile-label">{copy.tileEventsLabel}</span>
              <span className="acct-cal__hero-tile-value">
                {aggregate.events.length}
              </span>
              <span className="acct-cal__hero-tile-foot">{copy.tileEventsFoot}</span>
            </div>
            <div className="acct-cal__hero-tile" role="listitem">
              <span className="acct-cal__hero-tile-label">{copy.tilePortalsLabel}</span>
              <span className="acct-cal__hero-tile-value">{portalsActive}</span>
              <span className="acct-cal__hero-tile-foot">{portalsFoot}</span>
            </div>
            <div className="acct-cal__hero-tile" role="listitem">
              <span className="acct-cal__hero-tile-label">{copy.tileNextLabel}</span>
              <span className="acct-cal__hero-tile-value">{nextLabel}</span>
              <span className="acct-cal__hero-tile-foot">
                {next ? next.title : copy.tileNextEmpty}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-cal__hero-side" aria-label={copy.sideAriaLabel}>
          <p className="acct-cal__hero-side-label">{copy.sideLabel}</p>
          <p className="acct-cal__hero-side-title">{sideTitle}</p>
          <p className="acct-cal__hero-side-body">{copy.sideBody}</p>
          {mix.length === 0 ? null : (
            <div role="list">
              {mix.map((row) => (
                <div className="acct-cal__mix-row" role="listitem" key={row.key}>
                  <span
                    className="acct-cal__mix-label"
                    style={{ color: `var(${row.accentVar})` }}
                  >
                    <span className="acct-cal__mix-dot" aria-hidden />
                    <span style={{ color: "color-mix(in srgb, var(--acct-bg-soft) 88%, transparent)" }}>
                      {row.label}
                    </span>
                  </span>
                  <span className="acct-cal__mix-value">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function formatNextLabel(iso: string, nowMs: number): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const delta = ms - nowMs;
  if (delta < 0) return "now";
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h`;
  return `${Math.round(delta / 86_400_000)}d`;
}

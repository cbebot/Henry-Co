import type { CalendarAggregate } from "@henryco/data";
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
};

/**
 * V3 Wave A1 D4 — Calendar hero.
 *
 * Capability-evidence-first hero: total events, distinct portals,
 * next-up countdown. No giant landing text (memory:
 * feedback_no_giant_hero_text.md). The right panel ranks the top
 * portals by count so the viewer sees mix at a glance.
 */
export function CalendarHero({ aggregate, nowMs }: Props) {
  const state = calendarState(aggregate);
  const portalsActive = Object.values(aggregate.counts).filter((n) => n > 0).length;
  const mix = topMix(aggregate.counts);

  const next = aggregate.events.find((e) => Date.parse(e.startAt) >= nowMs);
  const nextLabel = next ? formatNextLabel(next.startAt, nowMs) : "—";

  return (
    <section className="acct-cal__hero" aria-label="Calendar overview">
      <div className="acct-cal__hero-inner">
        <div>
          <span className="acct-cal__eyebrow">
            <span className="acct-cal__eyebrow-dot" aria-hidden />
            HenryCo · cross-portal calendar
          </span>
          <h1 className="acct-cal__headline">
            {calendarHeadline(state, aggregate)}
          </h1>
          <p className="acct-cal__blurb">{calendarBlurb(state)}</p>
          <div className="acct-cal__hero-tiles" role="list" aria-label="Calendar volume">
            <div className="acct-cal__hero-tile" role="listitem">
              <span className="acct-cal__hero-tile-label">Events</span>
              <span className="acct-cal__hero-tile-value">
                {aggregate.events.length}
              </span>
              <span className="acct-cal__hero-tile-foot">Next 28 days</span>
            </div>
            <div className="acct-cal__hero-tile" role="listitem">
              <span className="acct-cal__hero-tile-label">Portals</span>
              <span className="acct-cal__hero-tile-value">{portalsActive}</span>
              <span className="acct-cal__hero-tile-foot">
                {portalsActive === 0
                  ? "Care, property, jobs, studio, learn, logistics"
                  : portalsActive === 1
                    ? "One division scheduled"
                    : `${portalsActive} divisions scheduled`}
              </span>
            </div>
            <div className="acct-cal__hero-tile" role="listitem">
              <span className="acct-cal__hero-tile-label">Next up</span>
              <span className="acct-cal__hero-tile-value">{nextLabel}</span>
              <span className="acct-cal__hero-tile-foot">
                {next
                  ? `${next.title}`
                  : "Nothing scheduled in the window"}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-cal__hero-side" aria-label="By portal">
          <p className="acct-cal__hero-side-label">By portal</p>
          <p className="acct-cal__hero-side-title">
            {portalsActive === 0
              ? "No scheduling yet"
              : portalsActive === 1
                ? "One portal active"
                : `${portalsActive} portals in the mix`}
          </p>
          <p className="acct-cal__hero-side-body">
            Bookings, viewings, interviews, milestones, classes and dispatch
            windows all surface here in chronological order.
          </p>
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

import {
  buildBlurb,
  buildHeadline,
  heroState,
  type taskStats,
} from "./helpers";

type Props = {
  stats: ReturnType<typeof taskStats>;
  eyebrow: string;
  guidanceKicker: string;
  guidanceTitle: string;
  guidanceBody: string;
  labels: {
    blocking: string;
    urgent: string;
    high: string;
    total: string;
  };
};

export function TasksHero({ stats, eyebrow, guidanceKicker, guidanceTitle, guidanceBody, labels }: Props) {
  const state = heroState(stats);
  const headline = buildHeadline(state, stats);
  const blurb = buildBlurb(state);
  return (
    <section className="acct-tsk__hero" data-state={state} aria-label="Tasks overview">
      <div className="acct-tsk__hero-inner">
        <div>
          <span className="acct-tsk__eyebrow">
            <span className="acct-tsk__eyebrow-dot" aria-hidden />
            {eyebrow}
          </span>
          <h1 className="acct-tsk__headline">{headline}</h1>
          <p className="acct-tsk__blurb">{blurb}</p>
          <div className="acct-tsk__hero-tiles" role="list" aria-label="Task volume">
            <div className="acct-tsk__hero-tile" role="listitem">
              <span className="acct-tsk__hero-tile-label">{labels.blocking}</span>
              <span className="acct-tsk__hero-tile-value">{stats.blocking}</span>
              <span className="acct-tsk__hero-tile-foot">
                {stats.blocking === 0 ? "Nothing blocking right now" : "Resolve to unblock other lanes"}
              </span>
            </div>
            <div className="acct-tsk__hero-tile" role="listitem">
              <span className="acct-tsk__hero-tile-label">{labels.urgent}</span>
              <span className="acct-tsk__hero-tile-value">{stats.urgent}</span>
              <span className="acct-tsk__hero-tile-foot">
                {stats.high} {labels.high} · {stats.normal + stats.low} routine
              </span>
            </div>
            <div className="acct-tsk__hero-tile" role="listitem">
              <span className="acct-tsk__hero-tile-label">{labels.total}</span>
              <span className="acct-tsk__hero-tile-value">{stats.total}</span>
              <span className="acct-tsk__hero-tile-foot">
                {stats.divisions.length} division{stats.divisions.length === 1 ? "" : "s"} represented
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-tsk__hero-side" aria-label="How the queue works">
          <p className="acct-tsk__hero-side-label">{guidanceKicker}</p>
          <p className="acct-tsk__hero-side-title">{guidanceTitle}</p>
          <p className="acct-tsk__hero-side-body">{guidanceBody}</p>
          {stats.divisions.length > 0 ? (
            <div style={{ marginTop: 8 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "color-mix(in srgb, var(--acct-bg-soft) 65%, transparent)",
                  margin: "0 0 6px",
                }}
              >
                By source
              </p>
              {stats.divisions.map((d) => (
                <div
                  key={d.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "3px 0",
                    fontSize: 13,
                    color: "color-mix(in srgb, var(--acct-bg-soft) 85%, transparent)",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: d.color,
                        display: "inline-block",
                      }}
                      aria-hidden
                    />
                    {d.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--acct-font-display)",
                      fontSize: 15,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--acct-bg-soft)",
                    }}
                  >
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

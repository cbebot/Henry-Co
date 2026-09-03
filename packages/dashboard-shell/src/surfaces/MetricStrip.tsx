/**
 * MetricStrip — a horizontal strip of 3-5 metrics.
 *
 * ACCOUNT-PREMIUM-01, Phase 2.
 *
 * Replaces ad-hoc <div className="grid grid-cols-3">{metricCards}</div>
 * patterns scattered across division landings. Renders REAL numbers
 * only; an empty metric (count === 0) is allowed and renders cleanly,
 * but a missing metric (no upstream data) should NOT be passed in.
 *
 * Optional `sparkline` (an inline SVG path string `M0,12 L8,9 …`) renders
 * a tiny inline trend under the value. Caller computes the path.
 *
 * Each cell can either be a static metric or a link to a deeper surface.
 * The cell becomes a focus-visible target when `href` is set.
 *
 * Tones map to a status hue on the value:
 *   default | success | warning | danger
 */

import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

export type MetricStripContext = {
  /** "+12%", "-3", "stable" — short, parseable. */
  delta: string;
  /** Direction — drives the leading icon. */
  direction?: "up" | "down" | "flat";
  /** Optional comparator ("vs last month", "vs first run"). */
  vs?: string;
};

export type MetricStripCell = {
  /** All-caps kicker label. */
  label: string;
  /** The value — caller formats kobo / currency / percent. */
  value: string | number;
  /** Optional context — delta and direction. */
  context?: MetricStripContext;
  /** Optional href to a deeper surface. Whole cell becomes a link. */
  href?: string;
  /** Optional sparkline path (`M0,h L w,h ...`); rendered in a 100x26 viewport. */
  sparklinePath?: string;
  /** Tone — colors the value. */
  tone?: "default" | "success" | "warning" | "danger";
};

export type MetricStripProps = {
  /** 3-5 cells. */
  cells: ReadonlyArray<MetricStripCell>;
  /** Aria label for the strip. */
  ariaLabel?: string;
};

function renderTrendIcon(direction: MetricStripContext["direction"]) {
  if (direction === "up") return <TrendingUp size={12} aria-hidden />;
  if (direction === "down") return <TrendingDown size={12} aria-hidden />;
  if (direction === "flat") return <Minus size={12} aria-hidden />;
  return null;
}

function renderCellInner(cell: MetricStripCell) {
  return (
    <>
      <span className="acct-metric-strip__label">{cell.label}</span>
      <span className="acct-metric-strip__value">{cell.value}</span>
      {cell.context ? (
        <span className="acct-metric-strip__context">
          {renderTrendIcon(cell.context.direction)}
          <span>{cell.context.delta}</span>
          {cell.context.vs ? <span style={{ opacity: 0.66 }}>{cell.context.vs}</span> : null}
        </span>
      ) : null}
      {cell.sparklinePath ? (
        <svg
          className="acct-metric-strip__sparkline"
          viewBox="0 0 100 26"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={cell.sparklinePath}
            stroke="currentColor"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </>
  );
}

export function MetricStrip({ cells, ariaLabel }: MetricStripProps) {
  return (
    <div
      className="acct-metric-strip"
      role="list"
      aria-label={ariaLabel}
    >
      {cells.map((cell, i) =>
        cell.href ? (
          <a
            key={`${cell.label}-${i}`}
            className="acct-metric-strip__cell"
            data-tone={cell.tone ?? "default"}
            href={cell.href}
            role="listitem"
            aria-label={`${cell.label}: ${cell.value}`}
          >
            {renderCellInner(cell)}
            <ArrowUpRight
              size={12}
              aria-hidden
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                opacity: 0.45,
              }}
            />
          </a>
        ) : (
          <div
            key={`${cell.label}-${i}`}
            className="acct-metric-strip__cell"
            data-tone={cell.tone ?? "default"}
            role="listitem"
            aria-label={`${cell.label}: ${cell.value}`}
          >
            {renderCellInner(cell)}
          </div>
        ),
      )}
    </div>
  );
}

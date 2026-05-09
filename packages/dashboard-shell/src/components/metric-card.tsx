import type { CSSProperties, ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";

/**
 * MetricCard — a labelled metric with REQUIRED context.
 *
 * Closes anti-pattern #18 (metrics without context). The TypeScript
 * prop type is a discriminated union: `comparison` OR `trend`. There
 * is no shape that allows `{label, value}` alone — the type-checker
 * fails compilation if a caller forgets context.
 *
 * `comparison` — for "$1,234 vs last month" style:
 *   { kind: "comparison", vs: "last month", delta: "+12%" }
 *
 * `trend` — for arrow + magnitude:
 *   { kind: "trend", direction: "up" | "down" | "flat", magnitude: "+18 in 7d" }
 */
export type MetricContextComparison = {
  kind: "comparison";
  /** What the comparison is against — "last month", "yesterday", "first run". */
  vs: string;
  /** The signed magnitude — "+12%", "-3", "$240 less". */
  delta: string;
};

export type MetricContextTrend = {
  kind: "trend";
  direction: "up" | "down" | "flat";
  /** Free-form magnitude — "+18 in 7d", "stable", "down 4 since Mon". */
  magnitude: string;
};

export type MetricContext = MetricContextComparison | MetricContextTrend;

export type MetricCardProps = {
  /** All-caps eyebrow above the metric. */
  label: string;
  /** The headline number / string. */
  value: string;
  /** Trailing icon — divider on the right side of the label row. */
  icon?: ReactNode;
  /**
   * REQUIRED context. Either a comparison ("vs last month: +12%") or
   * a trend ("up: +18 in 7d"). Never both, never neither.
   */
  context: MetricContext;
  /** Make the whole card a link. */
  href?: string;
  /** Optional click handler — used when href is absent and the card
   * triggers a server action. */
  onClick?: () => void;
};

export function MetricCard({ label, value, icon, context, href, onClick }: MetricCardProps) {
  const inner = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <p
          style={{
            ...typeStyle("kicker"),
            color: `var(${CSS_VARS.inkMuted})`,
            margin: 0,
          }}
        >
          {label}
        </p>
        {icon ? (
          <span aria-hidden style={{ color: `var(${CSS_VARS.accentText})`, display: "inline-flex" }}>
            {icon}
          </span>
        ) : null}
      </div>
      <p
        style={{
          ...typeStyle("title"),
          color: `var(${CSS_VARS.ink})`,
          marginTop: "0.5rem",
          marginBottom: 0,
          ...displayValueStyle(value),
        }}
        // The class hooks the global @keyframes hc-metric-arrive (defined
        // in apps/account/app/globals.css) so the figure rises 4px and
        // settles. Reduced-motion strips the animation.
        className="hc-metric-value"
      >
        {value}
      </p>
      <p
        style={{
          ...typeStyle("small"),
          color: `var(${CSS_VARS.inkSoft})`,
          marginTop: "0.25rem",
          marginBottom: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        {renderContextLeading(context)}
        {renderContextText(context)}
      </p>
    </>
  );

  const baseStyle = {
    display: "block",
    backgroundColor: `var(${CSS_VARS.surface})`,
    border: `1px solid var(${CSS_VARS.hairline})`,
    borderRadius: RADIUS.xl,
    padding: SPACING.inset.lg,
    color: `var(${CSS_VARS.ink})`,
    textDecoration: "none",
    transition: "box-shadow 200ms ease-out, transform 120ms ease-in-out",
  };

  if (href) {
    return (
      <a href={href} style={baseStyle}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={{ ...baseStyle, textAlign: "left", cursor: "pointer", border: `1px solid var(${CSS_VARS.hairline})` }}>
        {inner}
      </button>
    );
  }
  return <div style={baseStyle}>{inner}</div>;
}

function renderContextLeading(ctx: MetricContext): ReactNode {
  if (ctx.kind === "trend") {
    if (ctx.direction === "up") return <TrendingUp size={14} aria-hidden />;
    if (ctx.direction === "down") return <TrendingDown size={14} aria-hidden />;
    return <Minus size={14} aria-hidden />;
  }
  return null;
}

function renderContextText(ctx: MetricContext): ReactNode {
  if (ctx.kind === "comparison") {
    return (
      <>
        <span>{ctx.delta}</span>
        <span style={{ opacity: 0.6 }}>vs {ctx.vs}</span>
      </>
    );
  }
  return <span>{ctx.magnitude}</span>;
}

/**
 * Promote concise headline values to display-font hero scale.
 *
 * The dashboard ships a serif display token (Iowan Old Style → Baskerville
 * → Palatino → Times) that is rarely used at impact size. Numeric / currency
 * values short enough to typeset in one line get the editorial treatment:
 * a clamp() font-size that scales with viewport, old-style figures, tight
 * letter-spacing, and a `hc-metric-value` class hook for arrival motion.
 *
 * Strings that are *not* numeric (status words, labels) keep the existing
 * `typeStyle("title")` so we don't accidentally apply oldstyle figures to
 * "Active" or "Pending" — those read better in sans-serif at conventional
 * weight.
 */
function displayValueStyle(value: string): CSSProperties {
  const trimmed = value.trim();
  if (!trimmed) return {};
  // Allow currency symbols, digits, separators, decimals, percent, "+/-",
  // and a single trailing letter cluster up to 3 chars (e.g. "12.4k", "3M").
  const isHeadlineNumeric =
    trimmed.length <= 9 &&
    /^[+\-]?[₦$£€]?\s?[0-9][0-9,. ]*\s?[%kKmMbB]?$/.test(trimmed);
  if (!isHeadlineNumeric) return {};
  return {
    fontFamily:
      'var(--acct-font-display, "Iowan Old Style", "Baskerville", "Palatino Linotype", "Times New Roman", serif)',
    fontWeight: 500,
    fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
    lineHeight: 1.05,
    letterSpacing: "-0.01em",
    fontFeatureSettings: '"lnum" 0, "onum" 1, "kern" 1, "ss01" 1',
    fontVariantNumeric: "oldstyle-nums proportional-nums",
  };
}

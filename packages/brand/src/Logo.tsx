/**
 * HenryCoLogo — the single source of truth for the brand mark.
 *
 * No external image asset is loaded. The mark is drawn as an inline SVG so it:
 *   - renders identically in every app (web, mobile-web)
 *   - inherits text/accent color via `currentColor`
 *   - is crisp at every density (no DPR rasterisation)
 *   - never produces a 404 / broken-image silhouette
 *
 * The mark is the HenryCo monogram: a crowned “H” inside a rounded square.
 * `tone` selects accent palettes registered for divisions; `accent` allows an
 * arbitrary CSS color (any hex, var(), or rgb()) to override the tone, which is
 * what enables “color can differ” per surface while keeping ONE source of truth.
 */
import * as React from "react";

export type HenryCoLogoTone =
  | "default" // gold on near-black tile
  | "mono" // currentColor on transparent (use anywhere)
  | "ink" // ink-on-paper for light surfaces
  | "paper" // paper-on-ink for dark surfaces
  | "accent"; // accent on transparent

export type HenryCoLogoVariant = "tile" | "wordmark" | "mark";

export interface HenryCoLogoProps
  extends Omit<React.SVGProps<SVGSVGElement>, "children"> {
  /** Square size in CSS px (height = width). */
  size?: number;
  /** Pre-defined tone palette. Default `"default"`. */
  tone?: HenryCoLogoTone;
  /** Override the foreground color (any CSS color). Wins over tone. */
  accent?: string;
  /** Tile background override. Defaults from tone. */
  background?: string;
  /** Mark only (no tile), tile (default), or with “HENRY & CO.” wordmark. */
  variant?: HenryCoLogoVariant;
  /** Accessible label. Defaults to “HenryCo”. Pass an empty string for decorative usage (uses aria-hidden instead). */
  label?: string;
}

const DEFAULT_FG = "#C9A227";
const DEFAULT_BG = "#0B0F1A";

function paletteFor(tone: HenryCoLogoTone) {
  switch (tone) {
    case "mono":
      return { fg: "currentColor", bg: "transparent" };
    case "ink":
      return { fg: "#0B0F1A", bg: "#FFFFFF" };
    case "paper":
      return { fg: "#FFFFFF", bg: "#0B0F1A" };
    case "accent":
      return { fg: DEFAULT_FG, bg: "transparent" };
    case "default":
    default:
      return { fg: DEFAULT_FG, bg: DEFAULT_BG };
  }
}

/**
 * Inline SVG mark — a crowned, monogram “H” sitting inside a 64×64 viewBox.
 *
 * Geometry notes (kept self-documenting for future tweaks):
 *   - Outer tile rounded at 14 (≈22% radius).
 *   - The “H” is two 8-px verticals at x=20 and x=44 with a 4-px crossbar at y=32.
 *   - The crown is a thin 12-px arc above the cross — meant to read as the
 *     ampersand-ish flourish in “Henry & Co.” without being literal text.
 */
export function HenryCoLogo({
  size = 40,
  tone = "default",
  accent,
  background,
  variant = "tile",
  label = "HenryCo",
  className,
  style,
  ...rest
}: HenryCoLogoProps) {
  const palette = paletteFor(tone);
  const fg = accent || palette.fg;
  const bg = background ?? palette.bg;
  const decorative = label === "";

  const a11yProps: React.SVGProps<SVGSVGElement> = decorative
    ? { "aria-hidden": true, focusable: false }
    : { role: "img", "aria-label": label };

  if (variant === "wordmark") {
    const w = Math.max(size * 3.4, 100);
    return (
      <svg
        viewBox="0 0 220 64"
        width={w}
        height={size}
        className={className}
        style={style}
        {...a11yProps}
        {...rest}
      >
        <Mark fg={fg} bg={bg} variant="tile" />
        <g transform="translate(78,0)" fill={fg}>
          <text
            x="0"
            y="38"
            fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            fontWeight={700}
            fontSize={20}
            letterSpacing={3}
          >
            HENRY &amp; CO.
          </text>
          <text
            x="0"
            y="56"
            fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            fontWeight={500}
            fontSize={9}
            letterSpacing={4}
            opacity={0.62}
          >
            CORPORATE PLATFORM
          </text>
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={style}
      {...a11yProps}
      {...rest}
    >
      <Mark fg={fg} bg={bg} variant={variant} />
    </svg>
  );
}

function Mark({
  fg,
  bg,
  variant,
}: {
  fg: string;
  bg: string;
  variant: HenryCoLogoVariant;
}) {
  return (
    <>
      {variant !== "mark" ? (
        <rect
          x={1}
          y={1}
          width={62}
          height={62}
          rx={14}
          ry={14}
          fill={bg}
          stroke={fg}
          strokeOpacity={0.18}
          strokeWidth={1}
        />
      ) : null}
      {/* Crown flourish */}
      <path
        d="M18 18 Q32 8 46 18"
        fill="none"
        stroke={fg}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Left vertical of H */}
      <rect x={20} y={20} width={6} height={28} rx={1.5} fill={fg} />
      {/* Right vertical of H */}
      <rect x={38} y={20} width={6} height={28} rx={1.5} fill={fg} />
      {/* Crossbar */}
      <rect x={20} y={31} width={24} height={4} rx={1} fill={fg} />
      {/* Co. dot — subtle right-foot */}
      <circle cx={46} cy={50} r={2} fill={fg} opacity={0.8} />
    </>
  );
}

export default HenryCoLogo;

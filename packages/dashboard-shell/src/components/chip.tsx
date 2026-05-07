import type { CSSProperties, ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";

/**
 * Chip — small inline label, used for status tags, role pills,
 * division accents.
 *
 * Tone variants:
 *   - `accent` — gold-soft fill, gold text (HenryCo brand)
 *   - `success` — green-soft fill, green text
 *   - `warning` — amber-soft fill, amber text
 *   - `urgent` — red-soft fill, red text
 *   - `neutral` — grey-soft fill, ink text
 *   - `outline` — transparent fill, hairline border, ink text
 */
export type ChipProps = {
  tone?: "accent" | "success" | "warning" | "urgent" | "neutral" | "outline";
  children: ReactNode;
  /** Optional leading icon. */
  leading?: ReactNode;
};

const TONE_STYLES: Record<NonNullable<ChipProps["tone"]>, CSSProperties> = {
  accent: {
    backgroundColor: `var(${CSS_VARS.accentSoft})`,
    color: `var(${CSS_VARS.accentText})`,
  },
  success: { backgroundColor: "#E6F4EC", color: "#1F8B4C" },
  warning: { backgroundColor: "#FFF4D6", color: "#8A6F00" },
  urgent: { backgroundColor: "#FCE8E0", color: "#A33B14" },
  neutral: { backgroundColor: "rgba(10,10,10,0.06)", color: `var(${CSS_VARS.ink})` },
  outline: {
    backgroundColor: "transparent",
    color: `var(${CSS_VARS.ink})`,
    border: `1px solid var(${CSS_VARS.hairline})`,
  },
};

export function Chip({ tone = "neutral", children, leading }: ChipProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.25rem 0.65rem",
        borderRadius: RADIUS.pill,
        ...typeStyle("micro"),
        whiteSpace: "nowrap",
        ...TONE_STYLES[tone],
      }}
    >
      {leading ? <span aria-hidden style={{ display: "inline-flex" }}>{leading}</span> : null}
      {children}
    </span>
  );
}

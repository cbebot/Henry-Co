import type { CSSProperties, ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS, STATUS_VARS } from "../tokens/color";
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
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${CSS_VARS.accent}) 20%, transparent)`,
  },
  success: {
    backgroundColor: `var(${STATUS_VARS.success.bg})`,
    color: `var(${STATUS_VARS.success.text})`,
    boxShadow: `inset 0 0 0 1px var(${STATUS_VARS.success.border})`,
  },
  warning: {
    backgroundColor: `var(${STATUS_VARS.warning.bg})`,
    color: `var(${STATUS_VARS.warning.text})`,
    boxShadow: `inset 0 0 0 1px var(${STATUS_VARS.warning.border})`,
  },
  urgent: {
    backgroundColor: `var(${STATUS_VARS.danger.bg})`,
    color: `var(${STATUS_VARS.danger.text})`,
    boxShadow: `inset 0 0 0 1px var(${STATUS_VARS.danger.border})`,
  },
  neutral: {
    backgroundColor: `var(${CSS_VARS.surfaceSunken})`,
    color: `var(${CSS_VARS.textSecondary})`,
    boxShadow: `inset 0 0 0 1px var(${CSS_VARS.borderSubtle})`,
  },
  outline: {
    backgroundColor: "transparent",
    color: `var(${CSS_VARS.textSecondary})`,
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

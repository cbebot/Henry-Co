import type { CSSProperties } from "react";
import { CSS_VARS } from "../tokens/color";
import { typeStyle } from "../tokens/type";
import { RADIUS } from "../tokens/spacing";

/**
 * Badge — circular indicator with a count or a single character.
 *
 * Used by IdentityBar for unread notifications, by WorkspaceRail for
 * per-module signal counts, and by ContextDrawer category items.
 *
 * Visual: 1.25rem diameter circle, accent fill, ink-on-white text,
 * micro-typography. Honors `prefers-reduced-motion` (no pulse animation
 * unless explicitly enabled via `pulse=true`).
 */
export type BadgeProps = {
  /** The count or character. Numbers > 99 render as "99+". */
  value: number | string;
  /** Tone — defaults to `accent` (HenryCo gold). */
  tone?: "accent" | "success" | "warning" | "urgent" | "neutral";
  /** Optional pulse animation for newly-arrived signals. */
  pulse?: boolean;
};

const TONE_STYLES: Record<NonNullable<BadgeProps["tone"]>, CSSProperties> = {
  accent: {
    backgroundColor: `var(${CSS_VARS.accent})`,
    color: "white",
  },
  success: { backgroundColor: "#1F8B4C", color: "white" },
  warning: { backgroundColor: "#C9A227", color: "white" },
  urgent: { backgroundColor: "#C04A1F", color: "white" },
  neutral: {
    backgroundColor: `var(${CSS_VARS.ink})`,
    color: "white",
  },
};

export function Badge({ value, tone = "accent", pulse }: BadgeProps) {
  const display = typeof value === "number" && value > 99 ? "99+" : String(value);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "1.25rem",
        height: "1.25rem",
        padding: "0 0.4rem",
        borderRadius: RADIUS.pill,
        ...typeStyle("micro"),
        ...TONE_STYLES[tone],
        animation: pulse ? "henrycoBadgePulse 1.6s ease-in-out infinite" : undefined,
      }}
      aria-label={typeof value === "number" ? `${value} new` : display}
    >
      {display}
    </span>
  );
}

import type { CSSProperties } from "react";

import { typeStyle } from "../tokens/type";
import { CSS_VARS, STATUS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";

/**
 * SLAChip — color-coded urgency indicator for staff queue rows.
 *
 * Rendered on every queue card per Track C trust requirement:
 * "every queue card shows its SLA timer (target_response_at,
 * target_resolution_at) with color-coded urgency."
 *
 * Buckets:
 *   - healthy : > 30 min remaining       → green   (STATUS.success)
 *   - warning : 0–30 min remaining       → amber   (STATUS.warning)
 *   - breach  : past target_response_at  → red     (STATUS.urgent / STATUS.security)
 *   - done    : action taken             → neutral (STATUS.info)
 */

export type SLABucket = "healthy" | "warning" | "breach" | "done";

export type SLAChipProps = {
  /** Urgency bucket. Drives color + label. */
  bucket: SLABucket;
  /** Optional explicit countdown label, e.g. "12m" or "−3h". When present, replaces the auto-derived label. */
  label?: string;
  /** Optional ISO timestamp to derive countdown from. Either `label` or `dueAt` should be set. */
  dueAt?: string;
  /** Compact mode — render the dot only, with a sr-only label. Used in WorkspaceRail badges. */
  compact?: boolean;
};

function deriveLabel(bucket: SLABucket, dueAt?: string): string {
  if (bucket === "done") return "done";
  if (!dueAt) {
    return bucket === "healthy" ? "on track" : bucket === "warning" ? "due soon" : "breach";
  }
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return bucket;

  const deltaMin = Math.round((due - Date.now()) / 60_000);
  if (deltaMin >= 60) return `${Math.round(deltaMin / 60)}h`;
  if (deltaMin >= 0) return `${deltaMin}m`;
  if (deltaMin > -60) return `−${Math.abs(deltaMin)}m`;
  return `−${Math.abs(Math.round(deltaMin / 60))}h`;
}

const BUCKET_STYLE: Record<SLABucket, { fg: string; bg: string; ring: string }> = {
  healthy: {
    fg: STATUS.success,
    bg: "rgba(31, 139, 76, 0.10)",
    ring: "rgba(31, 139, 76, 0.30)",
  },
  warning: {
    fg: STATUS.warning,
    bg: "rgba(201, 162, 39, 0.12)",
    ring: "rgba(201, 162, 39, 0.36)",
  },
  breach: {
    fg: STATUS.security,
    bg: "rgba(185, 28, 28, 0.12)",
    ring: "rgba(185, 28, 28, 0.40)",
  },
  done: {
    fg: STATUS.info,
    bg: "rgba(75, 85, 99, 0.10)",
    ring: "rgba(75, 85, 99, 0.30)",
  },
};

export function SLAChip({ bucket, label, dueAt, compact }: SLAChipProps) {
  const text = label ?? deriveLabel(bucket, dueAt);
  const palette = BUCKET_STYLE[bucket];

  if (compact) {
    return (
      <span
        aria-label={`SLA ${bucket}: ${text}`}
        style={{
          display: "inline-block",
          width: "0.5rem",
          height: "0.5rem",
          borderRadius: "9999px",
          background: palette.fg,
          boxShadow: `0 0 0 2px ${palette.bg}`,
        }}
      />
    );
  }

  const style: CSSProperties = {
    ...typeStyle("kicker"),
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.125rem 0.5rem",
    borderRadius: RADIUS.pill,
    color: palette.fg,
    background: palette.bg,
    boxShadow: `inset 0 0 0 1px ${palette.ring}`,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };

  return (
    <span style={style} aria-label={`SLA ${bucket}: ${text}`}>
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: "0.4rem",
          height: "0.4rem",
          borderRadius: "9999px",
          background: palette.fg,
        }}
      />
      {text}
    </span>
  );
}

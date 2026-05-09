import type { SLABucket } from "@henryco/dashboard-shell";

/**
 * Derive an SLA bucket from a target_response_at timestamp.
 *
 * The Track C SLA visibility requirement: every queue card shows its
 * SLA timer with color-coded urgency. This helper centralises the
 * threshold logic so the warning window is consistent across modules.
 *
 * Thresholds:
 *   > 30 min remaining   → healthy (green)
 *   0-30 min remaining   → warning (amber)
 *   past target          → breach (red)
 *   no target / done     → done (neutral)
 *
 * Modules with module-specific thresholds (e.g. logistics dispatch
 * uses 10/30 minute thresholds for warning) override locally.
 */
export function deriveSLABucket(
  targetResponseAt: string | null | undefined,
  options?: { warningMinutes?: number; donePredicate?: boolean },
): SLABucket {
  if (options?.donePredicate) return "done";
  if (!targetResponseAt) return "done";
  const due = Date.parse(targetResponseAt);
  if (Number.isNaN(due)) return "done";
  const deltaMin = (due - Date.now()) / 60_000;
  if (deltaMin < 0) return "breach";
  if (deltaMin <= (options?.warningMinutes ?? 30)) return "warning";
  return "healthy";
}

/**
 * Format a relative timestamp for queue rows. Compact density-first
 * shape: "12m", "3h", "2d", "in 4m", "−45m".
 */
export function formatRelative(timestamp: string | null | undefined): string {
  if (!timestamp) return "—";
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return "—";
  const deltaMin = (Date.now() - t) / 60_000;
  if (deltaMin < 0) {
    const a = Math.abs(Math.round(deltaMin));
    if (a < 60) return `in ${a}m`;
    if (a < 60 * 24) return `in ${Math.round(a / 60)}h`;
    return `in ${Math.round(a / (60 * 24))}d`;
  }
  if (deltaMin < 1) return "now";
  if (deltaMin < 60) return `${Math.round(deltaMin)}m`;
  if (deltaMin < 60 * 24) return `${Math.round(deltaMin / 60)}h`;
  return `${Math.round(deltaMin / (60 * 24))}d`;
}

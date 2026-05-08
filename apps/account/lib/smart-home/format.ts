import "server-only";

/**
 * Shared formatting helpers for the Smart Home composition.
 *
 * Until DASH-4 follow-up these were duplicated three ways across
 * SignalFeed, AttentionPanel, and the recommender — and the priority
 * map silently dropped real database strings (`'critical'`, `'high'`,
 * `'normal'`, `'low'`, `'success'`) into `"info"`. That meant truly
 * urgent items rendered as ambient noise on the home surface. This
 * module is the single source.
 *
 * Boundaries:
 *   - `mapSignalPriority`         — every priority string `get_signal_feed`
 *                                   can emit, mapped to the SignalCard enum.
 *   - `formatRelative`            — "just now / 5m ago / 3h ago / 2d ago"
 *                                   with an injected `now` for testability.
 *   - `bucketRecency` + `RECENCY` — calendar-day bucketing in a viewer-
 *                                   provided IANA timezone (default
 *                                   `Africa/Lagos` since HenryCo's primary
 *                                   audience reads in Lagos local time).
 */

/** SignalCard's visual urgency enum — mirrored in @henryco/dashboard-shell. */
export type SignalUrgency = "info" | "warning" | "urgent" | "security";

/**
 * Map every priority string the signal sources emit into the visual
 * urgency tier the SignalCard renders.
 *
 * Sources observed at the DB layer (per audit + grep across producers):
 *   security  — wallet security challenges, account security log
 *   critical  — lifecycle critical-stage actionables, jobs/property
 *   urgent    — fraud / dispute opens
 *   blocking  — lifecycle blocking actionables (synonym of urgent)
 *   high      — jobs/property/lifecycle high actionables
 *   warning   — payment soft warnings
 *   normal    — default for plain notifications
 *   info      — explicit informational
 *   success   — completion notifications
 *   low       — back-burner items
 *
 * Mapping rationale:
 *   - `critical` joins `security` because both demand the same visual
 *     left-edge accent strip — they block the user's flow.
 *   - `urgent`, `blocking`, `high` collapse into `urgent` because all
 *     three demand attention without blocking.
 *   - `warning` is its own tier (soft amber).
 *   - `normal`, `info`, `success`, `low`, and unknown strings collapse
 *     into `info` — calm. `success` does NOT get a separate visual
 *     because the SignalCard primitive doesn't have a success tier
 *     and inventing one would conflict with the calm-by-default voice.
 */
export function mapSignalPriority(raw: string | null | undefined): SignalUrgency {
  switch ((raw ?? "").toLowerCase()) {
    case "security":
    case "critical":
      return "security";
    case "urgent":
    case "blocking":
    case "high":
      return "urgent";
    case "warning":
      return "warning";
    case "info":
    case "normal":
    case "success":
    case "low":
    case "":
    default:
      return "info";
  }
}

/**
 * "just now" / "Nm ago" / "Nh ago" / "Nd ago" / "Nmo ago".
 *
 * The output favours small, calm units. Day boundary is the literal
 * 24h mark, not the calendar day boundary — that's what `bucketRecency`
 * is for. Keeping these orthogonal keeps both honest.
 *
 * Returns `""` when the timestamp is unparseable (so callers can render
 * a blank cell rather than the literal string `"NaN ago"`).
 */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diffMs = Math.max(0, now - t);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Recency buckets used by the SignalFeed for calendar-day grouping. */
export type RecencyBucket = "today" | "yesterday" | "this-week" | "earlier";

export const RECENCY_LABEL: Record<RecencyBucket, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "this-week": "Earlier this week",
  earlier: "Earlier",
};

/** Render order for the SignalFeed bucket walker. */
export const RECENCY_ORDER: ReadonlyArray<RecencyBucket> = [
  "today",
  "yesterday",
  "this-week",
  "earlier",
];

/**
 * The default IANA timezone for HenryCo viewers. The user's
 * `UnifiedViewer` shape does not carry a timezone today; until that
 * field lands, default to the primary audience's wall-clock so
 * "Today / Yesterday" reflect the user's real day. When the field
 * lands, the SmartHome can pass it through and this default goes
 * untouched.
 */
export const DEFAULT_VIEWER_TIMEZONE = "Africa/Lagos";

/**
 * Return the viewer-local recency bucket for a given ISO timestamp.
 *
 * Why timezone matters: signal feed renders server-side and Vercel's
 * server runs in UTC. Lagos is UTC+1, so a notification at 23:30 Lagos
 * (22:30 UTC) is "today" for the user but the server's
 * `setHours(0,0,0,0)` would already place "today" 23h-30m in the
 * future — landing the row in `earlier` instead. Bucketing against the
 * viewer's calendar day is the only correct behaviour.
 *
 * Implementation: compute the timezone's offset at the reference moment
 * via `Intl.DateTimeFormat` parts, then truncate `now` to the start of
 * the *local* day in UTC ms. DST is not a concern for `Africa/Lagos`
 * (HenryCo's default), but the helper handles other zones correctly
 * because the offset is recomputed per-call.
 */
export function bucketRecency(
  iso: string,
  opts: { timezone?: string; now?: number } = {},
): RecencyBucket {
  const tz = opts.timezone ?? DEFAULT_VIEWER_TIMEZONE;
  const now = opts.now ?? Date.now();
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "earlier";

  const startOfTodayMs = startOfLocalDay(now, tz);
  const startOfYesterdayMs = startOfTodayMs - 24 * 60 * 60 * 1000;
  const startOfWeekMs = startOfTodayMs - 7 * 24 * 60 * 60 * 1000;

  if (t >= startOfTodayMs) return "today";
  if (t >= startOfYesterdayMs) return "yesterday";
  if (t >= startOfWeekMs) return "this-week";
  return "earlier";
}

/**
 * Group items by recency bucket while preserving each bucket's order.
 * Items with unparseable timestamps fall into `earlier` (calm fallback).
 */
export function groupByRecency<T extends { createdAt: string }>(
  items: ReadonlyArray<T>,
  opts: { timezone?: string; now?: number } = {},
): Record<RecencyBucket, T[]> {
  const out: Record<RecencyBucket, T[]> = {
    today: [],
    yesterday: [],
    "this-week": [],
    earlier: [],
  };
  for (const item of items) {
    out[bucketRecency(item.createdAt, opts)].push(item);
  }
  return out;
}

function startOfLocalDay(atMs: number, tz: string): number {
  const offsetMin = timezoneOffsetMinutes(tz, atMs);
  // Shift the moment by the timezone offset so UTC math on it
  // corresponds to wall-clock math in the target tz.
  const local = atMs + offsetMin * 60_000;
  // Truncate to UTC midnight of that shifted moment.
  const localDayStartUtc = new Date(local);
  localDayStartUtc.setUTCHours(0, 0, 0, 0);
  // Shift back to the actual UTC moment that represents wall-clock
  // 00:00 in the target tz.
  return localDayStartUtc.getTime() - offsetMin * 60_000;
}

function timezoneOffsetMinutes(tz: string, atMs: number): number {
  // Intl.DateTimeFormat doesn't expose offset directly. The trick:
  // format the moment in the target tz, parse the parts back as if
  // they were UTC, and compare to the original ms — the difference is
  // the offset.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(atMs));
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  const asUTCms = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUTCms - atMs) / 60_000);
}

/**
 * Pure rule helpers for the realtime spine.
 *
 * No React, no DOM. Used by the provider hooks + by server-side render
 * branches that want to apply the same logic.
 */

import type { RealtimePreferences } from "./realtime-types";

function parseHHMMToMinutes(value: string): number | null {
  const m = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Returns true if the current moment falls inside the user's configured
 * quiet hours. Uses `quiet_hours_timezone` if present (IANA), otherwise
 * the browser's local time.
 *
 * Edge case: when start > end the window crosses midnight (e.g.
 * 22:00 → 07:00). We treat the inclusion as
 * "now is in [start, 24:00) ∪ [00:00, end)".
 */
export function isWithinQuietHours(prefs: RealtimePreferences): boolean {
  if (!prefs.quiet_hours_enabled) return false;
  const startMin = parseHHMMToMinutes(prefs.quiet_hours_start);
  const endMin = parseHHMMToMinutes(prefs.quiet_hours_end);
  if (startMin === null || endMin === null) return false;

  const tz = prefs.quiet_hours_timezone;
  let nowMin: number;
  try {
    if (tz) {
      // Intl-based extraction — avoids dragging a tz library in. RangeError
      // on invalid tz falls through to local time.
      const fmt = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      });
      const parts = fmt.formatToParts(new Date());
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
      const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
      nowMin = h * 60 + m;
    } else {
      const now = new Date();
      nowMin = now.getHours() * 60 + now.getMinutes();
    }
  } catch {
    const now = new Date();
    nowMin = now.getHours() * 60 + now.getMinutes();
  }

  if (startMin === endMin) return false;
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  // crosses midnight
  return nowMin >= startMin || nowMin < endMin;
}

export function isMutedDivision(
  prefs: RealtimePreferences,
  division: string | null | undefined,
): boolean {
  if (!division) return false;
  const lowered = String(division).toLowerCase();
  for (const muted of prefs.muted_divisions) {
    if (muted.toLowerCase() === lowered) return true;
  }
  return false;
}

export function isMutedEventType(
  prefs: RealtimePreferences,
  category: string | null | undefined,
): boolean {
  if (!category) return false;
  const lowered = String(category).toLowerCase();
  for (const muted of prefs.muted_event_types) {
    if (muted.toLowerCase() === lowered) return true;
    // Wildcard convention: `marketplace.*` matches every category beginning
    // with `marketplace.`. The DB-side validation doesn't enforce this;
    // treating it as opt-in convention.
    if (muted.endsWith(".*") && lowered.startsWith(muted.slice(0, -1).toLowerCase())) {
      return true;
    }
  }
  return false;
}

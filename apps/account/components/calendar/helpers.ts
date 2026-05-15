import type { CalendarAggregate, CalendarEvent, CalendarKind } from "@henryco/data";

/**
 * V3 Wave A1 D4 helpers — calendar hero + division mix.
 */

export type CalendarState = "empty" | "calm" | "busy" | "packed";

export function calendarState(agg: CalendarAggregate): CalendarState {
  const total = agg.events.length;
  if (total === 0) return "empty";
  if (total <= 3) return "calm";
  if (total <= 12) return "busy";
  return "packed";
}

export function calendarHeadline(state: CalendarState, agg: CalendarAggregate): string {
  if (state === "empty") return "Nothing scheduled in the next 28 days.";
  if (state === "calm") {
    return agg.events.length === 1
      ? "One thing on the agenda."
      : `${agg.events.length} events in the next 28 days.`;
  }
  if (state === "busy") {
    return `${agg.events.length} events scheduled across ${Object.keys(agg.counts).filter((k) => agg.counts[k] > 0).length} portals.`;
  }
  return `${agg.events.length} events queued — block focus time wisely.`;
}

export function calendarBlurb(state: CalendarState): string {
  if (state === "empty") {
    return "Care bookings, property viewings, jobs interviews, studio milestones, learn classes and logistics windows all surface here.";
  }
  if (state === "calm") {
    return "Tap a card to jump to its portal. The agenda will refresh automatically as new scheduling lands.";
  }
  return "Filter chips at the top of the agenda narrow to a single portal — useful when one division is loud.";
}

export const KIND_LABEL: Record<CalendarKind, string> = {
  care_booking: "Care booking",
  property_viewing: "Property viewing",
  jobs_interview: "Interview",
  learn_class: "Live class",
  studio_milestone: "Studio milestone",
  logistics_pickup: "Pickup window",
  logistics_delivery: "Delivery window",
  room_session: "Room session",
};

export const KIND_ACCENT_VAR: Record<CalendarKind, string> = {
  care_booking: "--acct-div-care",
  property_viewing: "--acct-div-property",
  jobs_interview: "--acct-div-jobs",
  learn_class: "--acct-div-learn",
  studio_milestone: "--acct-div-studio",
  logistics_pickup: "--acct-div-logistics",
  logistics_delivery: "--acct-div-logistics",
  room_session: "--acct-div-staff",
};

/**
 * Friendly day label — Today / Tomorrow / "Sat, Apr 13".
 * Uses UTC date math so the SSR result is stable across timezones; the
 * display string is locale-formatted on the server. `nowMs` is passed
 * explicitly to keep this function pure (no Date.now()-on-render).
 */
export function dayLabel(iso: string, nowMs: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date(nowMs);
  today.setUTCHours(0, 0, 0, 0);
  const diff = Math.round(
    (date.getTime() - today.getTime()) / 86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Build top-3 portal mix for hero side panel.
 */
export function topMix(
  counts: Record<string, number>,
): ReadonlyArray<{ key: string; label: string; count: number; accentVar: string }> {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, count]) => ({
      key,
      label: portalLabel(key),
      count,
      accentVar: portalAccentVar(key),
    }));
}

function portalLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function portalAccentVar(key: string): string {
  switch (key) {
    case "care":
      return "--acct-div-care";
    case "property":
      return "--acct-div-property";
    case "jobs":
      return "--acct-div-jobs";
    case "studio":
      return "--acct-div-studio";
    case "learn":
      return "--acct-div-learn";
    case "logistics":
      return "--acct-div-logistics";
    default:
      return "--acct-gold";
  }
}

export function isFuture(event: CalendarEvent, nowMs: number): boolean {
  const ms = Date.parse(event.startAt);
  return Number.isFinite(ms) && ms >= nowMs;
}

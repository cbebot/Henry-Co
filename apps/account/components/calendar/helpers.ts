import type { CalendarAggregate, CalendarEvent, CalendarKind } from "@henryco/data";
import type { AccountCopy } from "@henryco/i18n";
import { formatAccountTemplate } from "@henryco/i18n";

/**
 * V3 Wave A1 D4 helpers — calendar hero + division mix.
 *
 * i18n: copy passed in from the RSC page so locale resolution stays at
 * the server boundary. Functions never read process state.
 */

type CalendarCopy = AccountCopy["calendar"];

export type CalendarState = "empty" | "calm" | "busy" | "packed";

export function calendarState(agg: CalendarAggregate): CalendarState {
  const total = agg.events.length;
  if (total === 0) return "empty";
  if (total <= 3) return "calm";
  if (total <= 12) return "busy";
  return "packed";
}

export function calendarHeadline(
  state: CalendarState,
  agg: CalendarAggregate,
  copy: CalendarCopy,
): string {
  if (state === "empty") return copy.headline.empty;
  if (state === "calm") {
    return agg.events.length === 1
      ? copy.headline.calmOne
      : formatAccountTemplate(copy.headline.calmMany, {
          count: agg.events.length,
        });
  }
  if (state === "busy") {
    return formatAccountTemplate(copy.headline.busy, {
      count: agg.events.length,
      portals: Object.keys(agg.counts).filter((k) => agg.counts[k] > 0).length,
    });
  }
  return formatAccountTemplate(copy.headline.packed, {
    count: agg.events.length,
  });
}

export function calendarBlurb(state: CalendarState, copy: CalendarCopy): string {
  if (state === "empty") return copy.blurb.empty;
  if (state === "calm") return copy.blurb.calm;
  return copy.blurb.busyOrPacked;
}

export function kindLabel(kind: CalendarKind, copy: CalendarCopy): string {
  return copy.kindLabels[kind];
}

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
export function dayLabel(
  iso: string,
  nowMs: number,
  copy: CalendarCopy,
  intlLocale: string,
): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date(nowMs);
  today.setUTCHours(0, 0, 0, 0);
  const diff = Math.round(
    (date.getTime() - today.getTime()) / 86_400_000,
  );
  if (diff === 0) return copy.dayLabels.today;
  if (diff === 1) return copy.dayLabels.tomorrow;
  if (diff === -1) return copy.dayLabels.yesterday;
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function timeLabel(iso: string, intlLocale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Build top-3 portal mix for hero side panel.
 */
export function topMix(
  counts: Record<string, number>,
  copy: CalendarCopy,
): ReadonlyArray<{ key: string; label: string; count: number; accentVar: string }> {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, count]) => ({
      key,
      label: portalLabel(key, copy),
      count,
      accentVar: portalAccentVar(key),
    }));
}

function portalLabel(key: string, copy: CalendarCopy): string {
  const map = copy.portalLabels as Record<string, string | undefined>;
  return map[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
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

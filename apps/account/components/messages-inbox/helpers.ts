import type { InboxAggregate, InboxDivision } from "@henryco/data";

/**
 * V3 Wave A1 D3 helpers — inbox hero + filter chip math.
 */

export type InboxState = "zero" | "calm" | "busy" | "overloaded";

export type InboxHeadlineKey = "zero" | "calmOne" | "calmMany" | "busy" | "overloaded";

export type InboxBlurbKey = "zero" | "calm" | "busy" | "overloaded";

export function inboxState(agg: InboxAggregate): InboxState {
  const open = agg.totalOpen;
  const unread = agg.totalUnread;
  if (open === 0 && unread === 0) return "zero";
  if (open <= 2 && unread <= 1) return "calm";
  if (open <= 8) return "busy";
  return "overloaded";
}

/**
 * Map (state, aggregate) → the headline key the caller should pull from
 * the localised `messages.headlines` slice. The headline templates carry
 * any `{count}`/`{unread}`/`{open}` interpolation themselves — this
 * helper only chooses which key applies.
 */
export function inboxHeadlineKey(
  state: InboxState,
  agg: InboxAggregate,
): InboxHeadlineKey {
  if (state === "zero") return "zero";
  if (state === "calm") return agg.totalUnread === 1 ? "calmOne" : "calmMany";
  if (state === "busy") return "busy";
  return "overloaded";
}

export function inboxBlurbKey(state: InboxState): InboxBlurbKey {
  if (state === "zero") return "zero";
  if (state === "calm") return "calm";
  if (state === "busy") return "busy";
  return "overloaded";
}

/**
 * Mapping from inbox division → CSS custom-property name for the
 * division accent (matches `--acct-div-*` in apps/account/app/globals.css).
 */
export const DIVISION_ACCENT_VAR: Record<InboxDivision, string> = {
  support: "--acct-gold",
  marketplace: "--acct-div-marketplace",
  jobs: "--acct-div-jobs",
  studio: "--acct-div-studio",
  care: "--acct-div-care",
  property: "--acct-div-property",
  logistics: "--acct-div-logistics",
  learn: "--acct-div-learn",
};

/**
 * Render a relative-time string. `nowMs` is passed by the caller so
 * the helper stays pure (React 19 component-purity rule — no Date.now
 * during render). The leading-em-dash fallback is also rendered for an
 * unparseable timestamp, so callers can use this directly.
 */
export function formatRelative(iso: string | null, nowMs: number): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const delta = nowMs - ms;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h`;
  if (delta < 604_800_000) return `${Math.round(delta / 86_400_000)}d`;
  return `${Math.round(delta / 604_800_000)}w`;
}

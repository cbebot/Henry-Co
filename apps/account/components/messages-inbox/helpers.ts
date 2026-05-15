import type { InboxAggregate, InboxDivision } from "@henryco/data";

/**
 * V3 Wave A1 D3 helpers — inbox hero + filter chip math.
 */

export type InboxState = "zero" | "calm" | "busy" | "overloaded";

export function inboxState(agg: InboxAggregate): InboxState {
  const open = agg.totalOpen;
  const unread = agg.totalUnread;
  if (open === 0 && unread === 0) return "zero";
  if (open <= 2 && unread <= 1) return "calm";
  if (open <= 8) return "busy";
  return "overloaded";
}

export function inboxHeadline(state: InboxState, agg: InboxAggregate): string {
  if (state === "zero") return "Inbox zero across HenryCo.";
  if (state === "calm") {
    return agg.totalUnread === 1
      ? "One thread is waiting on you."
      : `${agg.totalOpen} threads are open.`;
  }
  if (state === "busy") {
    return `${agg.totalUnread} unread · ${agg.totalOpen} open across your portals.`;
  }
  return `${agg.totalUnread} unread across ${agg.totalOpen} open threads.`;
}

export function inboxBlurb(state: InboxState): string {
  if (state === "zero") {
    return "Everything across support, marketplace, jobs, studio, care, property, logistics and learn is acknowledged.";
  }
  if (state === "calm") {
    return "A short reply now keeps the loop closed before tomorrow.";
  }
  if (state === "busy") {
    return "Tap a row to open the thread, or filter to one portal at a time.";
  }
  return "Sweep through divisions one by one — newest threads at the top.";
}

export const DIVISION_LABEL: Record<InboxDivision, string> = {
  support: "Support",
  marketplace: "Marketplace",
  jobs: "Jobs",
  studio: "Studio",
  care: "Care",
  property: "Property",
  logistics: "Logistics",
  learn: "Learn",
};

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
 * during render).
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

/**
 * @henryco/notifications/delivery-state — V3-03.
 *
 * The delivery state machine for in-app notifications + support
 * messages:
 *
 *     ┌──────┐  realtime push log   ┌───────────┐  is_read=true   ┌──────┐
 *     │ sent │ ───────────────────▶ │ delivered │ ──────────────▶ │ seen │
 *     └──┬───┘                      └───────────┘                 └──────┘
 *        │
 *        │ hard bounce / 24h no delivery
 *        ▼
 *     ┌────────┐
 *     │ failed │ ◀── (terminal)
 *     └────────┘
 *
 * Rules:
 *  - Only the publisher writes 'sent' (at insert).
 *  - Only the realtime delivery-success path writes 'delivered'.
 *  - Only the mark-read flow (UI scroll-into-view or explicit POST)
 *    writes 'seen'.
 *  - 'failed' is terminal; the redelivery cron only bumps a row to
 *    'failed' after the email-fallback path also fails OR 24h
 *    elapsed with no delivery.
 *
 * This file is server-only.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "@henryco/notifications/delivery-state must only be imported from server code",
  );
}

export type DeliveryState = "sent" | "delivered" | "seen" | "failed";

const ALL_STATES: ReadonlySet<DeliveryState> = new Set([
  "sent",
  "delivered",
  "seen",
  "failed",
]);

export function isDeliveryState(value: unknown): value is DeliveryState {
  return typeof value === "string" && ALL_STATES.has(value as DeliveryState);
}

/**
 * Validate a forward transition. Returns true iff `next` is a legal
 * next state from `current` per the diagram above.
 *
 * Allowed:
 *   sent      → delivered, seen, failed
 *   delivered → seen, failed
 *   seen      → (terminal — no transitions)
 *   failed    → (terminal — no transitions)
 *
 * Note: sent → seen is allowed because a recipient can read a message
 * before the realtime push receipt comes back (race), and we don't
 * want to lose the seen signal in that case.
 */
export function canTransition(
  current: DeliveryState,
  next: DeliveryState,
): boolean {
  if (current === next) return false; // no-op transitions are not "advances"
  switch (current) {
    case "sent":
      return next === "delivered" || next === "seen" || next === "failed";
    case "delivered":
      return next === "seen" || next === "failed";
    case "seen":
    case "failed":
      return false; // terminal
  }
}

/**
 * Rank ordering for "is X further along than Y" — useful when a cron
 * race might attempt to walk a row backward.
 */
export function rank(state: DeliveryState): number {
  switch (state) {
    case "sent":
      return 0;
    case "delivered":
      return 1;
    case "seen":
      return 2;
    case "failed":
      return 3; // terminal, treated as higher than seen for ordering
  }
}

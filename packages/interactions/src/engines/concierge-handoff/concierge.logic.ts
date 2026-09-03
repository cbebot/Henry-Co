/**
 * Concierge Handoff Engine — pure trigger resolver (doctrine Engine 9).
 *
 * The concierge entry appears at exactly three moments:
 *  (a) 45s lingering on a decision page without action;
 *  (b) bouncing between two listings 3+ times;
 *  (c) on any post-success surface, as the Joy Engine's single next action.
 *
 * Post-success wins when several hold — it is the calmest, most consensual
 * entry. The surface is always opt-in, never a modal; the free path delivers
 * real value; premium appears only if the user explicitly asks for more.
 */

export const LINGER_MS = 45_000;
export const BOUNCE_THRESHOLD = 3;

export type HandoffTrigger = "linger" | "bounce" | "post_success";

export function resolveHandoffTrigger(
  lingerMs: number,
  bounceCount: number,
  postSuccess: boolean,
): HandoffTrigger | null {
  if (postSuccess) return "post_success";
  if (bounceCount >= BOUNCE_THRESHOLD) return "bounce";
  if (lingerMs >= LINGER_MS) return "linger";
  return null;
}

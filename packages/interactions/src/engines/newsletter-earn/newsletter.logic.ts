/**
 * Newsletter Earn Engine — pure surfacing predicate (doctrine Engine 7).
 *
 * The capture asks only AFTER a value moment: a primary action succeeded,
 * or the user chose to read past 70% of a content page. Never on landing,
 * never as a modal, never twice a session, never more than weekly.
 * Smaller, higher-intent list beats a bigger, resentful one.
 */

export const SCROLL_THRESHOLD_PCT = 70;
export const ASK_COOLDOWN_MS = 7 * 24 * 3600 * 1000;

export interface NewsletterMoment {
  primarySucceeded: boolean;
  /** 0–100 page scroll depth. */
  scrollDepth: number;
  /** Wall-clock ms of the last cross-session ask, or null. */
  lastAskedAt: number | null;
  askedThisSession: boolean;
}

export function shouldSurfaceCapture(moment: NewsletterMoment, now: number): boolean {
  if (moment.askedThisSession) return false;
  if (moment.lastAskedAt != null && now - moment.lastAskedAt < ASK_COOLDOWN_MS) return false;
  return moment.primarySucceeded || moment.scrollDepth >= SCROLL_THRESHOLD_PCT;
}

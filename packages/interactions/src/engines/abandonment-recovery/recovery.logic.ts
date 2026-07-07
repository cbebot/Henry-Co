/**
 * Abandonment Recovery Engine — pure trigger resolver (doctrine Engine 4 /
 * Principle 16).
 *
 * "Recovery is an apology for any friction WE caused" — never a weapon.
 * A recovery may fire only when ALL of these hold:
 *  - the user paused ≥20s on a multi-step flow (or exited the page);
 *  - the user EXPLICITLY consented to recovery contact for this flow type;
 *  - the surface is high-intent (checkout, booking, listing creation,
 *    application) — not casual browsing;
 *  - no recovery for this flow in the last 7 days (frequency cap).
 *
 * No fake countdowns, no "you might lose your spot", no discount training.
 */

export const IDLE_MS = 20_000;
export const RECOVERY_CAP_MS = 7 * 24 * 3600 * 1000;

export interface RecoveryTrigger {
  trigger: "idle" | "exit";
}

export function shouldTriggerRecovery(
  idleMs: number,
  consented: boolean,
  highIntent: boolean,
  lastSentAt: number | null,
  now: number,
): RecoveryTrigger | null {
  if (!consented || !highIntent) return null;
  if (lastSentAt != null && now - lastSentAt < RECOVERY_CAP_MS) return null;
  if (idleMs >= IDLE_MS) return { trigger: "idle" };
  return null;
}

/** Exit-path variant: page unload with a dirty draft. Same consent + cap gates. */
export function shouldTriggerExitRecovery(
  hasDraft: boolean,
  consented: boolean,
  highIntent: boolean,
  lastSentAt: number | null,
  now: number,
): RecoveryTrigger | null {
  if (!hasDraft || !consented || !highIntent) return null;
  if (lastSentAt != null && now - lastSentAt < RECOVERY_CAP_MS) return null;
  return { trigger: "exit" };
}

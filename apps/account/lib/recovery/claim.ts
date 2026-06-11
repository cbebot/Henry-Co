import "server-only";

import { after } from "next/server";
import { normalizeEmail, phoneSearchVariants } from "@henryco/config";
import { claimAbandonedTasksForUser } from "@henryco/data/abandoned-tasks";

/**
 * Anon→authed claim bridge for V3-37 recovery. Mirrors the Care-booking
 * reconciliation pattern (apps/account/lib/care-sync.ts): on login, match the
 * unclaimed `abandoned_tasks` rows captured while the visitor was anonymous to
 * the now-authed user by claim token and/or contact (email + phone variants),
 * and stamp `user_id` so they surface in the dashboard.
 */
export type RecoveryClaimIdentity = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  /** Optional precise token threaded from the public flow (cookie or ?claim=). */
  claimToken?: string | null;
};

export async function claimAbandonedTasksForIdentity(
  identity: RecoveryClaimIdentity,
): Promise<number> {
  const email = normalizeEmail(identity.email);
  const emails = email ? [email] : [];
  const phones = phoneSearchVariants(identity.phone);
  if (!identity.claimToken && emails.length === 0 && phones.length === 0) {
    return 0;
  }
  return claimAbandonedTasksForUser({
    userId: identity.userId,
    emails,
    phones,
    token: identity.claimToken ?? null,
  });
}

/** Runs after the response so login latency is untouched (matches care-sync). */
export function scheduleAbandonedTaskClaim(identity: RecoveryClaimIdentity): void {
  after(() => {
    void claimAbandonedTasksForIdentity(identity).catch((error) => {
      console.error("[recovery] abandoned-task claim failed:", error);
    });
  });
}

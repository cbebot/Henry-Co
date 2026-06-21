import "server-only";

/**
 * Free-play entry gate (ARCHITECTURE.md §8.3). Pass 1 is FREE play: the gate is
 * deliberately minimal — a logged-in account, and (as a responsible-play
 * courtesy) not self-excluded. There is NO KYC, NO age check, NO geofence — that
 * apparatus belongs entirely to the legally-gated money layer (`assertCanStake`,
 * a separate later pass). The free path NEVER imports the staking gate.
 *
 * `assertCanStake` is intentionally NOT defined here in Pass 1 — building it now
 * would couple the free foundation to the dormant money layer.
 */

import { EntryDeniedError } from "../errors";
import type { EntryGateResult } from "../types";

/**
 * Resolve whether a viewer may play for free. `userId` MUST be the
 * server-resolved session identity (from requireUnifiedViewer / the
 * x-supabase-user header) — never a client-supplied id.
 *
 * `isSelfExcluded` is an injected predicate (default: always false in Pass 1,
 * since the self-exclusion table is a dormant money-layer artifact). The seam
 * exists so the money layer can wire the real check without touching the free
 * path's call sites.
 */
export function checkCanPlayFree(
  userId: string | null | undefined,
  opts?: { isSelfExcluded?: (userId: string) => boolean },
): EntryGateResult {
  if (!userId) return { ok: false, reason: "not_authenticated" };
  const excluded = opts?.isSelfExcluded?.(userId) ?? false;
  if (excluded) return { ok: false, reason: "self_excluded" };
  return { ok: true, userId };
}

/** Throwing variant — raises a typed, PII-free `EntryDeniedError` on denial. */
export function assertCanPlayFree(
  userId: string | null | undefined,
  opts?: { isSelfExcluded?: (userId: string) => boolean },
): string {
  const result = checkCanPlayFree(userId, opts);
  if (!result.ok) throw new EntryDeniedError(result.reason);
  return result.userId;
}

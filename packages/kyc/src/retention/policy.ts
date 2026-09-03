/**
 * @henryco/kyc — retention + erasure decision logic (pure).
 *
 * Encodes the two destruction paths as pure, testable functions:
 *   - SCHEDULED retention (the cron): crypto-shred records past the configured
 *     window — but ONLY if a window is configured (the directive forbids
 *     inventing a legal number, so an unset window is a no-op).
 *   - ON-REQUEST erasure (NDPR): crypto-shred on demand, but never below the
 *     AML retention floor and never under an active legal hold.
 *
 * Both respect: an existing legal hold, a future `retention_hold_until`, an
 * already-shredded record, and a surface that forbids destruction. The
 * retention period + AML floor are CONFIGURABLE policy values flagged for
 * legal/compliance sign-off — this module enforces whatever is configured and
 * decides nothing legal on its own.
 *
 * Pure + client-safe.
 */

export type RetentionPolicy = {
  /** Configured retention window in days. `null` = NOT configured → scheduled shred no-ops. */
  retentionDays: number | null;
  /** Minimum days that MUST be retained (AML/legal floor) regardless of an erasure request. */
  amlFloorDays: number;
  /** Master switch: may this surface ever be destructively crypto-shredded? */
  destructiveShredAllowed: boolean;
};

export type RetentionRecord = {
  createdAt: string;
  retentionHoldUntil?: string | null;
  legalHoldReason?: string | null;
  cryptoShreddedAt?: string | null;
};

export type RetentionDecision =
  | { action: "keep"; reason: string }
  | { action: "shred"; reason: string };

const keep = (reason: string): RetentionDecision => ({ action: "keep", reason });
const shred = (reason: string): RetentionDecision => ({ action: "shred", reason });

function ageDays(createdAt: string, now: Date): number {
  return (now.getTime() - new Date(createdAt).getTime()) / 86_400_000;
}

function hasActiveLegalHold(record: RetentionRecord, now: Date): RetentionDecision | null {
  if (record.legalHoldReason && record.legalHoldReason.trim()) {
    return keep(`legal hold: ${record.legalHoldReason.trim()}`);
  }
  if (record.retentionHoldUntil) {
    const until = new Date(record.retentionHoldUntil).getTime();
    if (Number.isFinite(until) && until > now.getTime()) {
      return keep("retention hold until " + record.retentionHoldUntil);
    }
  }
  return null;
}

/** Decision for the scheduled retention cron. */
export function resolveScheduledRetention(
  record: RetentionRecord,
  policy: RetentionPolicy,
  now: Date,
): RetentionDecision {
  if (record.cryptoShreddedAt) return keep("already crypto-shredded");
  if (!policy.destructiveShredAllowed) return keep("destructive shred not allowed for this surface");
  if (policy.retentionDays == null) return keep("retention period not configured (legal sign-off pending)");
  const hold = hasActiveLegalHold(record, now);
  if (hold) return hold;
  const effectiveDays = Math.max(policy.retentionDays, policy.amlFloorDays);
  const age = ageDays(record.createdAt, now);
  if (age >= effectiveDays) {
    return shred(`past retention window (${effectiveDays}d incl. AML floor)`);
  }
  // Window elapsed but the AML floor still holds the record.
  if (age >= policy.retentionDays) {
    return keep(`AML retention floor not yet met (${policy.amlFloorDays}d)`);
  }
  return keep("within retention window");
}

/** Decision for an on-request (NDPR) erasure. */
export function resolveErasureRequest(
  record: RetentionRecord,
  policy: RetentionPolicy,
  now: Date,
): RetentionDecision {
  if (record.cryptoShreddedAt) return keep("already crypto-shredded");
  if (!policy.destructiveShredAllowed) return keep("destructive shred not allowed for this surface");
  const hold = hasActiveLegalHold(record, now);
  if (hold) return hold;
  if (ageDays(record.createdAt, now) < policy.amlFloorDays) {
    return keep(`AML retention floor not met (${policy.amlFloorDays}d)`);
  }
  return shred("erasure request honored (AML floor met, no hold)");
}

/**
 * V3-73 — Studio Project Suite: revision round-trip counter.
 *
 * Pure logic. `allowance` is the contracted revision rounds for a deliverable
 * (sourced from the package/proposal); `usedCount` is the number of
 * change-request rounds already raised against it. When the allowance is
 * exhausted, the next change-request is flagged billable — the actual billing
 * stays on the existing studio billing path (out of scope here).
 */
export type RoundTripState = {
  allowance: number;
  used: number;
  remaining: number;
  exhausted: boolean;
  billable: boolean;
};

function toWhole(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function computeRoundTrip(allowance: number, usedCount: number): RoundTripState {
  const safeAllowance = toWhole(allowance);
  const used = toWhole(usedCount);
  const remaining = Math.max(0, safeAllowance - used);
  const exhausted = used >= safeAllowance;
  return {
    allowance: safeAllowance,
    used,
    remaining,
    exhausted,
    // Once the allowance is reached, every further change-request is billable.
    billable: exhausted,
  };
}

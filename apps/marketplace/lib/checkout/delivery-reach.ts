// V3-FREESHIP-02 — tier-earned delivery reach.
//
// A seller's free-delivery REACH is bounded by their verified tier:
//   Bronze (or unset) → their own state · Silver → their geopolitical zone ·
//   Gold → nationwide.
// This pure module resolves a requested reach (+ origin state) into the exact set
// of covered state codes, CLAMPED to the tier ceiling. The same logic is mirrored
// server-side in the upsert RPC and re-checked at checkout (a tier downgrade must
// not keep honoring an over-reach promise).

import { NG_STATES, statesInZone, zoneForState, type NgStateCode } from "@henryco/config";

export type SellerTier = "bronze" | "silver" | "gold";
export type ReachKind = "own_state" | "own_zone" | "states" | "nationwide";

const ALL_STATE_CODES: NgStateCode[] = NG_STATES.map((s) => s.code);
const VALID = new Set(ALL_STATE_CODES);
const CEILING_RANK: Record<"own_state" | "own_zone" | "nationwide", number> = {
  own_state: 0,
  own_zone: 1,
  nationwide: 2,
};

export function normalizeTier(tier: string | null | undefined): SellerTier {
  const t = String(tier ?? "").toLowerCase();
  return t === "gold" ? "gold" : t === "silver" ? "silver" : "bronze";
}

/** The widest reach a tier may promise. */
export function tierCeiling(tier: string | null | undefined): "own_state" | "own_zone" | "nationwide" {
  const t = normalizeTier(tier);
  return t === "gold" ? "nationwide" : t === "silver" ? "own_zone" : "own_state";
}

/** The covered set for one of the rank-ordered reaches, given the origin state. */
function reachSet(reach: "own_state" | "own_zone" | "nationwide", originState: NgStateCode): NgStateCode[] {
  if (reach === "nationwide") return ALL_STATE_CODES.slice();
  if (reach === "own_zone") {
    const zone = zoneForState(originState);
    return zone ? statesInZone(zone) : [];
  }
  return VALID.has(originState) ? [originState] : []; // own_state
}

export type ResolveReachInput = {
  reachKind: ReachKind;
  originState: NgStateCode;
  explicitStates?: NgStateCode[];
  tier: string | null | undefined;
};

/**
 * Resolve the covered state codes for a promise, clamped to the seller's tier
 * ceiling. `coveredStates` is in canonical NG order; `clampedTo` reports the
 * effective reach after clamping (so the UI can say "limited to your state").
 */
export function resolveCoveredStates(
  input: ResolveReachInput,
): { coveredStates: NgStateCode[]; clampedTo: ReachKind } {
  const ceiling = tierCeiling(input.tier);
  const allowed = new Set(reachSet(ceiling, input.originState));

  const requested =
    input.reachKind === "states"
      ? (input.explicitStates ?? []).filter((c) => VALID.has(c))
      : reachSet(input.reachKind, input.originState);

  const requestedSet = new Set(requested);
  // Intersect with the ceiling, emit in canonical order, deduped.
  const coveredStates = ALL_STATE_CODES.filter((c) => requestedSet.has(c) && allowed.has(c));

  const clampedTo: ReachKind =
    input.reachKind === "states"
      ? "states"
      : CEILING_RANK[input.reachKind] > CEILING_RANK[ceiling]
        ? ceiling
        : input.reachKind;

  return { coveredStates, clampedTo };
}

/**
 * Re-clamp a STORED covered-state set to the seller's CURRENT tier ceiling. Used at
 * checkout so a tier downgrade (Gold→Bronze) can never keep honoring an over-reach
 * promise written while the seller was higher. Returns canonical NG order.
 */
export function clampCoveredStatesToTier(
  coveredStates: readonly NgStateCode[],
  originState: NgStateCode,
  tier: string | null | undefined,
): NgStateCode[] {
  const allowed = new Set(reachSet(tierCeiling(tier), originState));
  const stored = new Set(coveredStates);
  return ALL_STATE_CODES.filter((c) => allowed.has(c) && stored.has(c));
}

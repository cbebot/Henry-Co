/**
 * SA-2 — the in-code mirror of the governed `studio-build-rate-card-v1`
 * pricing_rule_books row (seeded by migration 20260719120000). PURE.
 *
 * Like `defaultAiUsageRules()`, the DB row is the live-tunable truth and this
 * module is the lockstep default the code falls back to when the row is
 * unavailable. It carries BOTH the per-token provider rates (deep tier — the
 * agent's tier) AND the Mode-A envelope knobs (fraction + floor/ceiling), so
 * envelope sizing and cost metering read one governed source.
 */

import { meterAiCostKobo, type MeteredUsage } from "@henryco/pricing";
import type { EnvelopeRuleBook } from "@/lib/agency/envelope";

export const STUDIO_BUILD_RATE_CARD_KEY = "studio-build-rate-card-v1";

export type BuildTierRate = {
  rate: { in: number; out: number; cacheRead: number; cacheWrite: number };
  marginRate: number;
  minChargeableKobo: number;
  maxCostKoboPerCall: number;
};

export type StudioBuildRateCard = {
  key: string;
  version: string;
  currency: "NGN";
  envelope: EnvelopeRuleBook;
  tiers: { deep: BuildTierRate };
};

/** The launch baseline — byte-compatible with the migration's seeded jsonb. */
export function defaultStudioBuildRateCard(): StudioBuildRateCard {
  return {
    key: STUDIO_BUILD_RATE_CARD_KEY,
    version: "2026-07-19",
    currency: "NGN",
    envelope: { fraction: 0.2, floorKobo: 1_000_000, ceilingKobo: 10_000_000 },
    tiers: {
      deep: {
        rate: { in: 0.8, out: 4, cacheRead: 0.08, cacheWrite: 1 },
        marginRate: 0.35,
        minChargeableKobo: 500,
        maxCostKoboPerCall: 200_000,
      },
    },
  };
}

/**
 * Price a metered usage tuple at the build-agent (deep) rate — the SAME linear
 * `meterAiCostKobo` shape the gateway uses, so executor-reported usage and any
 * gateway QA-call usage price identically. Kobo integer.
 */
export function priceBuildUsageKobo(
  usage: MeteredUsage,
  card: StudioBuildRateCard = defaultStudioBuildRateCard(),
): number {
  return meterAiCostKobo(usage, card.tiers.deep.rate);
}

// NOT marked "server-only" so it stays unit-testable, but it is exported ONLY from the server
// barrel (server/index.ts, which is server-only), so the rate card + margin never reach a
// client bundle. Keep it out of the pure client barrel (index.ts).
import { defaultAiUsageRules, computeAiUsageBreakdown, type AiUsageRuleSet, type AiModelTier, type PricingBreakdown } from "@henryco/pricing";
import { TAX } from "@henryco/config";

import { estimateInputTokens, estimateUsageUpperBound } from "../metering";
import { getSurfacePolicy, type AiSurfaceKey } from "../surfaces";
import { getCapability } from "../capabilities";
import { ok, err, type Result } from "../result";
import { aiError, DEFAULT_AI_ERROR_COPY, type AiGatewayError } from "../errors";

/**
 * Intelligence Live L4 — the price a person sees BEFORE a chargeable capability runs.
 *
 * This reuses the exact numbers the orchestrator computes on a real run (estimate the tokens
 * as a provable upper bound, price them through the same rate card + VAT), so the quote and
 * the reservation are the same figure. Because settle is hard-capped at the reservation, the
 * person is NEVER charged above the quote they confirmed. Server-only: the rate card and
 * margin never leave the server; only the final kobo totals cross to the client.
 */
export interface CapabilityQuote {
  capabilityKey: string;
  surface: AiSurfaceKey;
  /** Capability label only, never a model/provider name. */
  tier: AiModelTier;
  /** VAT-inclusive upper-bound total in kobo. The person is never charged above this. */
  totalKobo: number;
  /** VAT portion of the total, for transparency (kobo). */
  vatKobo: number;
  /** ISO 4217. NGN today (the multi-currency seam lives in @henryco/pricing). */
  currency: string;
}

function lineAmount(breakdown: PricingBreakdown, code: string): number {
  return breakdown.lines.find((line) => line.code === code)?.amount.amount ?? 0;
}

/**
 * Quote a chargeable capability for the text the person will run it on. Pure of side effects
 * (no wallet touch); returns a typed error when the key is unknown or the surface is not
 * billable, so a caller can never accidentally quote free work as paid.
 */
export function quoteCapability(input: {
  capabilityKey: string;
  /** The text the run will be grounded in (the person's request + any account facts). */
  inputText: string;
  /** Defaults to the governed launch rate card. */
  rules?: AiUsageRuleSet;
}): Result<CapabilityQuote, AiGatewayError> {
  const capability = getCapability(input.capabilityKey);
  if (!capability) {
    return err(aiError("not_configured", "That deep-work option is not available."));
  }
  const policy = getSurfacePolicy(capability.surface);
  if (!policy || !policy.billable) {
    // A capability must map to a billable surface; a free surface can never be quoted as paid.
    return err(aiError("not_configured", DEFAULT_AI_ERROR_COPY.not_configured));
  }

  const rules = input.rules ?? defaultAiUsageRules();
  const promptTokens = estimateInputTokens(String(input.inputText ?? ""));
  const usage = estimateUsageUpperBound({ promptTokens, policy });
  const breakdown = computeAiUsageBreakdown({
    rules,
    tier: policy.modelTier,
    usage,
    vat: { policy: TAX.vat, treatment: "standard" },
  });

  return ok({
    capabilityKey: capability.key,
    surface: policy.surface,
    tier: policy.modelTier,
    totalKobo: breakdown.totals.customerTotal.amount,
    vatKobo: lineAmount(breakdown, "tax"),
    currency: rules.currency,
  });
}

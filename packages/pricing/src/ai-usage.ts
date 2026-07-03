// V3-AI-01 — AI usage margin engine. A SIBLING breakdown builder of the
// marketplace/property builders in ./index, not a parallel money system: it emits
// the same PricingBreakdown shape and reuses the existing VAT engine (applyOutputVat
// + an injected VatRatePolicy = @henryco/config TAX.vat). Pure, deterministic, whole
// integer kobo — no float ever touches money. The provider/model behind a tier is
// company-governed server-only config and NEVER appears here (this module is in the
// client-safe barrel).
import type { Money, PricingBreakdown, PricingBreakdownLine } from "./index";
import { applyOutputVat, type VatRatePolicy, type VatTreatment } from "./vat";

/** A capability tier — maps server-side to a company-set Claude model + a rate-card
 *  row. A user-safe label; NEVER a model name. Extensible (e.g. add "expert"). */
export type AiModelTier = "fast" | "standard" | "deep";

/** Per-token kobo cost for a tier's model. Cache rates price prompt-cache reads/writes
 *  at their own (lower) rates; `cacheRead <= in` is what makes the estimate a provable
 *  upper bound (a cached token is never dearer than a full-input token). */
export type AiTierRate = {
  rate: { in: number; out: number; cacheRead: number; cacheWrite: number };
  /** The company's margin % for THIS tier (a heavier tier may carry a higher %). */
  marginRate: number;
  /** Per-call floor (kobo), applied to net = cost + margin. */
  minChargeableKobo: number;
  /** Per-call cost ceiling (kobo) — an estimate above this is refused pre-dispatch. */
  maxCostKoboPerCall: number;
};

/** The governed rate card body stored in `pricing_rule_books.rules` (division='ai'). */
export type AiUsageRuleSet = {
  key: string;
  version: string;
  currency: "NGN";
  tiers: Record<AiModelTier, AiTierRate>;
};

/** Metered token usage — the estimate (provable upper bound) OR the provider actual. */
export type MeteredUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Provider round-trips for the task. Recorded; the cost formula is linear in the
   *  four token counts (the estimator folds maxCalls into those counts). */
  calls: number;
};

// The single rounding chokepoint, identical in behaviour to ./index roundInt
// (Math.round, 0 for non-finite). Kept local to avoid a value cycle with the barrel.
function roundKobo(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function safeRate(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`[pricing/ai-usage] ${label} must be a finite non-negative rate, got ${value}`);
  }
  return value;
}

function safeTokens(value: number, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`[pricing/ai-usage] ${label} must be a finite non-negative token count, got ${value}`);
  }
  return n;
}

/**
 * Provider cost in whole kobo for a metered usage at a tier's per-token rates:
 * `round(in*r.in + out*r.out + cacheRead*r.cacheRead + cacheWrite*r.cacheWrite)`.
 *
 * Monotonic non-decreasing in every token count (all rates >= 0), which is the
 * foundation of the prepaid upper-bound guarantee: the pre-flight estimate counts
 * every prompt token at the full `in` rate (cacheRead = 0) and assumes
 * output = maxOutputTokens, so no actual call can ever cost more than its reservation.
 */
export function meterAiCostKobo(usage: MeteredUsage, rate: AiTierRate["rate"]): number {
  const i = safeTokens(usage.inputTokens, "inputTokens");
  const o = safeTokens(usage.outputTokens, "outputTokens");
  const cr = safeTokens(usage.cacheReadTokens, "cacheReadTokens");
  const cw = safeTokens(usage.cacheWriteTokens, "cacheWriteTokens");
  return roundKobo(
    i * safeRate(rate.in, "rate.in") +
      o * safeRate(rate.out, "rate.out") +
      cr * safeRate(rate.cacheRead, "rate.cacheRead") +
      cw * safeRate(rate.cacheWrite, "rate.cacheWrite"),
  );
}

/**
 * Price one AI call: provider cost -> + tier margin % = net (floored) -> + output VAT.
 *
 * Returns the canonical {@link PricingBreakdown}: an internal-only `ai_compute` line
 * (provider cost) + an `ai_margin` line (net - cost, which absorbs any floor top-up),
 * `customerTotal` = the VAT-inclusive kobo the wallet is debited, `platformNet` = the
 * ex-VAT revenue (cost + margin), `vendorGross` = the provider cost (COGS), and the
 * authoritative output VAT stamped on `meta.vat`. The VAT policy is INJECTED so this
 * package stays a dependency-free leaf; pass `@henryco/config` TAX.vat. A non-`standard`
 * treatment defers VAT (0 tax, total = net) without a code change.
 */
export function computeAiUsageBreakdown(input: {
  rules: AiUsageRuleSet;
  tier: AiModelTier;
  usage: MeteredUsage;
  vat: { policy: VatRatePolicy; treatment?: VatTreatment };
}): PricingBreakdown {
  const r = input.rules.tiers[input.tier];
  if (!r) {
    throw new Error(`[pricing/ai-usage] no rate-card row for tier "${input.tier}" in rule book "${input.rules.key}"`);
  }
  const currency = input.rules.currency;
  const treatment: VatTreatment = input.vat.treatment ?? "standard";

  const cost = meterAiCostKobo(input.usage, r.rate);
  const margin = roundKobo(cost * safeRate(r.marginRate, "marginRate"));
  const floor = Math.max(0, roundKobo(r.minChargeableKobo));
  const net = Math.max(floor, cost + margin);

  // ai_margin absorbs the floor top-up so the lines always sum to net.
  const lines: PricingBreakdownLine[] = [
    { code: "ai_compute", label: "AI compute", amount: { currency, amount: cost } },
    { code: "ai_margin", label: "AI service", amount: { currency, amount: net - cost } },
  ];

  const preVat: PricingBreakdown = {
    currency,
    lines,
    totals: {
      customerTotal: { currency, amount: net } satisfies Money,
      vendorGross: { currency, amount: cost } satisfies Money,
      platformNet: { currency, amount: net - cost } satisfies Money,
      vendorNet: { currency, amount: 0 } satisfies Money,
    },
    meta: {
      division: "ai",
      ruleBookKey: input.rules.key,
      ruleVersion: input.rules.version,
      computedAt: new Date().toISOString(),
      tier: input.tier,
    },
  };

  // Add output VAT ON TOP (the platform's own VATable B2B service — exclusive, not
  // the consumer-facing inclusive carve). Reuses the existing, tested engine.
  const withVat = applyOutputVat(preVat, { treatment }, input.vat.policy);
  const taxLine = withVat.lines.find((l) => l.code === "tax");
  const vatKobo = taxLine ? roundKobo(taxLine.amount.amount) : 0;

  return {
    ...withVat,
    meta: {
      ...withVat.meta,
      vat: {
        outputVatMinor: vatKobo,
        standardBaseMinor: net,
        rateVersion: input.vat.policy.rateVersion,
        jurisdiction: "NG",
        reviewStatus: "confirmed",
      },
    },
  };
}

/**
 * The D4 LAUNCH rate card (governed, tunable live via `pricing_rule_books`).
 * Per-token kobo rates are pinned at ~₦1,600/USD. Floor ₦5; per-call cost ceilings are
 * the runaway-cost guardrail. The concrete Claude model behind each tier is server-only
 * company config, never named here.
 *
 * ✅ RECONCILED (owner decision, 2026-07-03): every tier's per-token rate equals the live
 * provider list price for the model routed to that tier, so the `ai_compute` line the
 * ledger posts as COGS is TRUE provider cost — fast $1/$5 → 0.16/0.80, standard $3/$15 →
 * 0.48/2.40, deep $5/$25 → 0.80/4.00 kobo/token. Margins carry the pricing posture:
 * fast/standard 10%, deep 35% (the deliberate premium — "higher model, higher bill").
 * Worked example (1,500 in / 600 out): ₦25.54 standard / ₦52.25 deep. If the provider
 * reprices or the naira moves materially, update these rates AND the pricing_rule_books
 * seed together, and bump the version.
 */
export function defaultAiUsageRules(): AiUsageRuleSet {
  return {
    key: "ai-usage-rate-card-v1",
    version: "2026-07-03",
    currency: "NGN",
    tiers: {
      fast: {
        rate: { in: 0.16, out: 0.8, cacheRead: 0.016, cacheWrite: 0.2 },
        marginRate: 0.1,
        minChargeableKobo: 500,
        maxCostKoboPerCall: 50_000,
      },
      standard: {
        rate: { in: 0.48, out: 2.4, cacheRead: 0.048, cacheWrite: 0.6 },
        marginRate: 0.1,
        minChargeableKobo: 500,
        maxCostKoboPerCall: 100_000,
      },
      deep: {
        rate: { in: 0.8, out: 4, cacheRead: 0.08, cacheWrite: 1 },
        marginRate: 0.35,
        minChargeableKobo: 500,
        maxCostKoboPerCall: 200_000,
      },
    },
  };
}

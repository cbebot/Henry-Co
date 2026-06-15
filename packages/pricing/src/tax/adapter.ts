// ---------------------------------------------------------------------------
// @henryco/pricing — tax-engine ADAPTER seam (V3-21, S7).
//
// The internal engine is the only implementation wired today. A future
// Avalara / TaxJar / Stripe-Tax adapter drops in behind this SAME interface
// without changing a single caller — the whole point of the seam.
//
// Resolution (catalog lookup) is injected, so the pure engine stays
// dependency-free: the app constructs the adapter with a resolver that calls
// `@henryco/config` resolveVatRate. Do NOT build a vendor adapter here — seam only.
// ---------------------------------------------------------------------------

import { computeTax, type ResolvedRate, type TaxInput, type TaxResult } from "./compute-tax";

/** Resolve the rate for an input (injected so pricing needs no config dep). */
export type TaxRateResolver = (input: TaxInput) => ResolvedRate | null;

/** The pluggable tax-engine interface. One method; a vendor implements the same. */
export interface TaxEngineAdapter {
  compute(input: TaxInput): Promise<TaxResult>;
}

/** The internal engine wrapped as an adapter. The only implementation wired in V3-21. */
export class InternalTaxAdapter implements TaxEngineAdapter {
  constructor(private readonly resolve: TaxRateResolver) {}

  async compute(input: TaxInput): Promise<TaxResult> {
    return computeTax(input, this.resolve(input));
  }
}

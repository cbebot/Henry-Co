// V3-49 — services-catalog pricing model.
//
// catalog_services.pricing_model is a JSONB display hint. It is NOT a full
// quote engine (real booking quotes are computed by the Care booking flow /
// V3-51); it only tells a surface how to PRESENT base_price_minor:
//   - "flat"  → an exact price (e.g. a fixed cleaning package)
//   - "from"  → a starting-from price ("from ₦5,000")
//   - "quote" → price on request (base_price_minor is null)
//
// Surfaces must call normalizeServicePricingModel() rather than read the JSONB
// by hand, and describeServicePrice() to resolve what to show. Money formatting
// stays with formatMoney() from @henryco/i18n/currency (kobo-aware).

export type ServicePricingKind = "flat" | "from" | "quote";

export type ServicePricingModel = {
  kind: ServicePricingKind;
};

const SERVICE_PRICING_KINDS: readonly ServicePricingKind[] = ["flat", "from", "quote"];

function isServicePricingKind(value: unknown): value is ServicePricingKind {
  return typeof value === "string" && (SERVICE_PRICING_KINDS as readonly string[]).includes(value);
}

/**
 * Coerce an unknown JSONB value (object, string, or null) into a valid
 * ServicePricingModel. Unknown/missing shapes default to "flat" — the most
 * literal reading of base_price_minor.
 */
export function normalizeServicePricingModel(value: unknown): ServicePricingModel {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const kind = (value as Record<string, unknown>).kind;
    if (isServicePricingKind(kind)) return { kind };
  }
  if (isServicePricingKind(value)) return { kind: value };
  return { kind: "flat" };
}

export type ServicePriceDescription = {
  kind: ServicePricingKind;
  /** Minor units to render, or null when the price is on request. */
  amountMinor: number | null;
  /** True ⇒ no fixed price; show an "on request" label instead of a number. */
  isOnRequest: boolean;
};

/**
 * Resolve how a service price should be presented. The surface formats
 * amountMinor with formatMoney(amountMinor, currency) and, when kind === "from",
 * prefixes the localized "from" qualifier.
 */
export function describeServicePrice(input: {
  model: ServicePricingModel;
  baseMinor: number | null;
}): ServicePriceDescription {
  const { model, baseMinor } = input;
  const hasAmount = typeof baseMinor === "number" && Number.isFinite(baseMinor) && baseMinor >= 0;
  if (model.kind === "quote" || !hasAmount) {
    return { kind: "quote", amountMinor: null, isOnRequest: true };
  }
  return { kind: model.kind, amountMinor: baseMinor, isOnRequest: false };
}

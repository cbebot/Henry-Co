import { DEFAULT_COUNTRY, getCountry } from "./countries";
import {
  normalizeCurrencyCode,
  parseCurrencyConfig,
} from "./currency";

type CurrencyContextRecord = Record<string, unknown>;

export const DEFAULT_BASE_CURRENCY = "NGN";
export const DEFAULT_SETTLEMENT_CURRENCY = "NGN";
export const LIVE_SETTLEMENT_CURRENCIES = ["NGN"] as const;

export type HenryCoCommerceDivision =
  | "account"
  | "care"
  | "marketplace"
  | "property"
  | "learn"
  | "logistics"
  | "studio"
  | "jobs"
  | "hub";

export type HenryCoPaymentMethod =
  | "bank_transfer"
  | "wallet"
  | "cash_on_delivery"
  | "card"
  | "manual";

export interface CurrencyTruthInput {
  country?: string | null;
  locale?: string | null;
  preferredCurrency?: string | null;
  detectedCurrency?: string | null;
  pricingCurrency?: string | null;
  settlementCurrency?: string | null;
  baseCurrency?: string | null;
  originalCurrency?: string | null;
  exchangeRate?: number | null;
  exchangeRateSource?: string | null;
  exchangeRateTimestamp?: string | null;
}

export interface CurrencyTruthContext {
  countryCode: string;
  locale: string;
  displayCurrency: string;
  pricingCurrency: string;
  settlementCurrency: string;
  baseCurrency: string;
  originalCurrency: string;
  exchangeRate: number | null;
  exchangeRateSource: string | null;
  exchangeRateTimestamp: string | null;
  supportsNativeSettlement: boolean;
  settlementLabel: string;
  settlementMessage: string;
}

export interface HenryCoRailCapabilityInput extends CurrencyTruthInput {
  division?: HenryCoCommerceDivision | string | null;
  paymentMethod?: HenryCoPaymentMethod | string | null;
  enabled?: boolean | null;
  manualVerification?: boolean | null;
  conversionOffered?: boolean | null;
  settlementLive?: boolean | null;
}

export interface HenryCoRailCapability extends CurrencyTruthContext {
  division: string;
  paymentMethod: string;
  enabled: boolean;
  settlementLive: boolean;
  manualVerification: boolean;
  conversionOffered: boolean;
  status: "disabled" | "native_live" | "localized_display_only";
  paymentLabel: string;
  paymentMessage: string;
}

function asRecord(value: unknown): CurrencyContextRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CurrencyContextRecord)
    : {};
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableText(value: unknown) {
  const text = asText(value);
  return text || null;
}

function asNullableNumber(value: unknown) {
  const normalized = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function asNullableBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function compactRecord<T extends CurrencyContextRecord>(value: T): T {
  const next = Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry == null) return false;
      if (typeof entry === "string") return entry.trim().length > 0;
      return true;
    })
  );
  return next as T;
}

export function isLiveSettlementCurrency(
  currencyCode: string | null | undefined
): currencyCode is (typeof LIVE_SETTLEMENT_CURRENCIES)[number] {
  return (LIVE_SETTLEMENT_CURRENCIES as readonly string[]).includes(
    normalizeCurrencyCode(currencyCode)
  );
}

export function resolveCurrencyTruth(
  input: CurrencyTruthInput = {}
): CurrencyTruthContext {
  const country =
    getCountry(asText(input.country).toUpperCase()) || getCountry(DEFAULT_COUNTRY)!;
  const pricingCurrency = normalizeCurrencyCode(
    input.pricingCurrency || input.detectedCurrency || country.currencyCode
  );
  const settlementCurrency = normalizeCurrencyCode(
    input.settlementCurrency || DEFAULT_SETTLEMENT_CURRENCY
  );
  const baseCurrency = normalizeCurrencyCode(
    input.baseCurrency || settlementCurrency || DEFAULT_BASE_CURRENCY
  );
  const originalCurrency = normalizeCurrencyCode(
    input.originalCurrency || pricingCurrency
  );
  const displayCurrency = normalizeCurrencyCode(
    input.preferredCurrency || input.detectedCurrency || pricingCurrency
  );
  const locale =
    asText(input.locale) ||
    parseCurrencyConfig(displayCurrency).locale ||
    country.locale;
  const supportsNativeSettlement =
    pricingCurrency === settlementCurrency &&
    isLiveSettlementCurrency(settlementCurrency);

  return {
    countryCode: country.code,
    locale,
    displayCurrency,
    pricingCurrency,
    settlementCurrency,
    baseCurrency,
    originalCurrency,
    exchangeRate: asNullableNumber(input.exchangeRate),
    exchangeRateSource: asNullableText(input.exchangeRateSource),
    exchangeRateTimestamp: asNullableText(input.exchangeRateTimestamp),
    supportsNativeSettlement,
    settlementLabel: supportsNativeSettlement
      ? `${settlementCurrency} settlement live`
      : `${settlementCurrency}-first settlement`,
    settlementMessage:
      displayCurrency === settlementCurrency
        ? `Settlement currently runs in ${settlementCurrency}.`
        : `Amounts can display in ${displayCurrency}, but settlement currently runs in ${settlementCurrency} until local rails go live.`,
  };
}

function paymentMethodLabel(method: string) {
  const normalized = asText(method).toLowerCase();
  if (normalized === "bank_transfer") return "Bank transfer";
  if (normalized === "wallet") return "Wallet";
  if (normalized === "cash_on_delivery" || normalized === "cod") {
    return "Cash on delivery";
  }
  if (normalized === "card") return "Card";
  if (normalized === "manual") return "Manual settlement";
  return normalized ? normalized.replace(/\b\w/g, (char) => char.toUpperCase()) : "Payment";
}

export function resolveHenryCoRailCapability(
  input: HenryCoRailCapabilityInput = {}
): HenryCoRailCapability {
  const truth = resolveCurrencyTruth(input);
  const paymentMethod = asText(input.paymentMethod).toLowerCase() || "bank_transfer";
  const enabled = asNullableBoolean(input.enabled) ?? true;
  const settlementLive = asNullableBoolean(input.settlementLive) ?? enabled;
  const manualVerification =
    asNullableBoolean(input.manualVerification) ??
    ["bank_transfer", "wallet", "manual"].includes(paymentMethod);
  const conversionOffered =
    asNullableBoolean(input.conversionOffered) === true &&
    truth.pricingCurrency !== truth.settlementCurrency &&
    Boolean(truth.exchangeRateSource) &&
    Boolean(truth.exchangeRateTimestamp);
  const paymentLabel = paymentMethodLabel(paymentMethod);
  const status = !enabled
    ? "disabled"
    : truth.supportsNativeSettlement
      ? "native_live"
      : "localized_display_only";

  let paymentMessage = `${paymentLabel} is not live for this rail yet.`;
  if (enabled) {
    if (conversionOffered) {
      paymentMessage = `${paymentLabel} is live. Pricing can localize in ${truth.displayCurrency}, conversion is quoted from ${truth.exchangeRateSource}, and settlement completes in ${truth.settlementCurrency}.`;
    } else if (truth.supportsNativeSettlement) {
      paymentMessage = manualVerification
        ? `${paymentLabel} settles in ${truth.settlementCurrency} and still requires finance verification before funds move.`
        : `${paymentLabel} settles natively in ${truth.settlementCurrency}.`;
    } else {
      paymentMessage = manualVerification
        ? `${paymentLabel} is live, but localized display does not change settlement. Prices can display in ${truth.displayCurrency} while settlement still completes in ${truth.settlementCurrency} with manual verification.`
        : `${paymentLabel} is live, but localized display does not change settlement. Prices can display in ${truth.displayCurrency} while settlement still completes in ${truth.settlementCurrency}.`;
    }
  }

  return {
    ...truth,
    division: asText(input.division).toLowerCase() || "account",
    paymentMethod,
    enabled,
    settlementLive,
    manualVerification,
    conversionOffered,
    status,
    paymentLabel,
    paymentMessage,
  };
}

export function extractCurrencyContext(
  value: unknown
): Partial<CurrencyTruthInput> {
  const root = asRecord(value);
  const nested = asRecord(root.currency_context);
  const source = Object.keys(nested).length > 0 ? nested : root;

  return compactRecord({
    country: asNullableText(source.country_code ?? source.country),
    locale: asNullableText(source.locale),
    preferredCurrency: asNullableText(
      source.display_currency ?? source.preferred_currency
    ),
    detectedCurrency: asNullableText(
      source.detected_currency ?? source.currency ?? source.pricing_currency
    ),
    pricingCurrency: asNullableText(source.pricing_currency),
    settlementCurrency: asNullableText(source.settlement_currency),
    baseCurrency: asNullableText(source.base_currency),
    originalCurrency: asNullableText(source.original_currency),
    exchangeRate: asNullableNumber(source.exchange_rate),
    exchangeRateSource: asNullableText(source.exchange_rate_source),
    exchangeRateTimestamp: asNullableText(source.exchange_rate_timestamp),
  });
}

export function serializeCurrencyContext(
  input: CurrencyTruthInput = {}
): CurrencyContextRecord {
  const truth = resolveCurrencyTruth(input);
  return compactRecord({
    country_code: truth.countryCode,
    locale: truth.locale,
    display_currency: truth.displayCurrency,
    pricing_currency: truth.pricingCurrency,
    settlement_currency: truth.settlementCurrency,
    base_currency: truth.baseCurrency,
    original_currency: truth.originalCurrency,
    exchange_rate: truth.exchangeRate,
    exchange_rate_source: truth.exchangeRateSource,
    exchange_rate_timestamp: truth.exchangeRateTimestamp,
  });
}

export function withCurrencyContext(
  value: unknown,
  input: CurrencyTruthInput = {}
): CurrencyContextRecord {
  const root = asRecord(value);
  return {
    ...root,
    currency_context: serializeCurrencyContext({
      ...extractCurrencyContext(root),
      ...input,
    }),
  };
}

export function buildInvoiceLineItemsPayload(
  items: Array<Record<string, unknown>> | null | undefined,
  input: CurrencyTruthInput = {}
) {
  return {
    items: Array.isArray(items) ? items : [],
    currency_context: serializeCurrencyContext(input),
  };
}

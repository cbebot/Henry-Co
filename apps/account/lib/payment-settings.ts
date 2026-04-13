import "server-only";

import { cache } from "react";
import {
  resolveHenryCoRailCapability,
  type HenryCoCommerceDivision,
  type HenryCoPaymentMethod,
  type HenryCoRailCapability,
} from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";

export type SharedFxQuote = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  source: string;
  updatedAt: string;
};

export type SharedFxState = {
  enabled: boolean;
  provider: string | null;
  updatedAt: string | null;
  quotes: SharedFxQuote[];
  note: string;
};

export type SharedPaymentRailCapability = HenryCoRailCapability & {
  division: HenryCoCommerceDivision | string;
  paymentMethod: HenryCoPaymentMethod | string;
};

type SharedPaymentRail = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  currency: string;
  instructions: string;
  supportEmail: string | null;
  supportWhatsApp: string | null;
  capabilities: SharedPaymentRailCapability[];
  fx: SharedFxState;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableText(value: unknown) {
  const text = asText(value);
  return text || null;
}

function isEnabled(value: unknown) {
  return ["1", "true", "yes", "on"].includes(asText(value).toLowerCase());
}

type RailCapabilitySeed = {
  division: HenryCoCommerceDivision;
  paymentMethod: HenryCoPaymentMethod;
  enabled: boolean;
  manualVerification?: boolean;
  settlementLive?: boolean;
};

function buildRailCapabilities(
  settlementCurrency: string,
  fx: SharedFxState
): SharedPaymentRailCapability[] {
  const seeds: RailCapabilitySeed[] = [
    { division: "account", paymentMethod: "bank_transfer", enabled: true, manualVerification: true },
    { division: "account", paymentMethod: "wallet", enabled: true, manualVerification: true },
    { division: "care", paymentMethod: "bank_transfer", enabled: true, manualVerification: true },
    { division: "marketplace", paymentMethod: "bank_transfer", enabled: true, manualVerification: true },
    { division: "marketplace", paymentMethod: "cash_on_delivery", enabled: true, manualVerification: false },
    { division: "property", paymentMethod: "bank_transfer", enabled: true, manualVerification: true },
    { division: "learn", paymentMethod: "bank_transfer", enabled: true, manualVerification: true },
    { division: "logistics", paymentMethod: "bank_transfer", enabled: true, manualVerification: true },
    { division: "studio", paymentMethod: "bank_transfer", enabled: true, manualVerification: true },
    { division: "jobs", paymentMethod: "manual", enabled: false, manualVerification: true, settlementLive: false },
  ];

  return seeds.map((seed) =>
    resolveHenryCoRailCapability({
      division: seed.division,
      paymentMethod: seed.paymentMethod,
      pricingCurrency: settlementCurrency,
      settlementCurrency,
      baseCurrency: settlementCurrency,
      originalCurrency: settlementCurrency,
      enabled: seed.enabled,
      manualVerification: seed.manualVerification,
      settlementLive: seed.settlementLive,
      conversionOffered: fx.enabled,
      exchangeRateSource: fx.provider,
      exchangeRateTimestamp: fx.updatedAt,
    })
  );
}

async function fetchLiveFxState(settlementCurrency: string): Promise<SharedFxState> {
  const conversionEnabled =
    isEnabled(process.env.HENRYCO_ENABLE_FX_CONVERSION) ||
    isEnabled(process.env.NEXT_PUBLIC_HENRYCO_ENABLE_FX_CONVERSION);

  if (!conversionEnabled) {
    return {
      enabled: false,
      provider: null,
      updatedAt: null,
      quotes: [],
      note: "No live FX source is attached because HenryCo is not currently offering converted settlement on this shared rail.",
    };
  }

  const sourceUrl = asText(process.env.HENRYCO_FX_SOURCE_URL);
  let provider = asNullableText(process.env.HENRYCO_FX_SOURCE_NAME);
  if (!provider && sourceUrl) {
    try {
      provider = new URL(sourceUrl).hostname.replace(/^api\./i, "");
    } catch {
      provider = "configured_fx_source";
    }
  }
  const quoteCurrencies = Array.from(
    new Set(
      (asText(process.env.HENRYCO_FX_QUOTE_CURRENCIES) || "USD,EUR,XOF")
        .split(",")
        .map((value) => asText(value).toUpperCase())
        .filter(Boolean)
    )
  ).filter((currency) => currency !== settlementCurrency);

  if (!sourceUrl || quoteCurrencies.length === 0) {
    return {
      enabled: false,
      provider,
      updatedAt: null,
      quotes: [],
      note: "FX conversion was flagged on, but the live rate source is not configured well enough to quote converted settlement safely.",
    };
  }

  try {
    const baseUrl = new URL(sourceUrl);
    if (!baseUrl.searchParams.has("base")) {
      baseUrl.searchParams.set("base", settlementCurrency);
    }
    if (!baseUrl.searchParams.has("symbols")) {
      baseUrl.searchParams.set("symbols", quoteCurrencies.join(","));
    }

    const response = await fetch(baseUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`FX source returned ${response.status}.`);
    }

    const payload = (await response.json()) as
      | {
          base?: string;
          date?: string;
          timestamp?: number;
          rates?: Record<string, number>;
          conversion_rates?: Record<string, number>;
        }
      | Record<string, unknown>;

    const rates =
      (payload.rates && typeof payload.rates === "object" ? payload.rates : null) ||
      (payload.conversion_rates && typeof payload.conversion_rates === "object"
        ? payload.conversion_rates
        : null) ||
      {};
    const updatedAt =
      asNullableText(payload.date) ||
      (typeof payload.timestamp === "number"
        ? new Date(payload.timestamp * 1000).toISOString()
        : new Date().toISOString());
    const quotes = quoteCurrencies
      .map((quoteCurrency) => {
        const rate = Number((rates as Record<string, unknown>)[quoteCurrency]);
        if (!Number.isFinite(rate) || rate <= 0) {
          return null;
        }

        return {
          baseCurrency: settlementCurrency,
          quoteCurrency,
          rate,
          source: provider || "configured_fx_source",
          updatedAt,
        } satisfies SharedFxQuote;
      })
      .filter(Boolean) as SharedFxQuote[];

    if (quotes.length === 0) {
      return {
        enabled: false,
        provider,
        updatedAt,
        quotes: [],
        note: "The configured FX source did not return any usable rates for the enabled quote currencies.",
      };
    }

    return {
      enabled: true,
      provider,
      updatedAt,
      quotes,
      note: `Live FX quotes are active from ${provider || "the configured source"} because converted settlement has been explicitly enabled.`,
    };
  } catch (error) {
    return {
      enabled: false,
      provider,
      updatedAt: null,
      quotes: [],
      note:
        error instanceof Error
          ? `FX conversion was flagged on, but the configured rate source failed: ${error.message}`
          : "FX conversion was flagged on, but the configured rate source failed.",
    };
  }
}

export const getSharedPaymentRailCapability = cache(
  async (
    division: HenryCoCommerceDivision | string,
    paymentMethod: HenryCoPaymentMethod | string
  ) => {
    const rail = await getSharedPaymentRail();
    return (
      rail.capabilities.find(
        (item) => item.division === division && item.paymentMethod === paymentMethod
      ) ||
      resolveHenryCoRailCapability({
        division,
        paymentMethod,
        pricingCurrency: rail.currency,
        settlementCurrency: rail.currency,
        baseCurrency: rail.currency,
        originalCurrency: rail.currency,
        conversionOffered: rail.fx.enabled,
        exchangeRateSource: rail.fx.provider,
        exchangeRateTimestamp: rail.fx.updatedAt,
        enabled: false,
        settlementLive: false,
      })
    );
  }
);

export const getSharedPaymentRail = cache(async (): Promise<SharedPaymentRail> => {
  const admin = createAdminSupabase();
  const { data } = await admin.from("care_settings").select("*").limit(1).maybeSingle();
  const currency = asText(data?.payment_currency) || "NGN";
  const fx = await fetchLiveFxState(currency);

  return {
    bankName:
      asNullableText(data?.payment_bank_name) ??
      asNullableText(data?.company_bank_name) ??
      "Finance configuration pending",
    accountName:
      asNullableText(data?.payment_account_name) ??
      asNullableText(data?.company_account_name) ??
      "Henry & Co.",
    accountNumber:
      asNullableText(data?.payment_account_number) ??
      asNullableText(data?.company_account_number),
    currency,
    instructions:
      asText(data?.payment_instructions) ||
      "Transfer the exact amount shown, keep the reference intact, and upload proof immediately so the HenryCo team can confirm the funding request.",
    supportEmail:
      asNullableText(data?.payment_support_email) ?? asNullableText(data?.support_email),
    supportWhatsApp:
      asNullableText(data?.payment_support_whatsapp) ??
      asNullableText(data?.payment_whatsapp) ??
      asNullableText(data?.support_phone),
    capabilities: buildRailCapabilities(currency, fx),
    fx,
  };
});

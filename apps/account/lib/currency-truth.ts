import {
  formatMoney,
  resolveCurrencyTruthContext,
  type CurrencyTruthContext,
} from "@henryco/i18n";
import type { AccountRegionalContext } from "@/lib/regional-context";

export type AccountCurrencyTruth = CurrencyTruthContext & {
  displayMatchesPricing: boolean;
  pricingMatchesSettlement: boolean;
  settlementMatchesBase: boolean;
};

type ResolveAccountCurrencyTruthInput = {
  pricingCurrency?: string | null;
  settlementCurrency?: string | null;
  baseCurrency?: string | null;
  exchangeRateSource?: string | null;
  exchangeRateTimestamp?: string | null;
};

export function resolveAccountCurrencyTruth(
  region: AccountRegionalContext,
  input?: ResolveAccountCurrencyTruthInput,
): AccountCurrencyTruth {
  const truth = resolveCurrencyTruthContext({
    displayCurrency: region.currencyCode,
    pricingCurrency: input?.pricingCurrency || undefined,
    settlementCurrency: input?.settlementCurrency || region.settlementCurrencyCode,
    baseCurrency: input?.baseCurrency || region.baseCurrencyCode,
    locale: region.locale,
    exchangeRateSource: input?.exchangeRateSource || undefined,
    exchangeRateTimestamp: input?.exchangeRateTimestamp || undefined,
  });

  return {
    ...truth,
    displayMatchesPricing: truth.displayCurrency === truth.pricingCurrency,
    pricingMatchesSettlement: truth.pricingCurrency === truth.settlementCurrency,
    settlementMatchesBase: truth.settlementCurrency === truth.baseCurrency,
  };
}

export function formatPricingAmount(
  amountMinor: number,
  truth: AccountCurrencyTruth,
  options?: {
    includeCode?: boolean;
    notation?: Intl.NumberFormatOptions["notation"];
  },
) {
  return formatMoney(amountMinor, truth.pricingCurrency, {
    locale: truth.locale,
    includeCode: options?.includeCode ?? !truth.displayMatchesPricing,
    notation: options?.notation,
  });
}

export function formatSettlementAmount(
  amountMinor: number,
  truth: AccountCurrencyTruth,
  options?: {
    includeCode?: boolean;
    notation?: Intl.NumberFormatOptions["notation"];
  },
) {
  return formatMoney(amountMinor, truth.settlementCurrency, {
    locale: truth.locale,
    includeCode: options?.includeCode ?? !truth.pricingMatchesSettlement,
    notation: options?.notation,
  });
}

export function buildCurrencyTruthMessage(
  truth: AccountCurrencyTruth,
  options?: {
    subject?: string;
  },
) {
  const subject = options?.subject || "This record";
  const parts: string[] = [];

  if (truth.displayMatchesPricing) {
    parts.push(`${subject} is shown in ${truth.pricingCurrency}.`);
  } else {
    parts.push(
      `${subject} is priced in ${truth.pricingCurrency}, while your account display preference is ${truth.displayCurrency}.`,
    );
  }

  if (truth.pricingMatchesSettlement) {
    parts.push(`Settlement also runs in ${truth.settlementCurrency}.`);
  } else {
    parts.push(
      `Settlement currently runs in ${truth.settlementCurrency}, so no converted ${truth.displayCurrency} amount is shown here.`,
    );
  }

  if (!truth.settlementMatchesBase) {
    parts.push(`Shared ledger base currency remains ${truth.baseCurrency}.`);
  }

  if (truth.exchangeRateSource && truth.exchangeRateTimestamp) {
    parts.push(
      `FX source: ${truth.exchangeRateSource} at ${truth.exchangeRateTimestamp}.`,
    );
  }

  return parts.join(" ");
}

export function buildCurrencyTruthFacts(truth: AccountCurrencyTruth) {
  return [
    { label: "Display", value: truth.displayCurrency },
    { label: "Pricing", value: truth.pricingCurrency },
    { label: "Settlement", value: truth.settlementCurrency },
    { label: "Base", value: truth.baseCurrency },
  ];
}

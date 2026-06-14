// V3-49 — presentation helpers for catalog_services. Pure + client-safe.
// Money is kobo (minor units), formatted via the kobo-aware @henryco/i18n
// formatMoney — never the care-local naira formatter. pricing_model is resolved
// through @henryco/pricing's describeServicePrice (no ad-hoc JSONB parsing).

import { formatMoney } from "@henryco/i18n/currency";
import { describeServicePrice, type ServicePricingModel } from "@henryco/pricing";

export type ServicePriceLabels = {
  fromLabel: string;
  onRequestLabel: string;
};

export type FormattedServicePrice = {
  text: string;
  isFrom: boolean;
  isOnRequest: boolean;
};

export function formatServicePrice(
  input: { pricing_model: ServicePricingModel; base_price_minor: number | null; currency: string },
  labels: ServicePriceLabels,
): FormattedServicePrice {
  const description = describeServicePrice({
    model: input.pricing_model,
    baseMinor: input.base_price_minor,
  });

  if (description.isOnRequest || description.amountMinor == null) {
    return { text: labels.onRequestLabel, isFrom: false, isOnRequest: true };
  }

  const money = formatMoney(description.amountMinor, input.currency || "NGN");
  if (description.kind === "from") {
    return { text: `${labels.fromLabel} ${money}`, isFrom: true, isOnRequest: false };
  }
  return { text: money, isFrom: false, isOnRequest: false };
}

export function formatServiceDuration(
  minutes: number | null,
  units: { minutesUnit: string; hoursUnit: string },
): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} ${units.minutesUnit}`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  const value = Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1);
  return `${value} ${units.hoursUnit}`;
}

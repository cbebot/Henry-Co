import { DEFAULT_LOGISTICS_ZONES } from "@/lib/logistics/content";
import type {
  LogisticsPricingBreakdown,
  LogisticsRateCard,
  LogisticsServiceType,
  LogisticsUrgency,
  LogisticsZone,
} from "@/lib/logistics/types";

export const DEFAULT_RATE_CARDS: LogisticsRateCard[] = [
  {
    id: "rate-same-day-standard",
    zoneId: null,
    serviceType: "same_day",
    urgency: "standard",
    baseAmount: 3500,
    weightFeePerKg: 450,
    fragileFee: 900,
    sizeSurcharge: 1000,
    manualOnly: false,
    active: true,
  },
  {
    id: "rate-same-day-rush",
    zoneId: null,
    serviceType: "same_day",
    urgency: "rush",
    baseAmount: 5200,
    weightFeePerKg: 600,
    fragileFee: 1100,
    sizeSurcharge: 1200,
    manualOnly: false,
    active: true,
  },
  {
    id: "rate-scheduled-standard",
    zoneId: null,
    serviceType: "scheduled",
    urgency: "standard",
    baseAmount: 2800,
    weightFeePerKg: 350,
    fragileFee: 700,
    sizeSurcharge: 800,
    manualOnly: false,
    active: true,
  },
  {
    id: "rate-dispatch-priority",
    zoneId: null,
    serviceType: "dispatch",
    urgency: "priority",
    baseAmount: 4200,
    weightFeePerKg: 400,
    fragileFee: 850,
    sizeSurcharge: 950,
    manualOnly: false,
    active: true,
  },
  {
    id: "rate-intercity-standard",
    zoneId: null,
    serviceType: "inter_city",
    urgency: "standard",
    baseAmount: 9000,
    weightFeePerKg: 750,
    fragileFee: 1300,
    sizeSurcharge: 1800,
    manualOnly: false,
    active: true,
  },
  {
    id: "rate-business-route",
    zoneId: null,
    serviceType: "business_route",
    urgency: "standard",
    baseAmount: 5000,
    weightFeePerKg: 320,
    fragileFee: 650,
    sizeSurcharge: 700,
    manualOnly: false,
    active: true,
  },
];

export function sizeTierMultiplier(sizeTier: "small" | "medium" | "large" | "oversize") {
  if (sizeTier === "oversize") return 2.1;
  if (sizeTier === "large") return 1.6;
  if (sizeTier === "medium") return 1.25;
  return 1;
}

export function urgencyMultiplier(urgency: LogisticsUrgency) {
  if (urgency === "rush") return 1.45;
  if (urgency === "priority") return 1.2;
  return 1;
}

export function resolveZone(zoneKey: string | null | undefined, zones: LogisticsZone[] = DEFAULT_LOGISTICS_ZONES) {
  const normalized = String(zoneKey || "").trim().toLowerCase();
  return zones.find((zone) => zone.key === normalized) ?? zones[0];
}

export function resolveRateCard(
  serviceType: LogisticsServiceType,
  urgency: LogisticsUrgency,
  rateCards: LogisticsRateCard[] = DEFAULT_RATE_CARDS
) {
  return (
    rateCards.find(
      (rate) =>
        rate.active &&
        rate.serviceType === serviceType &&
        rate.urgency === urgency
    ) ??
    rateCards.find((rate) => rate.active && rate.serviceType === serviceType) ??
    DEFAULT_RATE_CARDS[0]
  );
}

export function calculatePromiseConfidence(input: {
  zone: LogisticsZone;
  urgency: LogisticsUrgency;
  serviceType: LogisticsServiceType;
  sizeTier: "small" | "medium" | "large" | "oversize";
}) {
  let score = 86;

  if (input.zone.key.includes("intercity")) score -= 12;
  if (input.serviceType === "inter_city") score -= 8;
  if (input.urgency === "rush") score -= 5;
  if (input.sizeTier === "oversize") score -= 8;
  if (input.sizeTier === "large") score -= 4;

  return Math.max(55, Math.min(98, score));
}

export function buildPricingBreakdown(input: {
  zone: LogisticsZone;
  serviceType: LogisticsServiceType;
  urgency: LogisticsUrgency;
  weightKg: number;
  sizeTier: "small" | "medium" | "large" | "oversize";
  fragile: boolean;
  rateCards?: LogisticsRateCard[];
  manualAdjustment?: number;
}): LogisticsPricingBreakdown {
  const rate = resolveRateCard(input.serviceType, input.urgency, input.rateCards);
  const safeWeight = Math.max(0, Number(input.weightKg || 0));
  const manualAdjustment = Number(input.manualAdjustment || 0);
  const sizeFee = Math.round(rate.sizeSurcharge * sizeTierMultiplier(input.sizeTier));
  const weightFee = Math.round(safeWeight * rate.weightFeePerKg);
  const urgencyFee =
    Math.round(rate.baseAmount * (urgencyMultiplier(input.urgency) - 1)) +
    Math.round(
      input.zone.baseFee *
        (input.zone.sameDayMultiplier - 1) *
        (input.serviceType === "same_day" ? 1 : 0)
    );
  const fragileFee = input.fragile ? rate.fragileFee : 0;
  const interCityFee =
    input.serviceType === "inter_city"
      ? Math.round(input.zone.baseFee * Math.max(0, input.zone.interCityMultiplier - 1))
      : 0;
  const baseFee = Math.round(input.zone.baseFee + rate.baseAmount);
  const total = Math.max(
    0,
    baseFee + urgencyFee + weightFee + sizeFee + fragileFee + interCityFee + manualAdjustment
  );

  return {
    currency: "NGN",
    zoneLabel: input.zone.name,
    serviceType: input.serviceType,
    urgency: input.urgency,
    baseFee,
    urgencyFee,
    weightFee,
    sizeFee,
    fragileFee,
    interCityFee,
    manualAdjustment,
    total,
    promiseWindowHours: [input.zone.etaHoursMin, input.zone.etaHoursMax],
    promiseConfidence: calculatePromiseConfidence({
      zone: input.zone,
      urgency: input.urgency,
      serviceType: input.serviceType,
      sizeTier: input.sizeTier,
    }),
  };
}

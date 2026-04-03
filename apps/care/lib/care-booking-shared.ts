import type {
  CareBookingQuoteInput,
  CareFrequencyKey,
  CarePropertyType,
  CareServiceCategoryKey,
  CareSizeBand,
  CareSuppliesMode,
  CareUrgencyKey,
} from "./care-catalog";

export const SERVICE_BOOKING_MARKER = "[service_booking]";

export type CleaningCategoryKey = Exclude<CareServiceCategoryKey, "garment">;

export type CleaningBookingPayload = {
  categoryKey: CleaningCategoryKey;
  serviceTypeKey: string;
  packageSlug?: string | null;
  frequencyKey?: CareFrequencyKey | null;
  urgencyKey?: CareUrgencyKey | null;
  zoneKey?: string | null;
  propertyType?: CarePropertyType | null;
  sizeBand?: CareSizeBand | null;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  floorCount?: number | null;
  staffCount?: number | null;
  suppliesMode?: CareSuppliesMode | null;
  addonKeys?: string[] | null;
  preferredDays?: string[] | null;
  preferredStartDate?: string | null;
  serviceWindow?: string | null;
  propertyLabel?: string | null;
  siteContactName?: string | null;
};

const CLEANING_CATEGORIES: CleaningCategoryKey[] = ["home", "office"];
const FREQUENCIES: CareFrequencyKey[] = [
  "one_time",
  "daily",
  "weekly",
  "twice_weekly",
  "biweekly",
  "monthly",
  "custom",
];
const URGENCIES: CareUrgencyKey[] = ["standard", "express", "same_day"];
const PROPERTY_TYPES: CarePropertyType[] = [
  "apartment",
  "studio",
  "bungalow",
  "duplex",
  "terrace",
  "detached",
  "office_suite",
  "office_floor",
  "showroom",
  "warehouse",
  "mixed_use",
];
const SIZE_BANDS: CareSizeBand[] = ["small", "medium", "large"];
const SUPPLIES_MODES: CareSuppliesMode[] = ["included", "customer_provided"];
const ALLOWED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableText(value: unknown) {
  const text = asText(value);
  return text || null;
}

function asNumberOrNull(value: unknown) {
  if (value == null || value === "") return null;
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return null;
  return Math.max(0, normalized);
}

function normalizeEnum<T extends readonly string[]>(value: unknown, allowed: T) {
  const text = asText(value).toLowerCase();
  return allowed.includes(text as T[number]) ? (text as T[number]) : null;
}

function normalizeDays(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((entry) => asText(entry))
    .filter((entry) => ALLOWED_DAYS.includes(entry));
}

export function normalizeCleaningBookingPayload(
  value: unknown
): CleaningBookingPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const categoryKey = normalizeEnum(source.categoryKey, CLEANING_CATEGORIES);
  const serviceTypeKey = asText(source.serviceTypeKey);

  if (!categoryKey || !serviceTypeKey) {
    return null;
  }

  return {
    categoryKey,
    serviceTypeKey,
    packageSlug: asNullableText(source.packageSlug),
    frequencyKey: normalizeEnum(source.frequencyKey, FREQUENCIES) ?? "one_time",
    urgencyKey: normalizeEnum(source.urgencyKey, URGENCIES) ?? "standard",
    zoneKey: asNullableText(source.zoneKey),
    propertyType: normalizeEnum(source.propertyType, PROPERTY_TYPES),
    sizeBand: normalizeEnum(source.sizeBand, SIZE_BANDS),
    bedroomCount: asNumberOrNull(source.bedroomCount),
    bathroomCount: asNumberOrNull(source.bathroomCount),
    floorCount: asNumberOrNull(source.floorCount),
    staffCount: asNumberOrNull(source.staffCount),
    suppliesMode: normalizeEnum(source.suppliesMode, SUPPLIES_MODES),
    addonKeys: Array.isArray(source.addonKeys)
      ? source.addonKeys.map((entry) => asText(entry)).filter(Boolean)
      : [],
    preferredDays: normalizeDays(source.preferredDays),
    preferredStartDate: asNullableText(source.preferredStartDate),
    serviceWindow: asNullableText(source.serviceWindow),
    propertyLabel: asNullableText(source.propertyLabel),
    siteContactName: asNullableText(source.siteContactName),
  };
}

export function toCleaningQuoteInput(
  payload: CleaningBookingPayload
): CareBookingQuoteInput {
  return {
    categoryKey: payload.categoryKey,
    serviceTypeKey: payload.serviceTypeKey,
    packageSlug: payload.packageSlug ?? null,
    zoneKey: payload.zoneKey ?? null,
    frequencyKey: payload.frequencyKey ?? "one_time",
    urgencyKey: payload.urgencyKey ?? "standard",
    propertyType: payload.propertyType ?? null,
    sizeBand: payload.sizeBand ?? null,
    bedroomCount: payload.bedroomCount ?? null,
    bathroomCount: payload.bathroomCount ?? null,
    floorCount: payload.floorCount ?? null,
    staffCount: payload.staffCount ?? null,
    suppliesMode: payload.suppliesMode ?? null,
    addonKeys: payload.addonKeys ?? [],
  };
}

export function isServiceBookingRecord(input: {
  item_summary?: string | null;
  service_type?: string | null;
}) {
  const summary = asText(input.item_summary);
  const serviceType = asText(input.service_type).toLowerCase();

  return (
    summary.includes(SERVICE_BOOKING_MARKER) ||
    serviceType.startsWith("home cleaning") ||
    serviceType.startsWith("office cleaning")
  );
}

export function formatFrequencyLabel(value?: CareFrequencyKey | null) {
  switch (value) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "twice_weekly":
      return "Twice weekly";
    case "biweekly":
      return "Biweekly";
    case "monthly":
      return "Monthly";
    case "custom":
      return "Custom interval";
    default:
      return "One-time";
  }
}

export function formatUrgencyLabel(value?: CareUrgencyKey | null) {
  switch (value) {
    case "express":
      return "Express";
    case "same_day":
      return "Same-day";
    default:
      return "Standard";
  }
}

import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getDefaultCareBookingCatalog,
  type CareBookingCatalog,
  type CarePriceRule,
  type CareServiceCategory,
  type CareServicePackage,
  type CareServiceType,
  type CareServiceZone,
  type CareAddonOption,
} from "./care-catalog";
import {
  normalizeCareSettings,
  type CareSettingsRecord,
} from "./care-settings-shared";
import { CARE_ACCENT } from "./care-theme";
import { applyReviewMedia } from "./care-runtime-overrides";
import { getOptionalEnv } from "./env";

export type CarePricingRow = {
  id: string;
  category: string;
  item_name: string;
  description: string | null;
  unit: string;
  price: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export type CareReviewRow = {
  id: string;
  customer_name: string;
  city: string | null;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
  photo_url?: string | null;
  photo_public_id?: string | null;
};

export type CarePricingGroup = {
  category: string;
  rows: CarePricingRow[];
};

function getSupabase() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !key) {
    throw new Error("Missing Supabase env vars.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function asNullableText(value: unknown) {
  const normalized = asText(value);
  return normalized || null;
}

function asNumber(value: unknown, fallback = 0) {
  const normalized = Number(value ?? fallback);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function asBool(value: unknown) {
  return Boolean(value);
}

function asPricingRow(row: Record<string, unknown>): CarePricingRow {
  return {
    id: asText(row.id),
    category: asText(row.category),
    item_name: asText(row.item_name),
    description: asNullableText(row.description),
    unit: asText(row.unit, "item"),
    price: asNumber(row.price),
    is_featured: asBool(row.is_featured),
    is_active: asBool(row.is_active),
    sort_order: asNumber(row.sort_order, 100),
  };
}

export function groupPricing(items: CarePricingRow[]): CarePricingGroup[] {
  const map = new Map<string, CarePricingRow[]>();

  for (const item of items) {
    const key = asText(item.category, "Uncategorized");
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  }

  return [...map.entries()]
    .map(([category, rows]) => ({
      category,
      rows: [...rows].sort(
        (a, b) =>
          Number(a.sort_order ?? 100) - Number(b.sort_order ?? 100) ||
          a.item_name.localeCompare(b.item_name)
      ),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function getCarePricing(): Promise<CarePricingRow[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("care_pricing")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("item_name", { ascending: true });

    return ((data ?? []) as Record<string, unknown>[]).map(asPricingRow);
  } catch {
    return [];
  }
}

export async function getApprovedReviews(limit = 12): Promise<CareReviewRow[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("care_reviews")
      .select("id, customer_name, city, rating, review_text, is_approved, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: asText(row.id),
      customer_name: asText(row.customer_name, "Verified customer"),
      city: asNullableText(row.city),
      rating: Math.max(0, Math.min(5, asNumber(row.rating, 5))),
      review_text: asText(row.review_text),
      is_approved: asBool(row.is_approved),
      created_at: asText(row.created_at),
    }));

    return await applyReviewMedia(rows);
  } catch {
    return [];
  }
}

export async function getCareSettings(): Promise<CareSettingsRecord> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("care_settings").select("*").limit(1).maybeSingle();
    return normalizeCareSettings((data ?? null) as Record<string, unknown> | null);
  } catch {
    return normalizeCareSettings(null);
  }
}

function normalizeCategoryRow(row: Record<string, unknown>, fallback?: CareServiceCategory) {
  return {
    id: asText(row.id, fallback?.id ?? ""),
    key: (asText(row.key, fallback?.key ?? "garment") as CareServiceCategory["key"]),
    name: asText(row.name, fallback?.name ?? ""),
    description: asText(row.description, fallback?.description ?? ""),
    accent: asText(row.accent, fallback?.accent ?? CARE_ACCENT),
    sort_order: asNumber(row.sort_order, fallback?.sort_order ?? 100),
    is_active:
      row.is_active == null ? fallback?.is_active ?? true : asBool(row.is_active),
  } satisfies CareServiceCategory;
}

function normalizeTypeRow(row: Record<string, unknown>, fallback?: CareServiceType) {
  return {
    id: asText(row.id, fallback?.id ?? ""),
    key: asText(row.key, fallback?.key ?? ""),
    category_key: asText(
      row.category_key,
      fallback?.category_key ?? "home"
    ) as CareServiceType["category_key"],
    name: asText(row.name, fallback?.name ?? ""),
    description: asText(row.description, fallback?.description ?? ""),
    pricing_model: asText(
      row.pricing_model,
      fallback?.pricing_model ?? "property"
    ) as CareServiceType["pricing_model"],
    base_price: asNumber(row.base_price, fallback?.base_price ?? 0),
    default_duration_min: asNumber(
      row.default_duration_min,
      fallback?.default_duration_min ?? 180
    ),
    default_staff_count: asNumber(
      row.default_staff_count,
      fallback?.default_staff_count ?? 2
    ),
    is_recurring_eligible:
      row.is_recurring_eligible == null
        ? fallback?.is_recurring_eligible ?? false
        : asBool(row.is_recurring_eligible),
    is_express_eligible:
      row.is_express_eligible == null
        ? fallback?.is_express_eligible ?? false
        : asBool(row.is_express_eligible),
    sort_order: asNumber(row.sort_order, fallback?.sort_order ?? 100),
    is_active: row.is_active == null ? fallback?.is_active ?? true : asBool(row.is_active),
  } satisfies CareServiceType;
}

function normalizePackageRow(row: Record<string, unknown>, fallback?: CareServicePackage) {
  return {
    id: asText(row.id, fallback?.id ?? ""),
    slug: asText(row.slug, fallback?.slug ?? ""),
    category_key: asText(
      row.category_key,
      fallback?.category_key ?? "home"
    ) as CareServicePackage["category_key"],
    service_type_key: asText(row.service_type_key, fallback?.service_type_key ?? ""),
    name: asText(row.name, fallback?.name ?? ""),
    summary: asText(row.summary, fallback?.summary ?? ""),
    description: asText(row.description, fallback?.description ?? ""),
    base_price: asNumber(row.base_price, fallback?.base_price ?? 0),
    staff_count: asNumber(row.staff_count, fallback?.staff_count ?? 2),
    duration_min: asNumber(row.duration_min, fallback?.duration_min ?? 180),
    featured_badge:
      asNullableText(row.featured_badge) ?? fallback?.featured_badge ?? null,
    default_frequency: asText(
      row.default_frequency,
      fallback?.default_frequency ?? "one_time"
    ) as CareServicePackage["default_frequency"],
    is_featured:
      row.is_featured == null ? fallback?.is_featured ?? false : asBool(row.is_featured),
    is_active: row.is_active == null ? fallback?.is_active ?? true : asBool(row.is_active),
    sort_order: asNumber(row.sort_order, fallback?.sort_order ?? 100),
  } satisfies CareServicePackage;
}

function normalizeZoneRow(row: Record<string, unknown>, fallback?: CareServiceZone) {
  return {
    id: asText(row.id, fallback?.id ?? ""),
    key: asText(row.key, fallback?.key ?? ""),
    name: asText(row.name, fallback?.name ?? ""),
    summary: asText(row.summary, fallback?.summary ?? ""),
    travel_fee: asNumber(row.travel_fee, fallback?.travel_fee ?? 0),
    sort_order: asNumber(row.sort_order, fallback?.sort_order ?? 100),
    is_active: row.is_active == null ? fallback?.is_active ?? true : asBool(row.is_active),
  } satisfies CareServiceZone;
}

function normalizeAddonRow(row: Record<string, unknown>, fallback?: CareAddonOption) {
  return {
    id: asText(row.id, fallback?.id ?? ""),
    key: asText(row.key, fallback?.key ?? ""),
    category_key: asText(
      row.category_key,
      fallback?.category_key ?? "home"
    ) as CareAddonOption["category_key"],
    label: asText(row.label, fallback?.label ?? ""),
    description: asText(row.description, fallback?.description ?? ""),
    amount: asNumber(row.amount, fallback?.amount ?? 0),
    sort_order: asNumber(row.sort_order, fallback?.sort_order ?? 100),
    is_active: row.is_active == null ? fallback?.is_active ?? true : asBool(row.is_active),
  } satisfies CareAddonOption;
}

function normalizeRuleRow(row: Record<string, unknown>, fallback?: CarePriceRule) {
  return {
    id: asText(row.id, fallback?.id ?? ""),
    category_key: asText(
      row.category_key,
      fallback?.category_key ?? "home"
    ) as CarePriceRule["category_key"],
    service_type_key:
      asNullableText(row.service_type_key) ?? fallback?.service_type_key ?? null,
    label: asText(row.label, fallback?.label ?? ""),
    rule_kind: asText(
      row.rule_kind,
      fallback?.rule_kind ?? "size_band"
    ) as CarePriceRule["rule_kind"],
    amount: asNumber(row.amount, fallback?.amount ?? 0),
    percent: asNumber(row.percent, fallback?.percent ?? 0),
    min_value: row.min_value == null ? fallback?.min_value ?? null : asNumber(row.min_value),
    max_value: row.max_value == null ? fallback?.max_value ?? null : asNumber(row.max_value),
    match_value: asNullableText(row.match_value) ?? fallback?.match_value ?? null,
    sort_order: asNumber(row.sort_order, fallback?.sort_order ?? 100),
    is_active: row.is_active == null ? fallback?.is_active ?? true : asBool(row.is_active),
  } satisfies CarePriceRule;
}

async function readCatalogTable(table: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from(table).select("*").order("sort_order", {
      ascending: true,
    });

    if (error) {
      return null;
    }

    return (data ?? []) as Record<string, unknown>[];
  } catch {
    return null;
  }
}

export async function getCareBookingCatalog(): Promise<CareBookingCatalog> {
  const fallback = getDefaultCareBookingCatalog();

  const [categoryRows, typeRows, packageRows, zoneRows, addonRows, ruleRows] = await Promise.all([
    readCatalogTable("care_service_categories"),
    readCatalogTable("care_service_types"),
    readCatalogTable("care_service_packages"),
    readCatalogTable("care_service_zones"),
    readCatalogTable("care_service_addons"),
    readCatalogTable("care_price_rules"),
  ]);

  return {
    categories:
      categoryRows && categoryRows.length > 0
        ? categoryRows.map((row, index) =>
            normalizeCategoryRow(row, fallback.categories[index])
          )
        : fallback.categories,
    serviceTypes:
      typeRows && typeRows.length > 0
        ? typeRows.map((row, index) => normalizeTypeRow(row, fallback.serviceTypes[index]))
        : fallback.serviceTypes,
    packages:
      packageRows && packageRows.length > 0
        ? packageRows.map((row, index) =>
            normalizePackageRow(row, fallback.packages[index])
          )
        : fallback.packages,
    zones:
      zoneRows && zoneRows.length > 0
        ? zoneRows.map((row, index) => normalizeZoneRow(row, fallback.zones[index]))
        : fallback.zones,
    addOns:
      addonRows && addonRows.length > 0
        ? addonRows.map((row, index) => normalizeAddonRow(row, fallback.addOns[index]))
        : fallback.addOns,
    priceRules:
      ruleRows && ruleRows.length > 0
        ? ruleRows.map((row, index) => normalizeRuleRow(row, fallback.priceRules[index]))
        : fallback.priceRules,
  };
}

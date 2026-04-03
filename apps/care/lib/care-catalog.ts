import { CARE_ACCENT } from "@/lib/care-theme";

export type CareServiceCategoryKey = "garment" | "home" | "office";
export type CareFrequencyKey =
  | "one_time"
  | "daily"
  | "weekly"
  | "twice_weekly"
  | "biweekly"
  | "monthly"
  | "custom";
export type CareUrgencyKey = "standard" | "express" | "same_day";
export type CareSuppliesMode = "included" | "customer_provided";
export type CarePropertyType =
  | "apartment"
  | "studio"
  | "bungalow"
  | "duplex"
  | "terrace"
  | "detached"
  | "office_suite"
  | "office_floor"
  | "showroom"
  | "warehouse"
  | "mixed_use";
export type CareSizeBand = "small" | "medium" | "large";

export type CareServiceCategory = {
  id: string;
  key: CareServiceCategoryKey;
  name: string;
  description: string;
  accent: string;
  sort_order: number;
  is_active: boolean;
};

export type CareServiceType = {
  id: string;
  key: string;
  category_key: CareServiceCategoryKey;
  name: string;
  description: string;
  pricing_model: "itemized" | "property" | "commercial";
  base_price: number;
  default_duration_min: number;
  default_staff_count: number;
  is_recurring_eligible: boolean;
  is_express_eligible: boolean;
  sort_order: number;
  is_active: boolean;
};

export type CareServicePackage = {
  id: string;
  slug: string;
  category_key: Exclude<CareServiceCategoryKey, "garment">;
  service_type_key: string;
  name: string;
  summary: string;
  description: string;
  base_price: number;
  staff_count: number;
  duration_min: number;
  featured_badge?: string | null;
  default_frequency: CareFrequencyKey;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export type CareServiceZone = {
  id: string;
  key: string;
  name: string;
  summary: string;
  travel_fee: number;
  sort_order: number;
  is_active: boolean;
};

export type CareAddonOption = {
  id: string;
  key: string;
  category_key: Exclude<CareServiceCategoryKey, "garment">;
  label: string;
  description: string;
  amount: number;
  sort_order: number;
  is_active: boolean;
};

export type CarePriceRule = {
  id: string;
  category_key: Exclude<CareServiceCategoryKey, "garment">;
  service_type_key?: string | null;
  label: string;
  rule_kind:
    | "bedroom_step"
    | "bathroom_step"
    | "floor_step"
    | "property_type"
    | "size_band"
    | "supplies"
    | "urgency"
    | "recurrence_discount"
    | "staff_increment";
  amount: number;
  percent: number;
  min_value?: number | null;
  max_value?: number | null;
  match_value?: string | null;
  sort_order: number;
  is_active: boolean;
};

export type CareBookingCatalog = {
  categories: CareServiceCategory[];
  serviceTypes: CareServiceType[];
  packages: CareServicePackage[];
  zones: CareServiceZone[];
  addOns: CareAddonOption[];
  priceRules: CarePriceRule[];
};

export type CareBookingQuoteInput = {
  categoryKey: Exclude<CareServiceCategoryKey, "garment">;
  serviceTypeKey: string;
  packageSlug?: string | null;
  zoneKey?: string | null;
  frequencyKey?: CareFrequencyKey | null;
  urgencyKey?: CareUrgencyKey | null;
  propertyType?: CarePropertyType | null;
  sizeBand?: CareSizeBand | null;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  floorCount?: number | null;
  staffCount?: number | null;
  suppliesMode?: CareSuppliesMode | null;
  addonKeys?: string[] | null;
};

export type CareQuoteLine = {
  label: string;
  amount: number;
};

export type CareBookingQuote = {
  basePrice: number;
  modifiers: CareQuoteLine[];
  total: number;
  recommendedStaffCount: number;
  estimatedDurationMin: number;
  summary: string[];
};

export const DEFAULT_CARE_BOOKING_CATALOG: CareBookingCatalog = {
  categories: [
    {
      id: "cat_garment",
      key: "garment",
      name: "Garment Care",
      description: "Dry cleaning, laundry, pressing, stain treatment, and delicate handling.",
      accent: CARE_ACCENT,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "cat_home",
      key: "home",
      name: "Home Cleaning",
      description: "Residential cleaning for one-time, deep, and recurring routines.",
      accent: "#8EC5FF",
      sort_order: 2,
      is_active: true,
    },
    {
      id: "cat_office",
      key: "office",
      name: "Office Cleaning",
      description: "Professional commercial cleaning for offices, showrooms, and workspaces.",
      accent: "#8DE1B5",
      sort_order: 3,
      is_active: true,
    },
  ],
  serviceTypes: [
    {
      id: "svc_home_standard",
      key: "home_standard",
      category_key: "home",
      name: "One-time home cleaning",
      description: "Routine cleaning for apartments, terraces, and family homes.",
      pricing_model: "property",
      base_price: 18000,
      default_duration_min: 180,
      default_staff_count: 2,
      is_recurring_eligible: true,
      is_express_eligible: true,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "svc_home_deep",
      key: "home_deep",
      category_key: "home",
      name: "Deep cleaning",
      description: "High-intensity reset for kitchens, bathrooms, hidden buildup, and detail areas.",
      pricing_model: "property",
      base_price: 30000,
      default_duration_min: 300,
      default_staff_count: 3,
      is_recurring_eligible: true,
      is_express_eligible: true,
      sort_order: 2,
      is_active: true,
    },
    {
      id: "svc_home_move",
      key: "home_move",
      category_key: "home",
      name: "Move-in / move-out cleaning",
      description: "Prepared for vacant properties, move transitions, and turnover quality.",
      pricing_model: "property",
      base_price: 42000,
      default_duration_min: 360,
      default_staff_count: 4,
      is_recurring_eligible: false,
      is_express_eligible: true,
      sort_order: 3,
      is_active: true,
    },
    {
      id: "svc_office_standard",
      key: "office_standard",
      category_key: "office",
      name: "Office cleaning",
      description: "Professional maintenance for workspaces, reception, and shared areas.",
      pricing_model: "commercial",
      base_price: 30000,
      default_duration_min: 240,
      default_staff_count: 3,
      is_recurring_eligible: true,
      is_express_eligible: true,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "svc_office_after_hours",
      key: "office_after_hours",
      category_key: "office",
      name: "After-hours office cleaning",
      description: "Quiet-window cleaning for teams that need zero disruption during work time.",
      pricing_model: "commercial",
      base_price: 36000,
      default_duration_min: 270,
      default_staff_count: 3,
      is_recurring_eligible: true,
      is_express_eligible: true,
      sort_order: 2,
      is_active: true,
    },
    {
      id: "svc_office_sanitization",
      key: "office_sanitization",
      category_key: "office",
      name: "Workspace sanitization",
      description: "Sanitization-focused cleaning for desks, contact points, and restrooms.",
      pricing_model: "commercial",
      base_price: 34000,
      default_duration_min: 240,
      default_staff_count: 3,
      is_recurring_eligible: true,
      is_express_eligible: true,
      sort_order: 3,
      is_active: true,
    },
  ],
  packages: [
    {
      id: "pkg_home_signature",
      slug: "signature-home-refresh",
      category_key: "home",
      service_type_key: "home_standard",
      name: "Signature Home Refresh",
      summary: "One-time residential reset",
      description: "Bedrooms, bathrooms, kitchen touchpoints, surfaces, and presentation-focused finishing.",
      base_price: 26000,
      staff_count: 2,
      duration_min: 210,
      featured_badge: "Most booked",
      default_frequency: "one_time",
      is_featured: true,
      is_active: true,
      sort_order: 1,
    },
    {
      id: "pkg_home_weekly",
      slug: "weekly-home-ritual",
      category_key: "home",
      service_type_key: "home_standard",
      name: "Weekly Home Ritual",
      summary: "Recurring weekly home cleaning plan",
      description: "Designed for consistent weekly standards, lighter resets, and better home upkeep.",
      base_price: 22000,
      staff_count: 2,
      duration_min: 180,
      featured_badge: "Recurring",
      default_frequency: "weekly",
      is_featured: true,
      is_active: true,
      sort_order: 2,
    },
    {
      id: "pkg_home_deep",
      slug: "deep-reset",
      category_key: "home",
      service_type_key: "home_deep",
      name: "Deep Reset",
      summary: "High-intensity deep cleaning",
      description: "For deep kitchen, bathroom, detail lines, and neglected surfaces.",
      base_price: 42000,
      staff_count: 3,
      duration_min: 320,
      featured_badge: "Intensive",
      default_frequency: "one_time",
      is_featured: false,
      is_active: true,
      sort_order: 3,
    },
    {
      id: "pkg_office_starter",
      slug: "office-starter",
      category_key: "office",
      service_type_key: "office_standard",
      name: "Office Starter",
      summary: "Small office maintenance plan",
      description: "Best for compact teams, suites, and tidy operational floors.",
      base_price: 42000,
      staff_count: 3,
      duration_min: 240,
      featured_badge: "Small office",
      default_frequency: "weekly",
      is_featured: true,
      is_active: true,
      sort_order: 1,
    },
    {
      id: "pkg_office_growth",
      slug: "office-growth",
      category_key: "office",
      service_type_key: "office_standard",
      name: "Office Growth",
      summary: "Recurring medium-office cleaning",
      description: "Adds reception, shared workspace, restroom, and common area depth.",
      base_price: 65000,
      staff_count: 4,
      duration_min: 300,
      featured_badge: "Medium office",
      default_frequency: "weekly",
      is_featured: true,
      is_active: true,
      sort_order: 2,
    },
    {
      id: "pkg_office_after_hours",
      slug: "after-hours-command",
      category_key: "office",
      service_type_key: "office_after_hours",
      name: "After-hours Command",
      summary: "Night-window workspace reset",
      description: "For teams that require no interruption during active work periods.",
      base_price: 72000,
      staff_count: 4,
      duration_min: 330,
      featured_badge: "After-hours",
      default_frequency: "weekly",
      is_featured: false,
      is_active: true,
      sort_order: 3,
    },
  ],
  zones: [
    {
      id: "zone_core",
      key: "core",
      name: "Core Service Zone",
      summary: "Best turnaround and lowest travel overhead.",
      travel_fee: 0,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "zone_extended",
      key: "extended",
      name: "Extended Zone",
      summary: "Further travel while keeping response coverage intact.",
      travel_fee: 3500,
      sort_order: 2,
      is_active: true,
    },
    {
      id: "zone_metro_plus",
      key: "metro_plus",
      name: "Metro Plus",
      summary: "High-distance or logistics-heavy service coverage.",
      travel_fee: 7000,
      sort_order: 3,
      is_active: true,
    },
  ],
  addOns: [
    {
      id: "addon_kitchen_intensive",
      key: "kitchen_intensive",
      category_key: "home",
      label: "Kitchen intensive cleaning",
      description: "Extra degreasing and appliance-area detail work.",
      amount: 5500,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "addon_bathroom_intensive",
      key: "bathroom_intensive",
      category_key: "home",
      label: "Bathroom intensive cleaning",
      description: "Fixture detail, scaling attention, and deeper sanitization.",
      amount: 4500,
      sort_order: 2,
      is_active: true,
    },
    {
      id: "addon_upholstery",
      key: "upholstery_mattress",
      category_key: "home",
      label: "Upholstery / mattress care",
      description: "Sofa, mattress, or soft-surface treatment.",
      amount: 7500,
      sort_order: 3,
      is_active: true,
    },
    {
      id: "addon_reception",
      key: "reception_detail",
      category_key: "office",
      label: "Reception and common area polish",
      description: "Client-facing entrance, waiting area, and shared presentation zones.",
      amount: 5000,
      sort_order: 4,
      is_active: true,
    },
    {
      id: "addon_restroom",
      key: "restroom_maintenance",
      category_key: "office",
      label: "Restroom maintenance boost",
      description: "Restroom restocking and high-frequency care uplift.",
      amount: 6000,
      sort_order: 5,
      is_active: true,
    },
    {
      id: "addon_workspace_sanitization",
      key: "workspace_sanitization",
      category_key: "office",
      label: "Workspace sanitization",
      description: "Additional sanitization sweep for workstations and touch points.",
      amount: 7000,
      sort_order: 6,
      is_active: true,
    },
  ],
  priceRules: [
    { id: "rule_home_bed_34", category_key: "home", service_type_key: null, label: "3-4 bedrooms", rule_kind: "bedroom_step", amount: 4000, percent: 0, min_value: 3, max_value: 4, match_value: null, sort_order: 10, is_active: true },
    { id: "rule_home_bed_56", category_key: "home", service_type_key: null, label: "5+ bedrooms", rule_kind: "bedroom_step", amount: 9000, percent: 0, min_value: 5, max_value: null, match_value: null, sort_order: 11, is_active: true },
    { id: "rule_home_bath_3", category_key: "home", service_type_key: null, label: "3+ bathrooms", rule_kind: "bathroom_step", amount: 3000, percent: 0, min_value: 3, max_value: null, match_value: null, sort_order: 12, is_active: true },
    { id: "rule_home_floor_2", category_key: "home", service_type_key: null, label: "Second floor and above", rule_kind: "floor_step", amount: 3500, percent: 0, min_value: 2, max_value: null, match_value: null, sort_order: 13, is_active: true },
    { id: "rule_home_duplex", category_key: "home", service_type_key: null, label: "Duplex / detached home uplift", rule_kind: "property_type", amount: 5000, percent: 0, min_value: null, max_value: null, match_value: "duplex", sort_order: 14, is_active: true },
    { id: "rule_supplies_included_home", category_key: "home", service_type_key: null, label: "Supplies included", rule_kind: "supplies", amount: 3500, percent: 0, min_value: null, max_value: null, match_value: "included", sort_order: 15, is_active: true },
    { id: "rule_office_medium", category_key: "office", service_type_key: null, label: "Medium office", rule_kind: "size_band", amount: 12000, percent: 0, min_value: null, max_value: null, match_value: "medium", sort_order: 20, is_active: true },
    { id: "rule_office_large", category_key: "office", service_type_key: null, label: "Large office", rule_kind: "size_band", amount: 26000, percent: 0, min_value: null, max_value: null, match_value: "large", sort_order: 21, is_active: true },
    { id: "rule_supplies_included_office", category_key: "office", service_type_key: null, label: "Supplies included", rule_kind: "supplies", amount: 5000, percent: 0, min_value: null, max_value: null, match_value: "included", sort_order: 22, is_active: true },
    { id: "rule_urgency_express", category_key: "home", service_type_key: null, label: "Express dispatch", rule_kind: "urgency", amount: 6000, percent: 0, min_value: null, max_value: null, match_value: "express", sort_order: 30, is_active: true },
    { id: "rule_urgency_same_day", category_key: "home", service_type_key: null, label: "Same-day dispatch", rule_kind: "urgency", amount: 11000, percent: 0, min_value: null, max_value: null, match_value: "same_day", sort_order: 31, is_active: true },
    { id: "rule_urgency_express_office", category_key: "office", service_type_key: null, label: "Express dispatch", rule_kind: "urgency", amount: 9000, percent: 0, min_value: null, max_value: null, match_value: "express", sort_order: 32, is_active: true },
    { id: "rule_recur_weekly", category_key: "home", service_type_key: null, label: "Weekly plan discount", rule_kind: "recurrence_discount", amount: 0, percent: 8, min_value: null, max_value: null, match_value: "weekly", sort_order: 40, is_active: true },
    { id: "rule_recur_biweekly", category_key: "home", service_type_key: null, label: "Biweekly plan discount", rule_kind: "recurrence_discount", amount: 0, percent: 5, min_value: null, max_value: null, match_value: "biweekly", sort_order: 41, is_active: true },
    { id: "rule_recur_monthly", category_key: "home", service_type_key: null, label: "Monthly plan discount", rule_kind: "recurrence_discount", amount: 0, percent: 3, min_value: null, max_value: null, match_value: "monthly", sort_order: 42, is_active: true },
    { id: "rule_recur_weekly_office", category_key: "office", service_type_key: null, label: "Weekly office contract discount", rule_kind: "recurrence_discount", amount: 0, percent: 10, min_value: null, max_value: null, match_value: "weekly", sort_order: 43, is_active: true },
    { id: "rule_staff_increment", category_key: "office", service_type_key: null, label: "Additional staffing unit", rule_kind: "staff_increment", amount: 6000, percent: 0, min_value: 4, max_value: null, match_value: null, sort_order: 50, is_active: true },
  ],
};

function sortByOrder<T extends { sort_order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export function getDefaultCareBookingCatalog(): CareBookingCatalog {
  return {
    categories: sortByOrder(DEFAULT_CARE_BOOKING_CATALOG.categories),
    serviceTypes: sortByOrder(DEFAULT_CARE_BOOKING_CATALOG.serviceTypes),
    packages: sortByOrder(DEFAULT_CARE_BOOKING_CATALOG.packages),
    zones: sortByOrder(DEFAULT_CARE_BOOKING_CATALOG.zones),
    addOns: sortByOrder(DEFAULT_CARE_BOOKING_CATALOG.addOns),
    priceRules: sortByOrder(DEFAULT_CARE_BOOKING_CATALOG.priceRules),
  };
}

function clampCount(value: number | null | undefined, fallback = 0) {
  const normalized = Number(value ?? fallback);
  return Number.isFinite(normalized) ? Math.max(0, normalized) : fallback;
}

function applyRuleIfMatched(input: CareBookingQuoteInput, rule: CarePriceRule) {
  switch (rule.rule_kind) {
    case "bedroom_step": {
      const bedrooms = clampCount(input.bedroomCount);
      const withinMin = rule.min_value == null || bedrooms >= rule.min_value;
      const withinMax = rule.max_value == null || bedrooms <= rule.max_value;
      return withinMin && withinMax;
    }
    case "bathroom_step": {
      const bathrooms = clampCount(input.bathroomCount);
      const withinMin = rule.min_value == null || bathrooms >= rule.min_value;
      const withinMax = rule.max_value == null || bathrooms <= rule.max_value;
      return withinMin && withinMax;
    }
    case "floor_step": {
      const floors = clampCount(input.floorCount);
      const withinMin = rule.min_value == null || floors >= rule.min_value;
      const withinMax = rule.max_value == null || floors <= rule.max_value;
      return withinMin && withinMax;
    }
    case "property_type":
      return input.propertyType === rule.match_value;
    case "size_band":
      return input.sizeBand === rule.match_value;
    case "supplies":
      return input.suppliesMode === rule.match_value;
    case "urgency":
      return input.urgencyKey === rule.match_value;
    case "recurrence_discount":
      return input.frequencyKey === rule.match_value;
    case "staff_increment": {
      const staffCount = clampCount(input.staffCount);
      return rule.min_value != null ? staffCount >= rule.min_value : staffCount > 0;
    }
    default:
      return false;
  }
}

function formatFrequencyLabel(value: CareFrequencyKey | null | undefined) {
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
      return "One time";
  }
}

export function calculateCleaningQuote(
  input: CareBookingQuoteInput,
  catalog = getDefaultCareBookingCatalog()
): CareBookingQuote {
  const serviceType = catalog.serviceTypes.find(
    (item) => item.key === input.serviceTypeKey && item.category_key === input.categoryKey
  );
  const selectedPackage = catalog.packages.find(
    (item) => item.slug === input.packageSlug && item.category_key === input.categoryKey
  );
  const zone = catalog.zones.find((item) => item.key === input.zoneKey);
  const selectedAddOns = catalog.addOns.filter(
    (item) =>
      item.category_key === input.categoryKey &&
      item.is_active &&
      (input.addonKeys ?? []).includes(item.key)
  );

  const basePrice = Math.max(0, selectedPackage?.base_price ?? serviceType?.base_price ?? 0);
  const baseStaffCount = selectedPackage?.staff_count ?? serviceType?.default_staff_count ?? 2;
  const baseDuration = selectedPackage?.duration_min ?? serviceType?.default_duration_min ?? 180;

  const modifiers: CareQuoteLine[] = [];
  const rules = sortByOrder(
    catalog.priceRules.filter(
      (item) =>
        item.category_key === input.categoryKey &&
        (!item.service_type_key || item.service_type_key === input.serviceTypeKey) &&
        item.is_active
    )
  );

  if (zone?.travel_fee) {
    modifiers.push({ label: `${zone.name} travel`, amount: zone.travel_fee });
  }

  for (const addOn of selectedAddOns) {
    modifiers.push({ label: addOn.label, amount: addOn.amount });
  }

  for (const rule of rules) {
    if (!applyRuleIfMatched(input, rule)) {
      continue;
    }

    if (rule.rule_kind === "staff_increment") {
      const staffCount = clampCount(input.staffCount, baseStaffCount);
      const extraStaff = Math.max(0, staffCount - Math.max(baseStaffCount, rule.min_value ?? 0));
      if (extraStaff > 0) {
        modifiers.push({
          label: `${extraStaff} additional staff unit${extraStaff > 1 ? "s" : ""}`,
          amount: rule.amount * extraStaff,
        });
      }
      continue;
    }

    if (rule.rule_kind === "recurrence_discount") {
      const discountBase = basePrice + modifiers.reduce((sum, item) => sum + item.amount, 0);
      modifiers.push({
        label: `${rule.label}`,
        amount: -Math.round((discountBase * rule.percent) / 100),
      });
      continue;
    }

    modifiers.push({
      label: rule.label,
      amount: rule.amount || Math.round((basePrice * rule.percent) / 100),
    });
  }

  const total = Math.max(
    0,
    basePrice + modifiers.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  );

  const recommendedStaffCount = Math.max(baseStaffCount, clampCount(input.staffCount, baseStaffCount));
  const estimatedDurationMin =
    baseDuration +
    Math.max(0, clampCount(input.bedroomCount) - 2) * 20 +
    Math.max(0, clampCount(input.bathroomCount) - 1) * 12 +
    Math.max(0, clampCount(input.floorCount) - 1) * 20;

  const summary = [
    selectedPackage?.name ?? serviceType?.name ?? "Custom cleaning booking",
    input.propertyType ? `Property: ${input.propertyType.replaceAll("_", " ")}` : null,
    input.sizeBand ? `Size: ${input.sizeBand}` : null,
    input.bedroomCount ? `Bedrooms: ${input.bedroomCount}` : null,
    input.bathroomCount ? `Bathrooms: ${input.bathroomCount}` : null,
    input.floorCount ? `Floors: ${input.floorCount}` : null,
    input.suppliesMode ? `Supplies: ${input.suppliesMode.replaceAll("_", " ")}` : null,
    selectedAddOns.length > 0
      ? `Add-ons: ${selectedAddOns.map((item) => item.label).join(", ")}`
      : null,
    `Frequency: ${formatFrequencyLabel(input.frequencyKey)}`,
  ].filter(Boolean) as string[];

  return {
    basePrice,
    modifiers,
    total,
    recommendedStaffCount,
    estimatedDurationMin,
    summary,
  };
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${d.getUTCDate().toString().padStart(2, "0")} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

const NF = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export function formatMoney(
  amount: number | null | undefined,
  currency = "NGN",
  contactFallback?: string,
): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return contactFallback ?? "Contact agent";
  if (currency === "NGN") return `₦${NF.format(n)}`;
  return `${currency} ${NF.format(n)}`;
}

export type RoomCountLabels = {
  bedSingular: string;
  bedPlural: string;
  bathSingular: string;
  bathPlural: string;
  sizeSqmTemplate: string;
};

export function formatRoomCount(
  bedrooms: number | null,
  bathrooms: number | null,
  sizeSqm: number | null,
  labels?: RoomCountLabels,
): string {
  const parts: string[] = [];
  if (bedrooms != null && bedrooms > 0) {
    const unit = labels
      ? bedrooms === 1
        ? labels.bedSingular
        : labels.bedPlural
      : bedrooms === 1
        ? "bed"
        : "beds";
    parts.push(`${bedrooms} ${unit}`);
  }
  if (bathrooms != null && bathrooms > 0) {
    const unit = labels
      ? bathrooms === 1
        ? labels.bathSingular
        : labels.bathPlural
      : bathrooms === 1
        ? "bath"
        : "baths";
    parts.push(`${bathrooms} ${unit}`);
  }
  if (sizeSqm != null && sizeSqm > 0) {
    const sizeText = labels
      ? labels.sizeSqmTemplate.replace("{size}", String(sizeSqm))
      : `${sizeSqm} sqm`;
    parts.push(sizeText);
  }
  return parts.join(" · ");
}

export type ActivityKind = "inquiry" | "viewing" | "listing" | "generic";

const ACTIVITY_KIND_BY_TYPE: Record<string, ActivityKind> = {
  property_inquiry: "inquiry",
  property_viewing_requested: "viewing",
  property_listing_submitted: "listing",
  property_listing_updated: "listing",
  property_listing_reviewed: "listing",
};

export function activityKind(activityType: string | null | undefined): ActivityKind {
  return ACTIVITY_KIND_BY_TYPE[String(activityType ?? "")] ?? "generic";
}

export type ActivityTitleLabels = {
  inquiry: string;
  viewing: string;
  listing_submitted: string;
  listing_updated: string;
  listing_reviewed: string;
};

const ACTIVITY_TITLE_BY_TYPE_DEFAULT: Record<string, string> = {
  property_inquiry: "Property inquiry",
  property_viewing_requested: "Viewing request",
  property_listing_submitted: "Listing submitted",
  property_listing_updated: "Listing updated",
  property_listing_reviewed: "Listing review complete",
};

export function activityTitle(
  activityType: string | null | undefined,
  labels?: ActivityTitleLabels,
): string {
  const k = String(activityType ?? "");
  if (labels) {
    switch (k) {
      case "property_inquiry":
        return labels.inquiry;
      case "property_viewing_requested":
        return labels.viewing;
      case "property_listing_submitted":
        return labels.listing_submitted;
      case "property_listing_updated":
        return labels.listing_updated;
      case "property_listing_reviewed":
        return labels.listing_reviewed;
    }
  }
  return ACTIVITY_TITLE_BY_TYPE_DEFAULT[k] || k.replace(/_/g, " ");
}

export function countByActivity(
  activity: ReadonlyArray<Record<string, unknown>>,
  activityTypes: ReadonlyArray<string>,
): number {
  return activity.filter((item) =>
    activityTypes.includes(String(item.activity_type || "")),
  ).length;
}

/* ---- Hero state + copy ---------------------------------------------- */

export type PropertyStats = {
  saved: number;
  inquiries: number;
  viewings: number;
  listings: number;
  managed: number;
  total: number;
};

export function propertyStats(
  saved: number,
  inquiries: number,
  viewings: number,
  listings: number,
  managed: number,
): PropertyStats {
  return {
    saved,
    inquiries,
    viewings,
    listings,
    managed,
    total: saved + inquiries + viewings + listings,
  };
}

export type HeroState = "empty" | "discover" | "active";

export function heroState(stats: PropertyStats): HeroState {
  if (stats.total === 0) return "empty";
  if (stats.inquiries > 0 || stats.viewings > 0) return "active";
  return "discover";
}

/* ---- Side-panel "By activity" breakdown ----------------------------- */

export type BreakdownLabels = {
  saved: string;
  inquiries: string;
  viewings: string;
  listings: string;
};

export type ActivityBreakdownItem = {
  key: ActivityKind | "saved" | "listing";
  label: string;
  count: number;
  color: string;
};

/**
 * Breakdown rows for the hero side panel.
 * Colours map to existing --acct-* brand tokens so the dot matches the
 * row-icon background used in PropertyActivity, keeping discipline tight.
 */
export function activityBreakdown(
  stats: PropertyStats,
  labels: BreakdownLabels,
): ReadonlyArray<ActivityBreakdownItem> {
  const rows: ActivityBreakdownItem[] = [
    { key: "saved",    label: labels.saved,     count: stats.saved,     color: "var(--acct-purple)" },
    { key: "inquiry",  label: labels.inquiries, count: stats.inquiries, color: "var(--acct-blue)" },
    { key: "viewing",  label: labels.viewings,  count: stats.viewings,  color: "var(--acct-gold)" },
    { key: "listing",  label: labels.listings,  count: stats.listings,  color: "var(--acct-green)" },
  ];
  return rows.filter((r) => r.count > 0);
}

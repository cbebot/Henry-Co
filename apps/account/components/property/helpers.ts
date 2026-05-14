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

export function formatMoney(amount: number | null | undefined, currency = "NGN"): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "Contact agent";
  if (currency === "NGN") return `₦${NF.format(n)}`;
  return `${currency} ${NF.format(n)}`;
}

export function formatRoomCount(bedrooms: number | null, bathrooms: number | null, sizeSqm: number | null): string {
  const parts: string[] = [];
  if (bedrooms != null && bedrooms > 0) parts.push(`${bedrooms} bed${bedrooms === 1 ? "" : "s"}`);
  if (bathrooms != null && bathrooms > 0) parts.push(`${bathrooms} bath${bathrooms === 1 ? "" : "s"}`);
  if (sizeSqm != null && sizeSqm > 0) parts.push(`${sizeSqm} sqm`);
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

const ACTIVITY_TITLE_BY_TYPE: Record<string, string> = {
  property_inquiry: "Property inquiry",
  property_viewing_requested: "Viewing request",
  property_listing_submitted: "Listing submitted",
  property_listing_updated: "Listing updated",
  property_listing_reviewed: "Listing review complete",
};

export function activityTitle(activityType: string | null | undefined): string {
  const k = String(activityType ?? "");
  return ACTIVITY_TITLE_BY_TYPE[k] || k.replace(/_/g, " ");
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

export function buildHeadline(state: HeroState, stats: PropertyStats): string {
  if (state === "empty") return "Start exploring HenryCo Property.";
  if (state === "active") {
    if (stats.viewings > 0) {
      return `${stats.viewings} viewing${stats.viewings === 1 ? "" : "s"} scheduled.`;
    }
    return `${stats.inquiries} inquir${stats.inquiries === 1 ? "y" : "ies"} live.`;
  }
  return `${stats.saved} shortlisted home${stats.saved === 1 ? "" : "s"}.`;
}

export function buildBlurb(state: HeroState): string {
  if (state === "empty") {
    return "Discover residential rentals, sale listings, and HenryCo-managed homes. Save your favourites and every inquiry, viewing, or listing follow-up lands here automatically.";
  }
  if (state === "active") {
    return "Your shortlist, inquiries, and viewing schedule live in one room. Pick up where you left off — every action is mirrored from HenryCo Property in real time.";
  }
  return "Saved homes ready to revisit. Open a listing to request a viewing or send an inquiry, and the follow-up will mirror straight back into this room.";
}

/* ---- Side-panel "By activity" breakdown ----------------------------- */

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
export function activityBreakdown(stats: PropertyStats): ReadonlyArray<ActivityBreakdownItem> {
  const rows: ActivityBreakdownItem[] = [
    { key: "saved",    label: "Saved",     count: stats.saved,     color: "var(--acct-purple)" },
    { key: "inquiry",  label: "Inquiries", count: stats.inquiries, color: "var(--acct-blue)" },
    { key: "viewing",  label: "Viewings",  count: stats.viewings,  color: "var(--acct-gold)" },
    { key: "listing",  label: "Listings",  count: stats.listings,  color: "var(--acct-green)" },
  ];
  return rows.filter((r) => r.count > 0);
}

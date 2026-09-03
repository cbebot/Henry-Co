// V3-49 — Services catalog (vertical-agnostic) types + in-code default.
//
// The default mirrors the SQL seed (apps/care/supabase/migrations/
// 20260614120500_care_services_catalog_seed.sql) 1:1 so the public surfaces
// render the real 11-vertical catalog even before the migration is applied to
// prod — exactly like DEFAULT_CARE_BOOKING_CATALOG backs the booking path. Once
// the migration + seed land, the DB rows (same content, now staff-editable)
// take over and this default is the resilient fallback. Keep the two in sync.
//
// Money is BIGINT minor units (kobo). Render via formatMoney(minor, "NGN") from
// @henryco/i18n/currency — never the care-local naira formatter. The pricing_model
// shape is owned + validated by @henryco/pricing (never parsed ad hoc).

import type { ServicePricingKind, ServicePricingModel } from "@henryco/pricing";

export type { ServicePricingKind, ServicePricingModel };

export type ServiceStatus = "active" | "draft" | "retired";

export type ServiceVertical = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  icon: string; // lucide icon name
  division: string;
  display_order: number;
  status: ServiceStatus;
};

export type CatalogService = {
  id: string;
  vertical_slug: string; // resolved relationship for grouping/rendering
  slug: string;
  name: string;
  summary: string;
  description: string;
  pricing_model: ServicePricingModel;
  base_price_minor: number | null; // kobo; null ⇒ price on request
  currency: string;
  duration_minutes: number | null;
  provider_supplied: boolean;
  source_table: string | null;
  status: ServiceStatus;
};

export type ServicesCatalog = {
  verticals: ServiceVertical[];
  services: CatalogService[];
};

export const SERVICE_VERTICAL_SLUGS = [
  "garment-care",
  "laundry",
  "home-cleaning",
  "office-cleaning",
  "deep-cleaning",
  "repairs",
  "errands",
  "moving",
  "event-support",
  "business-support",
  "provider-assisted",
] as const;

const DEFAULT_SERVICE_VERTICALS: ServiceVertical[] = [
  { id: "vert_garment_care", slug: "garment-care", name: "Garment Care", summary: "Dry cleaning, pressing, stain treatment, and delicate handling.", icon: "Shirt", division: "care", display_order: 10, status: "active" },
  { id: "vert_laundry", slug: "laundry", name: "Laundry & Wash", summary: "Wash, dry, fold, and press for everyday and bulk loads.", icon: "WashingMachine", division: "care", display_order: 20, status: "active" },
  { id: "vert_home_cleaning", slug: "home-cleaning", name: "Home Cleaning", summary: "One-time, recurring, and routine residential cleaning.", icon: "Home", division: "care", display_order: 30, status: "active" },
  { id: "vert_office_cleaning", slug: "office-cleaning", name: "Office Cleaning", summary: "Professional commercial cleaning for offices and workspaces.", icon: "Building2", division: "care", display_order: 40, status: "active" },
  { id: "vert_deep_cleaning", slug: "deep-cleaning", name: "Deep Cleaning", summary: "High-intensity resets for kitchens, bathrooms, and turnovers.", icon: "Sparkles", division: "care", display_order: 50, status: "active" },
  { id: "vert_repairs", slug: "repairs", name: "Repairs & Fixes", summary: "Handyman work, fittings, and minor home and office repairs.", icon: "Wrench", division: "care", display_order: 60, status: "active" },
  { id: "vert_errands", slug: "errands", name: "Errands & Tasks", summary: "Pickups, drop-offs, queueing, and the personal tasks you hand off.", icon: "ListChecks", division: "care", display_order: 70, status: "active" },
  { id: "vert_moving", slug: "moving", name: "Moving & Relocation", summary: "Packing, loading, and relocation support for a calm moving day.", icon: "Truck", division: "care", display_order: 80, status: "active" },
  { id: "vert_event_support", slug: "event-support", name: "Event Support", summary: "Set-up, staffing, and a thorough reset for your events.", icon: "PartyPopper", division: "care", display_order: 90, status: "active" },
  { id: "vert_business_support", slug: "business-support", name: "Business Support", summary: "Standing operational care and concierge support for businesses.", icon: "Briefcase", division: "care", display_order: 100, status: "active" },
  { id: "vert_provider_assisted", slug: "provider-assisted", name: "Provider-Assisted", summary: "Specialist services delivered by verified providers.", icon: "BadgeCheck", division: "care", display_order: 110, status: "active" },
];

function svc(
  vertical_slug: string,
  slug: string,
  name: string,
  summary: string,
  description: string,
  kind: ServicePricingKind,
  base_price_minor: number | null,
  duration_minutes: number | null,
  provider_supplied: boolean,
  source_table: string | null,
): CatalogService {
  return {
    id: `svc_${slug.replace(/-/g, "_")}`,
    vertical_slug,
    slug,
    name,
    summary,
    description,
    pricing_model: { kind },
    base_price_minor,
    currency: "NGN",
    duration_minutes,
    provider_supplied,
    source_table,
    status: "active",
  };
}

const DEFAULT_CATALOG_SERVICES: CatalogService[] = [
  // garment care
  svc("garment-care", "dry-cleaning-essentials", "Dry Cleaning Essentials", "Professional dry cleaning for suits, dresses, and everyday formalwear.", "Garments are sorted, treated, dry cleaned, finished, and returned ready to wear — with delicate fabrics handled by hand.", "from", 300000, 90, false, null),
  svc("garment-care", "pressing-and-finishing", "Pressing & Finishing", "Crisp pressing and finishing for shirts, trousers, and formalwear.", "A fast turnaround for pieces that just need to look sharp — pressed, finished, and packed.", "from", 120000, 45, false, null),
  svc("garment-care", "stain-and-delicate-care", "Stain & Delicate Care", "Specialist stain treatment and careful handling for delicate fabrics.", "Targeted stain treatment and low-risk handling for silk, wool, and embellished garments that deserve extra care.", "from", 350000, 120, false, null),
  // laundry
  svc("laundry", "wash-dry-fold", "Wash, Dry & Fold", "Everyday laundry washed, dried, neatly folded, and returned.", "Drop your everyday load and get it back clean, dried, and folded — the routine task, handled.", "from", 500000, 1440, false, null),
  svc("laundry", "bulk-laundry-service", "Bulk Laundry Service", "High-volume laundry for households, hostels, and small businesses.", "A higher-capacity wash plan for the loads that are too large for a single run, with consistent turnaround.", "from", 1200000, 1440, false, null),
  svc("laundry", "ironing-service", "Ironing Service", "Pressed and ready-to-wear ironing for full loads.", "Send a full load of clean clothes and receive them pressed, folded, and ready to wear.", "from", 400000, 720, false, null),
  // home cleaning (bookable — slugs match the live booking packages)
  svc("home-cleaning", "signature-home-refresh", "Signature Home Refresh", "A one-time residential reset for bedrooms, bathrooms, and living areas.", "Surfaces, kitchen touchpoints, bathrooms, and presentation-focused finishing in a single thorough visit.", "flat", 2600000, 210, false, "care_service_packages"),
  svc("home-cleaning", "weekly-home-ritual", "Weekly Home Ritual", "A recurring weekly plan that keeps your home consistently cared for.", "Lighter, regular resets designed to hold a consistent standard week after week.", "flat", 2200000, 180, false, "care_service_packages"),
  // office cleaning (bookable)
  svc("office-cleaning", "office-starter", "Office Starter", "Maintenance cleaning for compact teams, suites, and tidy floors.", "A right-sized plan for small offices that keeps workspaces, reception, and shared areas presentable.", "flat", 4200000, 240, false, "care_service_packages"),
  svc("office-cleaning", "office-growth", "Office Growth", "Recurring medium-office cleaning with reception and shared-area depth.", "Adds reception, shared workspace, restroom, and common-area depth for growing teams.", "flat", 6500000, 300, false, "care_service_packages"),
  svc("office-cleaning", "after-hours-command", "After-hours Command", "A quiet-window workspace reset for teams that need zero disruption.", "Cleaning scheduled in the night window so your team never loses a working minute.", "flat", 7200000, 330, false, "care_service_packages"),
  // deep cleaning
  svc("deep-cleaning", "deep-reset", "Deep Reset", "A high-intensity deep clean for kitchens, bathrooms, and neglected detail.", "A heavy, detail-line clean for kitchens, bathrooms, and the build-up that routine cleaning leaves behind.", "flat", 4200000, 320, false, "care_service_packages"),
  svc("deep-cleaning", "move-in-move-out-clean", "Move-in / Move-out Clean", "A full turnover clean prepared for vacant properties and handovers.", "A complete reset for empty properties — built for move transitions, handovers, and turnover quality.", "from", 5000000, 360, false, null),
  // repairs (provider-supplied)
  svc("repairs", "home-repairs-handyman", "Home Repairs & Handyman", "Fittings, fixes, and minor home repairs handled by a verified pro.", "The small jobs that pile up — fittings, mounts, and minor repairs — handled in one visit by a verified provider.", "from", 800000, 120, true, null),
  svc("repairs", "appliance-fitting", "Appliance Fitting", "Safe installation and fitting for home and office appliances.", "Correct, safe installation and fitting for the appliances that need a steady, qualified hand.", "from", 1000000, 120, true, null),
  // errands
  svc("errands", "personal-errands", "Personal Errands", "Pickups, drop-offs, queueing, and the tasks you would rather hand off.", "A flexible block of time to run the errands and tasks that take up your day.", "from", 600000, 120, false, null),
  svc("errands", "pickup-and-dropoff", "Pickup & Drop-off", "Reliable courier pickups and drop-offs across the service area.", "A dependable pickup-and-drop-off run for documents, parcels, and the things that need to move.", "from", 450000, 90, false, null),
  // moving
  svc("moving", "home-move-support", "Home Move Support", "Packing, loading, and relocation support for a calm moving day.", "A coordinated team for packing, loading, and the moving-day work, delivered by a verified provider.", "from", 4500000, 480, true, null),
  svc("moving", "packing-service", "Packing Service", "Careful, labelled packing so nothing arrives broken or lost.", "Methodical, labelled packing of your home or office so the move stays organised and nothing is lost.", "from", 1800000, 240, false, null),
  // event support
  svc("event-support", "event-setup-and-cleanup", "Event Setup & Cleanup", "Set-up before and a thorough reset after your event.", "Arrive to a prepared space and leave the clean-up to us — set-up before and a full reset after.", "from", 3500000, 360, false, null),
  svc("event-support", "event-staffing", "Event Staffing", "Verified support staff for the run of your event.", "Vetted support staff scheduled for the run of your event and scoped to what the day needs.", "quote", null, null, true, null),
  // business support
  svc("business-support", "recurring-facility-care", "Recurring Facility Care", "A standing operational care plan for offices and facilities.", "A standing plan that keeps offices and facilities consistently maintained on a schedule you set.", "from", 8000000, 480, false, null),
  svc("business-support", "business-concierge", "Business Concierge", "An ongoing support partner for the errands your business runs on.", "A recurring concierge for the operational errands and tasks that keep a business moving.", "from", 6000000, null, false, null),
  // provider-assisted
  svc("provider-assisted", "specialist-deep-clean", "Specialist Deep Clean", "Specialist-grade deep cleaning delivered by a verified provider.", "A specialist-grade deep clean for demanding spaces, delivered by a verified provider.", "from", 5000000, 360, true, null),
  svc("provider-assisted", "verified-specialist-service", "Verified Specialist Service", "Bespoke specialist work scoped and quoted by a verified provider.", "Bespoke specialist work scoped to your request and quoted by a verified provider before any commitment.", "quote", null, null, true, null),
];

export function getDefaultServicesCatalog(): ServicesCatalog {
  return {
    verticals: [...DEFAULT_SERVICE_VERTICALS].sort((a, b) => a.display_order - b.display_order),
    services: [...DEFAULT_CATALOG_SERVICES],
  };
}

/** Group active services under their vertical, in display order. */
export function groupServicesByVertical(
  catalog: ServicesCatalog,
): Array<{ vertical: ServiceVertical; services: CatalogService[] }> {
  const activeVerticals = catalog.verticals
    .filter((v) => v.status === "active")
    .sort((a, b) => a.display_order - b.display_order);
  return activeVerticals.map((vertical) => ({
    vertical,
    services: catalog.services
      .filter((s) => s.status === "active" && s.vertical_slug === vertical.slug)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export function findVerticalBySlug(catalog: ServicesCatalog, slug: string): ServiceVertical | null {
  return catalog.verticals.find((v) => v.slug === slug && v.status === "active") ?? null;
}

export function findServiceBySlug(
  catalog: ServicesCatalog,
  verticalSlug: string,
  serviceSlug: string,
): CatalogService | null {
  return (
    catalog.services.find(
      (s) =>
        s.status === "active" &&
        s.slug === serviceSlug &&
        s.vertical_slug === verticalSlug,
    ) ?? null
  );
}

/** Resolve a service by slug alone (the /book handoff only carries the slug). */
export function findServiceBySlugAnyVertical(
  catalog: ServicesCatalog,
  serviceSlug: string,
): CatalogService | null {
  return catalog.services.find((s) => s.status === "active" && s.slug === serviceSlug) ?? null;
}

import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { fetchNoStore } from "./no-store-fetch";

// V3-49 — hub services directory reader. Reads service_verticals with the anon
// key (public catalog, RLS-gated to active rows) the same way divisions.ts reads
// company_divisions. Falls back to an in-code list when the table is absent (not
// yet applied to prod) or env is missing (preview deploys) — so the hub /services
// directory always renders the real 11 verticals. Keep FALLBACK_VERTICALS in sync
// with apps/care/supabase/migrations/20260614120500_care_services_catalog_seed.sql.

export type HubServiceVertical = {
  slug: string;
  name: string;
  summary: string;
  icon: string;
  display_order: number;
  service_count: number;
};

export type HubServicesResult = {
  verticals: HubServiceVertical[];
  hasServerError: boolean;
};

const FALLBACK_VERTICALS: HubServiceVertical[] = [
  { slug: "garment-care", name: "Garment Care", summary: "Dry cleaning, pressing, stain treatment, and delicate handling.", icon: "Shirt", display_order: 10, service_count: 3 },
  { slug: "laundry", name: "Laundry & Wash", summary: "Wash, dry, fold, and press for everyday and bulk loads.", icon: "WashingMachine", display_order: 20, service_count: 3 },
  { slug: "home-cleaning", name: "Home Cleaning", summary: "One-time, recurring, and routine residential cleaning.", icon: "Home", display_order: 30, service_count: 2 },
  { slug: "office-cleaning", name: "Office Cleaning", summary: "Professional commercial cleaning for offices and workspaces.", icon: "Building2", display_order: 40, service_count: 3 },
  { slug: "deep-cleaning", name: "Deep Cleaning", summary: "High-intensity resets for kitchens, bathrooms, and turnovers.", icon: "Sparkles", display_order: 50, service_count: 2 },
  { slug: "repairs", name: "Repairs & Fixes", summary: "Handyman work, fittings, and minor home and office repairs.", icon: "Wrench", display_order: 60, service_count: 2 },
  { slug: "errands", name: "Errands & Tasks", summary: "Pickups, drop-offs, queueing, and the personal tasks you hand off.", icon: "ListChecks", display_order: 70, service_count: 2 },
  { slug: "moving", name: "Moving & Relocation", summary: "Packing, loading, and relocation support for a calm moving day.", icon: "Truck", display_order: 80, service_count: 2 },
  { slug: "event-support", name: "Event Support", summary: "Set-up, staffing, and a thorough reset for your events.", icon: "PartyPopper", display_order: 90, service_count: 2 },
  { slug: "business-support", name: "Business Support", summary: "Standing operational care and concierge support for businesses.", icon: "Briefcase", display_order: 100, service_count: 2 },
  { slug: "provider-assisted", name: "Provider-Assisted", summary: "Specialist services delivered by verified providers.", icon: "BadgeCheck", display_order: 110, service_count: 2 },
];

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

async function computeServiceVerticals(): Promise<HubServicesResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { verticals: FALLBACK_VERTICALS, hasServerError: false };
  }

  try {
    const supabase = createClient(url, anon, { global: { fetch: fetchNoStore } });
    const [verticalsRes, servicesRes] = await Promise.all([
      supabase
        .from("service_verticals")
        .select("id, slug, name, summary, icon, display_order")
        .eq("status", "active")
        .order("display_order", { ascending: true }),
      supabase.from("catalog_services").select("vertical_id").eq("status", "active"),
    ]);

    const rows = verticalsRes.data as Record<string, unknown>[] | null;
    if (verticalsRes.error || !rows || rows.length === 0) {
      return { verticals: FALLBACK_VERTICALS, hasServerError: false };
    }

    const counts = new Map<string, number>();
    for (const row of (servicesRes.data as Record<string, unknown>[] | null) ?? []) {
      const id = asText(row.vertical_id);
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    const verticals: HubServiceVertical[] = rows
      .map((row) => ({
        slug: asText(row.slug),
        name: asText(row.name),
        summary: asText(row.summary),
        icon: asText(row.icon),
        display_order: asNumber(row.display_order, 0),
        service_count: counts.get(asText(row.id)) ?? 0,
      }))
      .filter((vertical) => vertical.slug)
      .sort((a, b) => a.display_order - b.display_order);

    return { verticals, hasServerError: false };
  } catch {
    return { verticals: FALLBACK_VERTICALS, hasServerError: true };
  }
}

export const getServiceVerticals = unstable_cache(
  computeServiceVerticals,
  ["hub-services-directory"],
  { revalidate: 60, tags: ["hub-home"] },
);
